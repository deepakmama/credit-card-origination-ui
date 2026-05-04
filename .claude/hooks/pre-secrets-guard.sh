#!/bin/bash
# ── PreToolUse: Secrets guard — block API keys from version control ────────
# Fires before every Bash command.
# Intercepts git add / git commit and scans for:
#   - .env files being staged explicitly or via bulk add
#   - Anthropic API key pattern (sk-ant-*) in staged diff
#   - ANTHROPIC_API_KEY assignments in staged diff
#   - Any generic high-entropy secret-like patterns in .env files
#
# Exit 2 → hard block
# Exit 0 → allow

INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

# Only inspect git commands
if ! echo "$CMD" | grep -qE '^\s*git\s'; then
    exit 0
fi

# ── Extract repo dir from -C flag (if present) ───────────────────────────
REPO_DIR=$(echo "$CMD" | python3 -c "
import re, sys
cmd = sys.stdin.read()
m = re.search(r'git\s+-C\s+(\S+)', cmd)
print(m.group(1) if m else '.')
" 2>/dev/null)

# ── 1. Block explicit git add of .env files ──────────────────────────────
if echo "$CMD" | grep -qE 'git(\s+-C\s+\S+)?\s+add\s+.*\.env'; then
    echo "🚫 BLOCKED: Attempting to stage a .env file." >&2
    echo "   File may contain ANTHROPIC_API_KEY or other secrets." >&2
    echo "   Add '.env' to .gitignore instead." >&2
    exit 2
fi

# ── 2. Block bulk git add (-A / --all / .) if .env would be swept in ─────
if echo "$CMD" | grep -qE 'git(\s+-C\s+\S+)?\s+add\s+(-A|--all|\.\s*$|\.\s+)'; then
    if git -C "$REPO_DIR" ls-files --others --exclude-standard 2>/dev/null | grep -qE '(^|/)\.env(\.|$)'; then
        echo "🚫 BLOCKED: Bulk 'git add' would stage a .env file." >&2
        echo "   .env is not gitignored and contains secrets." >&2
        echo "   Add '.env' to .gitignore first, then re-run." >&2
        exit 2
    fi
fi

# ── 3. Scan staged diff before every git commit ──────────────────────────
if echo "$CMD" | grep -qE 'git(\s+-C\s+\S+)?\s+commit'; then
    STAGED=$(git -C "$REPO_DIR" diff --cached 2>/dev/null)

    # Anthropic API key: sk-ant-api03-... or sk-ant-...
    if echo "$STAGED" | grep -qE '\bsk-ant-[A-Za-z0-9_-]{20,}'; then
        echo "🚫 BLOCKED: Anthropic API key (sk-ant-*) detected in staged changes!" >&2
        echo "   Remove the key and use environment variables instead." >&2
        exit 2
    fi

    # ANTHROPIC_API_KEY=<value> assignment
    if echo "$STAGED" | grep -qiE 'ANTHROPIC_API_KEY\s*[=:]\s*[A-Za-z0-9_-]{10,}'; then
        echo "🚫 BLOCKED: ANTHROPIC_API_KEY assignment detected in staged changes!" >&2
        echo "   Store keys in .env (gitignored), never in source files." >&2
        exit 2
    fi

    # Generic secret patterns — other common API key formats
    if echo "$STAGED" | grep -qiE '(API_KEY|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN)\s*[=:]\s*[A-Za-z0-9/+_-]{20,}'; then
        echo "⚠️  WARNING: Possible secret value detected in staged changes." >&2
        echo "   Pattern: API_KEY / SECRET_KEY / ACCESS_TOKEN / AUTH_TOKEN assignment." >&2
        echo "   Verify this is not a real credential before proceeding." >&2
        # Soft warning only (exit 0) — don't hard-block generics in case of false positives
    fi

    # Detect .env file being committed (belt-and-suspenders)
    if git -C "$REPO_DIR" diff --cached --name-only 2>/dev/null | grep -qE '(^|/)\.env(\.|$)'; then
        echo "🚫 BLOCKED: .env is in the staged files list for this commit!" >&2
        echo "   Run: git restore --staged .env" >&2
        exit 2
    fi
fi

exit 0
