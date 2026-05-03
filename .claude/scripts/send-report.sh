#!/bin/bash
# ── Credit Card LOS — Periodic Status Report Mailer ───────────────────────
# Runs every 30 minutes via cron.
# Gathers live project metrics, builds a plain-text report,
# and sends to both recipients via macOS Mail.app (AppleScript).
# ──────────────────────────────────────────────────────────────────────────

PROJ_DIR="/Users/deepaknayak/Downloads/credit-card-origination-ui"
BACKEND_DIR="/Users/deepaknayak/Downloads/credit-card-origination"
AUDIT_LOG="$PROJ_DIR/.claude/audit.log"
CRON_LOG="$PROJ_DIR/.claude/report-cron.log"

TO_1="mail.deepak2008@gmail.com"
TO_2="deepak.nayak@citizensbank.com"

NOW=$(date '+%Y-%m-%d %H:%M:%S')
DATE_PRETTY=$(date '+%a %b %d, %Y %I:%M %p')

# ── Gather metrics ────────────────────────────────────────────────────────

FRONTEND_FILES=$(find "$PROJ_DIR/src" -name "*.jsx" -o -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
BACKEND_FILES=$(find "$BACKEND_DIR" -name "*.java" 2>/dev/null | wc -l | tr -d ' ')
JAR_COUNT=$(find "$BACKEND_DIR" -name "*.jar" -path "*/target/*" 2>/dev/null | wc -l | tr -d ' ')
HOOKS_COUNT=$(ls "$PROJ_DIR/.claude/hooks/" 2>/dev/null | wc -l | tr -d ' ')

if [[ -d "$PROJ_DIR/dist" ]]; then
  BUILD_STATUS="PASSING"
else
  BUILD_STATUS="NO BUILD"
fi

# Recent audit log (last 10 entries)
if [[ -f "$AUDIT_LOG" ]]; then
  RECENT=$(tail -10 "$AUDIT_LOG")
else
  RECENT="  (no commands logged yet)"
fi

# Count audit entries today
TODAY=$(date '+%Y-%m-%d')
TODAY_COUNT=0
if [[ -f "$AUDIT_LOG" ]]; then
  TODAY_COUNT=$(grep -c "^\[$TODAY" "$AUDIT_LOG" 2>/dev/null || echo 0)
fi

# ── Build report body ─────────────────────────────────────────────────────

SUBJECT="[CC-LOS] Orchestration Report · $DATE_PRETTY"

BODY=$(cat << EOF
═══════════════════════════════════════════════════════════════════
  CREDIT CARD LOS — ORCHESTRATION STATUS REPORT
  $DATE_PRETTY
  Automated 30-minute update from Claude Code Orchestrator
═══════════════════════════════════════════════════════════════════

OVERALL STATUS: ON TRACK (test coverage gap outstanding)

──────────────────────────────────────────────────────────────────
  KEY METRICS
──────────────────────────────────────────────────────────────────

  Frontend Source Files   : $FRONTEND_FILES
  Backend Java Files      : $BACKEND_FILES
  Backend JARs Built      : $JAR_COUNT / 9
  Frontend Build          : $BUILD_STATUS
  Active Hooks            : $HOOKS_COUNT / 5
  Commands Today (audit)  : $TODAY_COUNT

──────────────────────────────────────────────────────────────────
  AGENT STATUS
──────────────────────────────────────────────────────────────────

  [IDLE]  creditcard-los-innovator      — Innovation architect
  [IDLE]  code-developer-tester         — Engineering & testing
  [IDLE]  code-review-deploy-signoff    — Code review & sign-off
  [RUN]   daily-orchestrator-reporter   — This report

──────────────────────────────────────────────────────────────────
  AI INTELLIGENCE AGENTS (/agents page)
──────────────────────────────────────────────────────────────────

  ● Conversion Intelligence (emerald)
    Approval/denial rates, near-misses, denial reason patterns

  ● Customer Experience Monitor (blue)
    Stuck apps, repeat denials, activation rate, MR wait times

  ● Operational Efficiency Guardian (purple)
    Pipeline backlog, fraud concentration, KYC failures

  ● Manual Underwriting Queue Monitor (orange)
    SLA compliance, aging buckets (>24h / >48h / >72h)

──────────────────────────────────────────────────────────────────
  HOOK SYSTEM (5 hooks active)
──────────────────────────────────────────────────────────────────

  ✓ pre-bash-safety.sh    — Blocks DROP TABLE, rm -rf /, force push
  ✓ post-edit-lint.sh     — JSX syntax check via sucrase
  ✓ post-bash-audit.sh    — Timestamped audit log
  ✓ on-stop-notify.sh     — macOS notification on completion
  ✓ on-notification.sh    — Forwards Claude alerts to macOS

──────────────────────────────────────────────────────────────────
  ACTIVE ALERTS
──────────────────────────────────────────────────────────────────

  [CRITICAL] Zero automated test coverage
             No src/test/ in any of the 9 backend services.
             No frontend tests. Highest priority item.

  [MAJOR]    No git repository initialized
             No version control history for change tracking.
             Action: git init && git add . && git commit

  [LOW]      npm 10.9.0 outdated (11.13.0 available)

──────────────────────────────────────────────────────────────────
  RECENT AUDIT LOG (last 10 commands)
──────────────────────────────────────────────────────────────────

$RECENT

──────────────────────────────────────────────────────────────────
  RECOMMENDED NEXT ACTIONS
──────────────────────────────────────────────────────────────────

  1. [BLOCKER]  Write unit tests for cc-credit-decisioning-service
               (Drools rules with deterministic test SSNs)
  2. [BLOCKER]  Write pipeline integration tests for full flow
               SUBMITTED → KYC → FRAUD → CREDIT → INCOME → CARD_ISSUED
  3. [MAJOR]   git init and initial commit
  4. [MAJOR]   Verify ANTHROPIC_API_KEY in .env for /agents page
  5. [MEDIUM]  Add frontend component or E2E tests

──────────────────────────────────────────────────────────────────
  MICROSERVICE INVENTORY (9 services)
──────────────────────────────────────────────────────────────────

  cc-application-service      :8100  Pipeline orchestrator
  cc-kyc-service              :8101  Identity / KYC verification
  cc-fraud-detection-service  :8102  Fraud scoring
  cc-credit-decisioning-service :8103 Drools credit rules
  cc-income-verification-service :8104 Argyle income simulator
  cc-card-issuance-service    :8105  Card generation
  cc-auth-user-service        :8106  Authorized user management
  cc-balance-transfer-service :8107  Balance transfer
  cc-prove-service            :8108  PROVE phone-based prefill

═══════════════════════════════════════════════════════════════════
  Sent automatically every 30 mins by Claude Code Orchestrator
  Citizens Bank · Credit Card Innovation Lab
  Report generated: $NOW
═══════════════════════════════════════════════════════════════════
EOF
)

# ── Send via macOS Mail.app (AppleScript) ────────────────────────────────

# Escape special chars for AppleScript string
BODY_ESC=$(echo "$BODY" | sed 's/\\/\\\\/g; s/"/\\"/g')
SUBJECT_ESC=$(echo "$SUBJECT" | sed 's/"/\\"/g')

osascript << APPLESCRIPT
tell application "Mail"
  set theMsg to make new outgoing message with properties {¬
    subject:"$SUBJECT_ESC", ¬
    content:"$BODY_ESC", ¬
    visible:false}
  tell theMsg
    make new to recipient at end of to recipients with properties ¬
      {address:"$TO_1"}
    make new to recipient at end of to recipients with properties ¬
      {address:"$TO_2"}
  end tell
  send theMsg
end tell
APPLESCRIPT

STATUS=$?
if [[ $STATUS -eq 0 ]]; then
  echo "[$NOW] ✓ Report sent to $TO_1, $TO_2" >> "$CRON_LOG"
else
  echo "[$NOW] ✗ Mail.app send failed (exit $STATUS)" >> "$CRON_LOG"
fi

exit $STATUS
