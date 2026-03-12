import { useState, useEffect } from 'react'
import AutopayPanel from './AutopayPanel'
import { getAutopay, enrollPaperless, cancelPaperless } from '../api/cardApi'

function StepCheck({ complete }) {
  if (complete) {
    return (
      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" />
  )
}

export default function WelcomeJourneyPanel({ app, onUpdate }) {
  const [expandedStep, setExpandedStep] = useState(0)
  const [spendDone, setSpendDone] = useState(false)
  const [autopayActive, setAutopayActive] = useState(false)
  const [autopayLoading, setAutopayLoading] = useState(true)
  const [paperlessSaving, setPaperlessSaving] = useState(false)

  useEffect(() => {
    getAutopay(app.id)
      .then(data => setAutopayActive(data.some(e => e.status === 'ACTIVE')))
      .catch(() => setAutopayActive(false))
      .finally(() => setAutopayLoading(false))
  }, [app.id])

  const cardActivated = app.activationStatus === 'ACTIVE'
  const authUserDone = app.authUserId != null
  const paperlessDone = app.paperlessEnrolled === true
  const allDone = cardActivated && autopayActive && spendDone && authUserDone && paperlessDone

  const completedCount = [cardActivated, autopayActive, spendDone, authUserDone, paperlessDone].filter(Boolean).length
  const progress = (completedCount / 5) * 100

  const handlePaperlessToggle = async () => {
    setPaperlessSaving(true)
    try {
      if (paperlessDone) {
        await cancelPaperless(app.id)
      } else {
        await enrollPaperless(app.id)
      }
      onUpdate()
    } finally {
      setPaperlessSaving(false)
    }
  }

  const toggle = (i) => setExpandedStep(expandedStep === i ? -1 : i)

  return (
    <div className="card p-5 border-2 border-creditcard-purple/30 bg-purple-50/30 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Welcome Journey</h3>
          <p className="text-xs text-gray-500 mt-0.5">Complete these steps to get the most from your card</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-creditcard-purple">{completedCount}/5</div>
          <div className="text-xs text-gray-500">steps done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-creditcard-purple h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {allDone && (
        <div className="mb-4 p-4 bg-creditcard-purple rounded-xl text-white text-center">
          <div className="text-2xl mb-1">🎉</div>
          <div className="font-bold text-lg">Journey Complete!</div>
          <div className="text-sm text-purple-200 mt-1">You've completed all steps. Enjoy your card!</div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {/* Step 1: Activate Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(0)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <StepCheck complete={cardActivated} />
            <span className="flex-1 text-sm font-medium text-gray-800">Step 1 — Activate Card</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedStep === 0 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedStep === 0 && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100">
              {cardActivated ? (
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Card activated{app.activatedAt ? ` on ${new Date(app.activatedAt).toLocaleString()}` : ''}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Your card has been issued and is ready to activate.</p>
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs text-amber-700">Use the "Activate Card" button in the Issued Card panel to activate.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Autopay */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(1)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <StepCheck complete={autopayActive} />
            <span className="flex-1 text-sm font-medium text-gray-800">Step 2 — Set Up Autopay</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedStep === 1 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedStep === 1 && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100">
              {autopayLoading ? (
                <div className="text-sm text-gray-400">Loading...</div>
              ) : (
                <AutopayPanel
                  applicationId={app.id}
                  onStatusChange={() => {
                    getAutopay(app.id)
                      .then(data => setAutopayActive(data.some(e => e.status === 'ACTIVE')))
                      .catch(() => {})
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Step 3: Spending Limits */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(2)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <StepCheck complete={spendDone} />
            <span className="flex-1 text-sm font-medium text-gray-800">Step 3 — Spending Limits</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedStep === 2 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedStep === 2 && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
              <p className="text-sm text-gray-600">
                Set up spending limits to stay on budget. You can configure category limits, monthly caps, and alerts.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#spend-controls"
                  className="text-sm text-creditcard-purple font-semibold hover:underline"
                  onClick={() => {
                    document.getElementById('spend-controls-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Go to Spending Limits →
                </a>
                {!spendDone && (
                  <button
                    type="button"
                    onClick={() => setSpendDone(true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-creditcard-purple text-creditcard-purple hover:bg-creditcard-purple/10 transition-colors"
                  >
                    Mark Done
                  </button>
                )}
              </div>
              {spendDone && <div className="text-green-600 text-sm font-medium">✅ Spending limits configured</div>}
            </div>
          )}
        </div>

        {/* Step 4: Authorized User */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(3)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <StepCheck complete={authUserDone} />
            <span className="flex-1 text-sm font-medium text-gray-800">Step 4 — Authorized User</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedStep === 3 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedStep === 3 && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-2">
              {authUserDone ? (
                <div className="text-green-700 text-sm">
                  ✅ Authorized user added: <span className="font-medium">{app.authUserFirstName} {app.authUserLastName}</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Add a trusted family member or friend as an authorized user on your account.</p>
                  <a href="#auth-user" className="text-sm text-creditcard-purple font-semibold hover:underline">
                    Add or Skip Authorized User →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 5: Paperless */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(4)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <StepCheck complete={paperlessDone} />
            <span className="flex-1 text-sm font-medium text-gray-800">Step 5 — Go Paperless</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedStep === 4 ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedStep === 4 && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
              {paperlessDone ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Enrolled in paperless statements
                    {app.paperlessEnrolledAt && (
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        since {new Date(app.paperlessEnrolledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handlePaperlessToggle}
                    disabled={paperlessSaving}
                    className="text-xs text-gray-400 hover:text-red-500 underline disabled:opacity-50"
                  >
                    {paperlessSaving ? 'Updating...' : 'Switch back to paper statements'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: '🌱', title: 'Eco-Friendly', desc: 'Reduce paper waste' },
                      { icon: '⚡', title: 'Instant Access', desc: 'Statements available immediately' },
                      { icon: '🔒', title: 'More Secure', desc: 'No mail interception risk' },
                    ].map(b => (
                      <div key={b.title} className="bg-green-50 rounded-lg p-2.5 text-center">
                        <div className="text-lg mb-0.5">{b.icon}</div>
                        <div className="text-xs font-semibold text-green-800">{b.title}</div>
                        <div className="text-xs text-green-600 mt-0.5">{b.desc}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handlePaperlessToggle}
                    disabled={paperlessSaving}
                    className="w-full py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paperlessSaving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Enroll in Paperless Statements
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
