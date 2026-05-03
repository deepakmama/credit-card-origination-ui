import { useState, useEffect, useRef } from 'react'
import { getApplications, sendAgentMessage } from '../api/cardApi'

// ── System Prompts ────────────────────────────────────────────────────────────

const CONVERSION_PROMPT = `You are a Conversion Intelligence Agent for a Credit Card Loan Origination System at Citizens Bank.
Analyze the provided application metrics and identify conversion anomalies, bottlenecks, and opportunities.
Focus on: approval/denial rates by card type, near-miss applicants (borderline DTI/credit scores), manual review backlogs, and denial reason patterns.
Return ONLY raw JSON (no markdown, no code fences) in this exact format:
{
  "health_score": <0-100 integer>,
  "summary": "<one-sentence executive summary>",
  "anomalies": [
    {
      "severity": "CRITICAL|WARNING|INFO",
      "title": "<short title>",
      "description": "<detailed description with numbers>",
      "metric": "<key stat value>",
      "recommendation": "<immediate action>"
    }
  ],
  "recommendations": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "action": "<specific action>",
      "rationale": "<data-backed reason>",
      "expected_impact": "<quantified impact if possible>"
    }
  ]
}`

const CX_PROMPT = `You are a Customer Experience Monitor Agent for a Credit Card Loan Origination System at Citizens Bank.
Analyze the provided application metrics and identify customer experience issues, friction points, and satisfaction risks.
Focus on: stuck/stalled applications, repeat customers and repeat denials, card activation rates, manual review wait times, and journey completion.
Return ONLY raw JSON (no markdown, no code fences) in this exact format:
{
  "health_score": <0-100 integer>,
  "summary": "<one-sentence executive summary>",
  "anomalies": [
    {
      "severity": "CRITICAL|WARNING|INFO",
      "title": "<short title>",
      "description": "<detailed description with numbers>",
      "metric": "<key stat value>",
      "recommendation": "<immediate action>"
    }
  ],
  "recommendations": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "action": "<specific action>",
      "rationale": "<data-backed reason>",
      "expected_impact": "<quantified impact if possible>"
    }
  ]
}`

const OPS_PROMPT = `You are an Operational Efficiency Guardian Agent for a Credit Card Loan Origination System at Citizens Bank.
Analyze the provided application metrics and identify operational bottlenecks, processing inefficiencies, and risk concentrations.
Focus on: pipeline status distribution, processing time, fraud risk concentration, KYC/income verification failures, A/B test coverage, and daily volume trends.
Return ONLY raw JSON (no markdown, no code fences) in this exact format:
{
  "health_score": <0-100 integer>,
  "summary": "<one-sentence executive summary>",
  "anomalies": [
    {
      "severity": "CRITICAL|WARNING|INFO",
      "title": "<short title>",
      "description": "<detailed description with numbers>",
      "metric": "<key stat value>",
      "recommendation": "<immediate action>"
    }
  ],
  "recommendations": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "action": "<specific action>",
      "rationale": "<data-backed reason>",
      "expected_impact": "<quantified impact if possible>"
    }
  ]
}`

const UNDERWRITING_QUEUE_PROMPT = `You are a Manual Underwriting Queue Monitor Agent for a Credit Card Loan Origination System at Citizens Bank.
Analyze the provided manual underwriting queue metrics and detect anomalies related to applications waiting more than 24 hours for a decision.
Focus on: queue depth, aging buckets (>24h, >48h, >72h), SLA breaches, wait time distribution by card type and credit score band, oldest pending cases, and queue growth trends.
Key SLAs: >24h is a WARNING, >48h is a breach requiring escalation, >72h is CRITICAL requiring immediate intervention.
Return ONLY raw JSON (no markdown, no code fences) in this exact format:
{
  "health_score": <0-100 integer>,
  "summary": "<one-sentence executive summary>",
  "anomalies": [
    {
      "severity": "CRITICAL|WARNING|INFO",
      "title": "<short title>",
      "description": "<detailed description with numbers>",
      "metric": "<key stat value>",
      "recommendation": "<immediate action>"
    }
  ],
  "recommendations": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "action": "<specific action>",
      "rationale": "<data-backed reason>",
      "expected_impact": "<quantified impact if possible>"
    }
  ]
}`

// ── Metric Analysis Functions ─────────────────────────────────────────────────

