const BASE_STEPS = [
  { key: 'PRE_APPROVED',        label: 'Pre-Approved', icon: '🎯' },
  { key: 'SUBMITTED',           label: 'Submitted',   icon: '📋' },
  { key: 'KYC_REVIEW',          label: 'KYC',         icon: '🪪' },
  { key: 'FRAUD_SCREENING',     label: 'Fraud',       icon: '🔍' },
  { key: 'CREDIT_REVIEW',       label: 'Credit',      icon: '💳' },
  { key: 'INCOME_VERIFICATION', label: 'Income',      icon: '💰' },
  { key: 'CARD_ISSUED',         label: 'Card Issued', icon: '✅' },
  { key: 'AUTH_USER',           label: 'Auth User',   icon: '👤' },
]

const BALANCE_TRANSFER_STEP = { key: 'BALANCE_TRANSFER', label: 'Balance Transfer', icon: '🔄' }

const STATUS_ORDER = {
  PRE_APPROVED: 0, SUBMITTED: 1, KYC_REVIEW: 2, FRAUD_SCREENING: 3,
  CREDIT_REVIEW: 4, INCOME_VERIFICATION: 5, CARD_ISSUED: 6,
  AUTH_USER_ADDED: 7, AUTH_USER_SKIPPED: 7, BALANCE_TRANSFER_INITIATED: 8,
  DENIED: -1, MANUAL_REVIEW: -2,
}

const AUTH_USER_STEP_IDX = 7
const BALANCE_TRANSFER_STEP_IDX = 8

export default function PipelineTracker({ status, isBalanceTransfer }) {
  const isDenied   = status === 'DENIED'
  const isManual   = status === 'MANUAL_REVIEW'
  const currentIdx = STATUS_ORDER[status] ?? 0
  const isAuthSkipped = status === 'AUTH_USER_SKIPPED'

  const STEPS = isBalanceTransfer ? [...BASE_STEPS, BALANCE_TRANSFER_STEP] : BASE_STEPS

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-citizens-charcoal mb-5 text-sm uppercase tracking-wide">Application Pipeline</h3>
      <div className="flex items-start">
        {STEPS.map((step, idx) => {
          const isDone     = currentIdx > idx && !isDenied
          const isCurrent  = currentIdx === idx && !isDenied && !isManual
          const isDeclined = isDenied && idx <= Math.max(currentIdx, 0)
          const isSkipped  = isAuthSkipped && step.key === 'AUTH_USER'

          let circleClass = 'bg-citizens-border text-citizens-gray border-2 border-citizens-border'
          let textClass   = 'text-citizens-gray'
          if (isDone)        { circleClass = 'bg-citizens-green border-2 border-citizens-green text-white' ; textClass = 'text-citizens-green-dark' }
          if (isCurrent)     { circleClass = 'bg-citizens-green border-2 border-citizens-green text-white ring-4 ring-citizens-green/20' ; textClass = 'text-citizens-green font-semibold' }
          if (isManual && idx <= 4) { circleClass = 'bg-amber-400 border-2 border-amber-400 text-white' }
          if (isDeclined)    { circleClass = 'bg-red-500 border-2 border-red-500 text-white' ; textClass = 'text-red-600' }
          if (isSkipped)     { circleClass = 'bg-gray-400 border-2 border-gray-400 text-white' ; textClass = 'text-gray-500' }

          let lineClass = 'bg-citizens-border'
          if (isDone && !isDenied)   lineClass = 'bg-citizens-green'
          if (isDenied && idx < Math.max(currentIdx, 0)) lineClass = 'bg-red-300'
          if (isManual)              lineClass = 'bg-amber-300'

          return (
            <div key={step.key} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${circleClass}`}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : step.icon}
                </div>
                <span className={`text-xs mt-2 text-center w-16 leading-tight ${textClass}`}>{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mt-4.5 rounded ${lineClass}`} style={{ marginTop: '18px' }} />
              )}
            </div>
          )
        })}
      </div>

      {isDenied && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-sm text-red-700 font-semibold">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Application Denied
        </div>
      )}
      {isManual && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded flex items-center gap-2 text-sm text-amber-700 font-semibold">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Pending Manual Review
        </div>
      )}
    </div>
  )
}
