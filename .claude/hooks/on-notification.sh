#!/bin/bash
# ── Notification: Forward Claude alerts to macOS ──────────────
# Fires when Claude emits a notification (permission requests, errors, etc.)

INPUT=$(cat)
MSG=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    msg = d.get('message', 'Claude needs your attention')
    # Truncate and sanitise for osascript
    msg = msg[:100].replace('\"', \"'\").replace('\\\\', '')
    print(msg)
except:
    print('Claude needs your attention')
" 2>/dev/null || echo "Claude needs your attention")

TITLE=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    t = d.get('title', 'Claude Code')
    print(t[:40])
except:
    print('Claude Code')
" 2>/dev/null || echo "Claude Code")

osascript \
  -e 'on run argv' \
  -e '  display notification (item 1 of argv) with title (item 2 of argv) subtitle "Credit Card LOS" sound name "Ping"' \
  -e 'end run' \
  -- "$MSG" "$TITLE" 2>/dev/null

exit 0