function analyzeConversion(apps) {
  const total = apps.length
  if (total === 0) return { total: 0 }

  const denied = apps.filter(a => a.status === 'DENIED').length
  const approved = apps.filter(a => ['CARD_ISSUED', 'APPROVED'].includes(a.status)).length
  const manual = apps.filter(a => a.status === 'MANUAL_REVIEW').length

  const approvalRate = ((approved / total) * 100).toFixed(1)
  const denialRate = ((denied / total) * 100).toFixed(1)

  // By card type
  const cardTypes = ['CASH_BACK', 'BALANCE_TRANSFER', 'NEW_TO_CREDIT']
  const byCardType = {}
  cardTypes.forEach(ct => {
    const group = apps.filter(a => a.cardRequest?.cardType === ct)
    const groupDenied = group.filter(a => a.status === 'DENIED').length
    const groupIssued = group.filter(a => a.status === 'CARD_ISSUED').length
    byCardType[ct] = {
      total: group.length,
      denied: groupDenied,
      issued: groupIssued,
      denialRate: group.length ? ((groupDenied / group.length) * 100).toFixed(1) : '0.0',
    }
  })

  // Near misses
  const deniedApps = apps.filter(a => a.status === 'DENIED')
  const nearMissDTI = deniedApps.filter(a => a.dti >= 40 && a.dti <= 55).length
  const nearMissScore = deniedApps.filter(a => a.creditScore >= 600 && a.creditScore <= 650).length

  // Top denial reasons
  const reasonCounts = {}
  deniedApps.forEach(a => {
    const r = a.decisionReason || 'Unknown'
    reasonCounts[r] = (reasonCounts[r] || 0) + 1
  })
  const topDenialReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }))

  const preApprovedStuck = apps.filter(a =>
    a.status === 'SUBMITTED' && a.applicant?.existingBankRelationship
  ).length

  return {
    total, denied, approved, manual,
    approvalRate, denialRate,
    byCardType, nearMissDTI, nearMissScore,
    manualReviewCount: manual,
    preApprovedStuck,
    topDenialReasons,
  }
}

function analyzeCX(apps) {
  const total = apps.length
  if (total === 0) return { total: 0 }

  const now = Date.now()
  const terminalStatuses = ['DENIED', 'CARD_ISSUED', 'APPROVED']
  const nonTerminal = apps.filter(a => !terminalStatuses.includes(a.status))

  // Stuck apps (non-terminal, submitted > 1 hour ago)
  const stuckApps = nonTerminal
    .filter(a => {
      if (!a.submittedAt) return false
      const submittedMs = new Date(a.submittedAt).getTime()
      const hoursStuck = (now - submittedMs) / 3600000
      return hoursStuck > 1
    })
    .map(a => {
      const hoursStuck = ((now - new Date(a.submittedAt).getTime()) / 3600000).toFixed(1)
      return {
        name: `${a.applicant?.firstName || ''} ${a.applicant?.lastName || ''}`.trim() || 'Unknown',
        status: a.status,
        hoursStuck: parseFloat(hoursStuck),
      }
    })

  // Repeat customers (same email, 2+ apps)
  const emailGroups = {}
  apps.forEach(a => {
    const email = a.applicant?.email
    if (email) emailGroups[email] = (emailGroups[email] || 0) + 1
  })
  const repeatCustomers = Object.values(emailGroups).filter(c => c >= 2).length

  // Repeat denials (same email, 2+ DENIED)
  const emailDenials = {}
  apps.filter(a => a.status === 'DENIED').forEach(a => {
    const email = a.applicant?.email
    if (email) emailDenials[email] = (emailDenials[email] || 0) + 1
  })
  const repeatDenials = Object.values(emailDenials).filter(c => c >= 2).length

  // Manual review wait hours
  const manualApps = apps.filter(a => a.status === 'MANUAL_REVIEW' && a.submittedAt)
  const avgManualReviewWaitHours = manualApps.length
    ? (manualApps.reduce((sum, a) => sum + (now - new Date(a.submittedAt).getTime()) / 3600000, 0) / manualApps.length).toFixed(1)
    : '0.0'

  // Cards not activated
  const postIssuance = apps.filter(a => a.status === 'CARD_ISSUED')
  const cardsNotActivated = postIssuance.filter(a => a.activationStatus !== 'ACTIVE').length
  const activationRate = postIssuance.length
    ? (((postIssuance.length - cardsNotActivated) / postIssuance.length) * 100).toFixed(1)
    : '0.0'

  // Journey completion (authUserId set / all post-issuance)
  const withAuthUser = postIssuance.filter(a => a.authUserId).length
  const journeyCompletionRate = postIssuance.length
    ? ((withAuthUser / postIssuance.length) * 100).toFixed(1)
    : '0.0'

  return {
    total,
    stuckApps: stuckApps.slice(0, 5),   // cap to avoid oversized payload
    stuckCount: stuckApps.length,
    repeatCustomers,
    repeatDenials,
    avgManualReviewWaitHours,
    cardsNotActivated,
    activationRate,
    journeyCompletionRate,
    postIssuanceCount: postIssuance.length,
  }
}

