#!/bin/bash
# ── PreToolUse: Bash safety guard ─────────────────────────────
# Reads JSON from stdin: { tool_name, tool_input: { command } }
# Exit 2 → block the tool call entirely
# Exit 1 → show warning, still allow
# Exit 0 → allow silently

INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

# ── Hard blocks (exit 2) ──────────────────────────────────────

if echo "$CMD" | grep -qiE 'DROP\s+(TABLE|DATABASE|SCHEMA)'; then
    echo "🚫 BLOCKED: Destructive SQL (DROP TABLE/DATABASE) detected." >&2
    echo "   Command: $(echo "$CMD" | head -1)" >&2
    echo "   Use psql manually if this is intentional." >&2
    exit 2
fi

if echo "$CMD" | grep -qiE '(^|\s)rm\s+(-[a-z]*f[a-z]*r[a-z]*|-[a-z]*r[a-z]*f[a-z]*)\s+/([^/]|$)'; then
    echo "🚫 BLOCKED: rm -rf on root-level path detected." >&2
    exit 2
fi

if echo "$CMD" | grep -qiE 'git\s+push.*(--force|-f)\s+(origin\s+)?(main|master)'; then
    echo "🚫 BLOCKED: Force push to main/master is not allowed." >&2
    exit 2
fi

if echo "$CMD" | grep -qiE 'DELETE\s+FROM\s+\w+\s*;?\s*$'; then
    echo "🚫 BLOCKED: DELETE without WHERE clause detected." >&2
    echo "   Add a WHERE clause or use psql manually." >&2
    exit 2
fi

# ── Soft warnings (exit 0, print to stderr) ───────────────────

if echo "$CMD" | grep -qiE 'TRUNCATE\s+'; then
    echo "⚠️  WARNING: TRUNCATE detected — this will delete all rows." >&2
fi

if echo "$CMD" | grep -qiE 'git\s+reset\s+--hard'; then
    echo "⚠️  WARNING: git reset --hard will discard all local changes." >&2
fi

if echo "$CMD" | grep -qiE 'npm\s+install\s+--save\b|npm\s+i\s+[^-]'; then
    echo "ℹ️  INFO: Installing npm package — ensure it's needed for production." >&2
fi

exit 0
