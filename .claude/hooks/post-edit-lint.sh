#!/bin/bash
# ── PostToolUse: JS/JSX syntax check after Edit or Write ──────
# Reads JSON from stdin: { tool_name, tool_input: { file_path }, tool_response }
# Exit 1 → surface syntax error to Claude (it will attempt a fix)
# Exit 0 → all good
#
# Strategy:
#   .js / .ts  → node --check (plain JS/TS, no JSX transforms needed)
#   .jsx/.tsx  → eslint with @babel/eslint-parser if available; else acorn-based
#                check via node with a small inline script; fallback: skip

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# Only process JS/JSX/TS/TSX files
if [[ ! "$FILE" =~ \.(jsx?|tsx?)$ ]]; then
    exit 0
fi

# File must exist
if [[ ! -f "$FILE" ]]; then
    exit 0
fi

BASENAME=$(basename "$FILE")
ERR_FILE=$(mktemp)
PROJ_DIR="/Users/deepaknayak/Downloads/credit-card-origination-ui"

# ── JSX / TSX: use sucrase (available in this Vite project) ──
if [[ "$FILE" =~ \.(jsx|tsx)$ ]]; then
    SUCRASE_MOD="$PROJ_DIR/node_modules/sucrase"
    if [[ -d "$SUCRASE_MOD" ]]; then
        ERR=$(node -e "
const {transform} = require('$SUCRASE_MOD');
const fs = require('fs');
try {
  const src = fs.readFileSync(process.argv[1], 'utf8');
  transform(src, {transforms: ['jsx', 'imports', 'typescript']});
} catch(e) {
  process.stderr.write(e.message + '\n');
  process.exit(1);
}
" "$FILE" 2>&1)
        if [[ $? -ne 0 ]]; then
            echo "❌ Syntax error in $BASENAME:" >&2
            echo "$ERR" >&2
            rm -f "$ERR_FILE"
            exit 1
        fi
        rm -f "$ERR_FILE"
        echo "✓ $BASENAME — syntax OK (sucrase)"
        exit 0
    fi
    # No sucrase — skip JSX files gracefully
    rm -f "$ERR_FILE"
    echo "ℹ️  $BASENAME — skipped (no JSX parser available)"
    exit 0
fi

# ── Plain .js / .ts: standard node --check with ESM support ──
# Try ESM first (handles import/export), fall back to CJS check
if node --input-type=module < "$FILE" 2>"$ERR_FILE" >/dev/null; then
    rm -f "$ERR_FILE"
    echo "✓ $BASENAME — syntax OK"
    exit 0
fi

if ! node --check "$FILE" 2>"$ERR_FILE"; then
    echo "❌ Syntax error in $BASENAME:" >&2
    cat "$ERR_FILE" >&2
    rm -f "$ERR_FILE"
    exit 1
fi

rm -f "$ERR_FILE"
echo "✓ $BASENAME — syntax OK"
exit 0