function analyzeOps(apps) {
  const total = apps.length
  if (total === 0) return { total: 0 }

  const now = Date.now()
  const terminalStatuses = ['DENIED', 'CARD_ISSUED', 'APPROVED']

  // Status distribution
  const statusDistribution = {}
  apps.forEach(a => {
    statusDistribution[a.status] = (statusDistribution[a.status] || 0) + 1
  })

  // Avg processing seconds (terminal apps with both timestamps)
  const terminalWithTimes = apps.filter(a =>
    terminalStatuses.includes(a.status) && a.submittedAt && a.updatedAt
  )
  const avgProcessingSeconds = terminalWithTimes.length
    ? Math.round(terminalWithTimes.reduce((sum, a) => {
        return sum + (new Date(a.updatedAt).getTime() - new Date(a.submittedAt).getTime()) / 1000
      }, 0) / terminalWithTimes.length)
    : 0

  // Pipeline backlog (non-terminal)
  const nonTerminal = apps.filter(a => !terminalStatuses.includes(a.status))
  const pipelineBacklogCount = nonTerminal.length
  const pipelineBacklogByStage = {}
  nonTerminal.forEach(a => {
    pipelineBacklogByStage[a.status] = (pipelineBacklogByStage[a.status] || 0) + 1
  })

  // High fraud applications
  const highFraudApplications = apps.filter(a => a.fraudScore >= 70).length

  // KYC failures
  const kycFailures = apps.filter(a => a.kycVerified === false).length

  // Income verification issues in terminal apps
  const incomeVerificationIssues = apps.filter(a =>
    terminalStatuses.includes(a.status) && a.incomeVerified === false
  ).length

  // A/B test coverage
  const withAbTest = apps.filter(a => a.abTestExperimentId).length
  const abTestCoverage = total ? ((withAbTest / total) * 100).toFixed(1) : '0.0'

  // Daily volume (last 7 days)
  const last7DaysVolume = apps.filter(a => {
    if (!a.submittedAt) return false
    return (now - new Date(a.submittedAt).getTime()) < 7 * 24 * 3600000
  }).length

  const dailyAverage = (last7DaysVolume / 7).toFixed(1)

  // Volume by day
  const dailyVolumeByDay = {}
  apps.forEach(a => {
    if (!a.submittedAt) return
    const day = new Date(a.submittedAt).toISOString().slice(0, 10)
    dailyVolumeByDay[day] = (dailyVolumeByDay[day] || 0) + 1
  })

  return {
    total,
    statusDistribution,
    avgProcessingSeconds,
    pipelineBacklogCount,
    pipelineBacklogByStage,
    highFraudApplications,
    kycFailures,
    incomeVerificationIssues,
    abTestCoverage,
    last7DaysVolume,
    dailyAverage,
    dailyVolumeByDay,
  }
}

// ── Agent Configs ─────────────────────────────────────────────────────────────

