#!/bin/bash
# ── Stop: Desktop notification when Claude finishes ───────────
# Fires after Claude completes its response / task

INPUT=$(cat)
SUMMARY=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    # Try to get a short summary from stop reason
    reason = d.get('stop_reason', '')
    if reason:
        print(f'Stopped: {reason}')
    else:
        print('Task complete')
except:
    print('Task complete')
" 2>/dev/null || echo "Task complete")

osascript \
  -e 'on run argv' \
  -e '  display notification (item 1 of argv) with title "Claude Code ✓" subtitle "Credit Card LOS" sound name "Glass"' \
  -e 'end run' \
  -- "$SUMMARY" 2>/dev/null

exit 0
