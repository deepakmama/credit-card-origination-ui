#!/bin/bash
# ── PostToolUse: Audit log for every Bash command ─────────────
# Appends timestamped entries to .claude/audit.log
# Format: [YYYY-MM-DD HH:MM:SS] [exit:<code>] <command preview>

INPUT=$(cat)
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$HOOK_DIR/../audit.log"

CMD=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    cmd = d.get('tool_input', {}).get('command', '').strip()
    # Truncate long commands, replace newlines
    cmd = cmd.replace('\n', ' ').replace('\r', '')
    print(cmd[:200])
except:
    print('<parse error>')
" 2>/dev/null)

# Grab exit code from tool response if available
EXIT_CODE=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    resp = d.get('tool_response', {})
    # Response may include exit code in various forms
    if isinstance(resp, dict):
        print(resp.get('exit_code', resp.get('returncode', '?')))
    else:
        print('?')
except:
    print('?')
" 2>/dev/null)

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] [exit:$EXIT_CODE] $CMD" >> "$LOG_FILE"

exit 0