function analyzeUnderwritingQueue(apps) {
  const total = apps.length
  if (total === 0) return { total: 0, queueSize: 0 }

  const now = Date.now()
  const queueApps = apps.filter(a => a.status === 'MANUAL_REVIEW')

  // Compute wait hours for each queued app (using updatedAt as queue-entry proxy)
  const withWait = queueApps.map(a => {
    const enteredAt = a.updatedAt || a.submittedAt
    const waitHours = enteredAt
      ? parseFloat(((now - new Date(enteredAt).getTime()) / 3600000).toFixed(1))
      : 0
    return {
      name: `${a.applicant?.firstName || a.firstName || ''} ${a.applicant?.lastName || a.lastName || ''}`.trim() || 'Unknown',
      cardType: a.cardRequest?.cardType || a.cardType || 'UNKNOWN',
      creditScore: a.creditScore,
      dti: a.dti,
      waitHours,
      submittedAt: a.submittedAt,
    }
  }).sort((a, b) => b.waitHours - a.waitHours)

  // Aging buckets
  const over24 = withWait.filter(a => a.waitHours > 24)
  const over48 = withWait.filter(a => a.waitHours > 48)
  const over72 = withWait.filter(a => a.waitHours > 72)

  const avgWaitHours = withWait.length
    ? parseFloat((withWait.reduce((s, a) => s + a.waitHours, 0) / withWait.length).toFixed(1))
    : 0
  const maxWaitHours = withWait.length ? withWait[0].waitHours : 0
  const oldestApp = withWait.length ? withWait[0] : null

  // By card type
  const byCardType = {}
  withWait.forEach(a => {
    if (!byCardType[a.cardType]) byCardType[a.cardType] = { count: 0, over24: 0, over48: 0, avgWait: 0, totalWait: 0 }
    byCardType[a.cardType].count++
    byCardType[a.cardType].totalWait += a.waitHours
    if (a.waitHours > 24) byCardType[a.cardType].over24++
    if (a.waitHours > 48) byCardType[a.cardType].over48++
  })
  Object.values(byCardType).forEach(v => {
    v.avgWait = v.count ? parseFloat((v.totalWait / v.count).toFixed(1)) : 0
    delete v.totalWait
  })

  // By credit score band
  const scoreBands = { '680-685': 0, '686-690': 0, '691-695': 0, '696-699': 0, 'other': 0 }
  withWait.forEach(a => {
    const s = a.creditScore
    if (!s) { scoreBands['other']++; return }
    if (s >= 680 && s <= 685) scoreBands['680-685']++
    else if (s >= 686 && s <= 690) scoreBands['686-690']++
    else if (s >= 691 && s <= 695) scoreBands['691-695']++
    else if (s >= 696 && s <= 699) scoreBands['696-699']++
    else scoreBands['other']++
  })

  // SLA compliance rate
  const slaCompliant = withWait.filter(a => a.waitHours <= 24).length
  const slaComplianceRate = withWait.length
    ? parseFloat(((slaCompliant / withWait.length) * 100).toFixed(1))
    : 100

  return {
    totalApplications: total,
    queueSize: withWait.length,
    over24hCount: over24.length,
    over48hCount: over48.length,
    over72hCount: over72.length,
    avgWaitHours,
    maxWaitHours,
    slaComplianceRate,
    oldestApp,
    longestWaiting: withWait.slice(0, 5),   // top 5 oldest
    byCardType,
    scoreBands,
  }
}

const AGENT_CONFIGS = [
  {
    id: 'conversion',
    name: 'Conversion Intelligence',
    emoji: '📈',
    headerBg: 'from-emerald-600 to-emerald-800',
    borderClass: 'border-emerald-200',
    accentClass: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    systemPrompt: CONVERSION_PROMPT,
    analyze: analyzeConversion,
    getMetrics: (m) => [
      { label: 'Approval Rate', value: m.approvalRate != null ? `${m.approvalRate}%` : '—', good: m.approvalRate >= 60 },
      { label: 'Denial Rate', value: m.denialRate != null ? `${m.denialRate}%` : '—', good: m.denialRate < 30 },
      { label: 'Near-Misses', value: m.nearMissDTI != null ? (m.nearMissDTI + m.nearMissScore) : '—', good: (m.nearMissDTI + m.nearMissScore) < 5 },
      { label: 'Manual Review', value: m.manualReviewCount != null ? m.manualReviewCount : '—', good: m.manualReviewCount < 3 },
    ],
  },
  {
    id: 'cx',
    name: 'Customer Experience Monitor',
    emoji: '🎯',
    headerBg: 'from-blue-600 to-blue-800',
    borderClass: 'border-blue-200',
    accentClass: 'text-blue-700',
    bgLight: 'bg-blue-50',
    systemPrompt: CX_PROMPT,
    analyze: analyzeCX,
    getMetrics: (m) => [
      { label: 'Stuck Apps', value: m.stuckCount != null ? m.stuckCount : '—', good: m.stuckCount === 0 },
      { label: 'Activation Rate', value: m.activationRate != null ? `${m.activationRate}%` : '—', good: m.activationRate >= 80 },
      { label: 'Repeat Denials', value: m.repeatDenials != null ? m.repeatDenials : '—', good: m.repeatDenials === 0 },
      { label: 'MR Wait (hrs)', value: m.avgManualReviewWaitHours != null ? m.avgManualReviewWaitHours : '—', good: parseFloat(m.avgManualReviewWaitHours) < 4 },
    ],
  },
  {
    id: 'ops',
    name: 'Operational Efficiency Guardian',
    emoji: '⚙️',
    headerBg: 'from-purple-700 to-purple-900',
    borderClass: 'border-purple-200',
    accentClass: 'text-purple-700',
    bgLight: 'bg-purple-50',
    systemPrompt: OPS_PROMPT,
    analyze: analyzeOps,
    getMetrics: (m) => [
      { label: 'Avg Processing (sec)', value: m.avgProcessingSeconds != null ? m.avgProcessingSeconds : '—', good: m.avgProcessingSeconds < 300 },
      { label: 'Pipeline Backlog', value: m.pipelineBacklogCount != null ? m.pipelineBacklogCount : '—', good: m.pipelineBacklogCount < 5 },
      { label: 'High Fraud', value: m.highFraudApplications != null ? m.highFraudApplications : '—', good: m.highFraudApplications === 0 },
      { label: 'KYC Failures', value: m.kycFailures != null ? m.kycFailures : '—', good: m.kycFailures === 0 },
    ],
  },
  {
    id: 'underwriting',
    name: 'Manual Underwriting Queue Monitor',
    emoji: '⏱️',
    headerBg: 'from-orange-500 to-orange-700',
    borderClass: 'border-orange-200',
    accentClass: 'text-orange-700',
    bgLight: 'bg-orange-50',
    systemPrompt: UNDERWRITING_QUEUE_PROMPT,
    analyze: analyzeUnderwritingQueue,
    getMetrics: (m) => [
      { label: 'Queue Size', value: m.queueSize != null ? m.queueSize : '—', good: m.queueSize < 5 },
      { label: '>24h Breaches', value: m.over24hCount != null ? m.over24hCount : '—', good: m.over24hCount === 0 },
      { label: '>48h Critical', value: m.over48hCount != null ? m.over48hCount : '—', good: m.over48hCount === 0 },
      { label: 'SLA Compliance', value: m.slaComplianceRate != null ? `${m.slaComplianceRate}%` : '—', good: m.slaComplianceRate >= 90 },
    ],
  },
]

// ── Sub-Components ────────────────────────────────────────────────────────────

function MetricTile({ label, value, good }) {
  const valueColor = value === '—' ? 'text-gray-400'
    : good ? 'text-emerald-600'
    : good === false ? 'text-red-500'
    : 'text-gray-800'

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center shadow-sm">
      <div className={`text-2xl font-bold ${valueColor}`}>{String(value)}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

const SEVERITY_STYLES = {
  CRITICAL: {
    border: 'border-red-300',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
    icon: '🔴',
  },
  WARNING: {
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
    icon: '🟡',
  },
  INFO: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    icon: '🔵',
  },
}

function AnomalyRow({ a }) {
  const styles = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.INFO
  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>{a.severity}</span>
            <span className="font-semibold text-gray-800 text-sm">{a.title}</span>
            {a.metric && (
              <span className="ml-auto text-xs font-mono bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-700 whitespace-nowrap">
                {a.metric}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{a.description}</p>
          {a.recommendation && (
            <div className="mt-1.5 flex items-start gap-1.5">
              <span className="text-xs text-gray-400 mt-0.5">→</span>
              <p className="text-xs text-gray-500 italic">{a.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const PRIORITY_BADGE = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-gray-100 text-gray-600',
}

function RecommendationRow({ r }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${PRIORITY_BADGE[r.priority] || PRIORITY_BADGE.LOW}`}>
        {r.priority}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{r.action}</p>
        {r.rationale && <p className="text-xs text-gray-500 mt-0.5">{r.rationale}</p>}
        {r.expected_impact && (
          <p className="text-xs text-emerald-600 mt-0.5 font-medium">Impact: {r.expected_impact}</p>
        )}
      </div>
    </div>
  )
}

function HealthScoreBadge({ score }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-white/70 text-xs">Health</span>
      <span className={`text-2xl font-black ${color}`}>{score}</span>
      <span className="text-white/50 text-sm">/100</span>
    </div>
  )
}

function AgentCard({ config, apps, runSignal, onComplete }) {
  const [state, setState] = useState('idle') // idle | running | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const prevSignal = useRef(0)
  const metrics = config.analyze(apps)
  const kpiTiles = config.getMetrics(metrics)

  async function run() {
    setState('running')
    setResult(null)
    setError(null)
    try {
      const userMessage = `Analyze the following Credit Card LOS application metrics and identify anomalies:\n\n${JSON.stringify(metrics, null, 2)}\n\nTotal applications: ${apps.length}`
      const response = await sendAgentMessage(config.systemPrompt, userMessage)
      const raw = response.content?.[0]?.text || ''
      // Extract JSON robustly: find first { and last }
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error(`No JSON object in response: ${raw.slice(0, 120)}`)
      const parsed = JSON.parse(raw.slice(start, end + 1))
      setResult(parsed)
      setState('done')
      onComplete(config.id, parsed)
    } catch (err) {
      console.error(`[${config.id} agent error]`, err)
      setError(err.message || 'Analysis failed')
      setState('error')
      onComplete(config.id, null)
    }
  }

  useEffect(() => {
    if (runSignal > prevSignal.current && apps.length > 0) {
      prevSignal.current = runSignal
      run()
    }
  }, [runSignal, apps.length])

  return (
    <div className={`rounded-xl border ${config.borderClass} overflow-hidden shadow-sm`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.headerBg} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.emoji}</span>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{config.name}</h2>
            <p className="text-white/60 text-xs mt-0.5">Agent · {apps.length} applications</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {state === 'done' && result && <HealthScoreBadge score={result.health_score} />}
          <button
            onClick={run}
            disabled={state === 'running' || apps.length === 0}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              state === 'running'
                ? 'bg-white/20 text-white/60 cursor-not-allowed'
                : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
            }`}
          >
            {state === 'running' ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing…
              </span>
            ) : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className={`${config.bgLight} px-6 py-4`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpiTiles.map(tile => (
            <MetricTile key={tile.label} {...tile} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Idle */}
        {state === 'idle' && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-sm">Click <strong>Run Analysis</strong> to start the {config.name} agent</p>
          </div>
        )}

        {/* Running skeleton */}
        {state === 'running' && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-16 bg-gray-100 rounded" />
            <div className="h-16 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-4" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-red-600 font-semibold text-sm">Analysis failed</p>
            <p className="text-red-400 text-xs mt-1">{error}</p>
            <button onClick={run} className="mt-3 text-xs text-red-600 underline">Retry</button>
          </div>
        )}

        {/* Results */}
        {state === 'done' && result && (
          <>
            {/* Summary */}
            <div className={`rounded-lg ${config.bgLight} border ${config.borderClass} px-4 py-3`}>
              <p className={`text-sm font-medium ${config.accentClass}`}>{result.summary}</p>
            </div>

            {/* Anomalies */}
            {result.anomalies?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">
                  Detected Anomalies ({result.anomalies.length})
                </h3>
                <div className="space-y-2">
                  {result.anomalies.map((a, i) => <AnomalyRow key={i} a={a} />)}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-1">
                  Recommendations ({result.recommendations.length})
                </h3>
                <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 px-4">
                  {result.recommendations.map((r, i) => <RecommendationRow key={i} r={r} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [runSignal, setRunSignal] = useState(0)
  const [agentResults, setAgentResults] = useState({})

  useEffect(() => {
    getApplications()
      .then(data => {
        setApps(Array.isArray(data) ? data : [])
        setFetchedAt(new Date().toLocaleTimeString())
      })
      .finally(() => setLoading(false))
  }, [])

  function handleComplete(agentId, result) {
    setAgentResults(prev => ({ ...prev, [agentId]: result }))
  }

  const criticalCount = Object.values(agentResults).reduce((sum, r) => {
    if (!r) return sum
    return sum + (r.anomalies?.filter(a => a.severity === 'CRITICAL').length || 0)
  }, 0)

  const warningCount = Object.values(agentResults).reduce((sum, r) => {
    if (!r) return sum
    return sum + (r.anomalies?.filter(a => a.severity === 'WARNING').length || 0)
  }, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">🤖 Intelligence Agents</h1>
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold animate-pulse">
                🔴 {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                🟡 {warningCount} Warning{warningCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {AGENT_CONFIGS.length} AI agents ·{' '}
            {loading ? 'Loading…' : `${apps.length} applications`}
            {fetchedAt && ` · fetched ${fetchedAt}`}
          </p>
        </div>
        <button
          onClick={() => setRunSignal(s => s + 1)}
          disabled={loading || apps.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-creditcard-purple text-white rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Run All Agents
        </button>
      </div>

      {/* Agent Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading applications…
        </div>
      ) : (
        <div className="space-y-6">
          {AGENT_CONFIGS.map(config => (
            <AgentCard
              key={config.id}
              config={config}
              apps={apps}
              runSignal={runSignal}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
