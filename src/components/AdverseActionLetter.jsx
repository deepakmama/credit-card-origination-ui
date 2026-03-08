const BANK_NAME    = 'Citizens Bank'
const BANK_ADDRESS = 'One Citizens Plaza, Providence, RI 02903'
const BANK_PHONE   = '1-800-922-9999'
const BUREAU = {
  name:    'Experian',
  address: 'P.O. Box 4500, Allen, TX 75013',
  phone:   '1-888-397-3742',
  web:     'experian.com',
}

function deriveReasons(app) {
  const reasons = []
  if (app.kycVerified === false) {
    reasons.push(app.kycRiskReason || 'Unable to verify identity through available records.')
  }
  if (app.kycRiskLevel === 'HIGH' && app.kycRiskReason?.toLowerCase().includes('watchlist')) {
    reasons.push('Information found on government watchlist or sanctions list.')
  }
  if (app.fraudScore != null && app.fraudScore > 80) {
    reasons.push(`Unacceptable fraud risk indicator (score: ${app.fraudScore}).`)
  }
  if (app.decisionType === 'DENIED' && app.decisionReason) {
    reasons.push(app.decisionReason)
  }
  if (app.creditScore != null && app.creditScore < 620) {
    reasons.push(`Credit score of ${app.creditScore} is below the minimum threshold.`)
  }
  if (app.dti != null && app.dti > 50) {
    reasons.push(`Debt-to-income ratio of ${app.dti}% exceeds acceptable limits.`)
  }
  if (app.incomeVerified === false) {
    reasons.push('Unable to verify sufficient income to support requested credit line.')
  }
  if (reasons.length === 0) {
    reasons.push('Insufficient credit history or information.')
  }
  return reasons
}

export default function AdverseActionLetter({ app, onClose }) {
  const today    = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const reasons  = deriveReasons(app)
  const fullName = `${app.applicant?.firstName} ${app.applicant?.lastName}`

  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center py-8 px-4 overflow-y-auto">
      {/* Controls — hidden on print */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save PDF
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 border"
        >
          Close
        </button>
      </div>

      {/* Letter */}
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl print:shadow-none print:rounded-none print:max-w-none">
        <div className="p-10 font-serif text-gray-900 text-sm leading-relaxed">

          {/* Letterhead */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <div className="text-xl font-bold text-citizens-green tracking-tight">{BANK_NAME}</div>
              <div className="text-xs text-gray-500 mt-0.5">Credit Card Division</div>
              <div className="text-xs text-gray-500">{BANK_ADDRESS}</div>
              <div className="text-xs text-gray-500">{BANK_PHONE}</div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>{today}</div>
              <div className="mt-1 font-mono">Ref: {app.id?.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>

          {/* Addressee */}
          <div className="mb-8">
            <div className="font-semibold">{fullName}</div>
            {app.applicant?.address && <div className="text-gray-700">{app.applicant.address}</div>}
          </div>

          {/* Subject */}
          <div className="mb-6">
            <span className="font-semibold">Re: </span>
            Notice of Credit Application Decision — Application #{app.id?.slice(0, 8).toUpperCase()}
          </div>

          {/* Salutation */}
          <p className="mb-4">Dear {fullName},</p>

          <p className="mb-4">
            Thank you for your recent application for a {BANK_NAME} credit card. We have carefully
            reviewed your application and are unable to approve your request for credit at this time.
          </p>

          {/* Reasons */}
          <div className="mb-6">
            <p className="font-semibold mb-2">Principal Reason(s) for Adverse Action:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-2">
              {reasons.map((r, i) => (
                <li key={i} className="text-gray-800">{r}</li>
              ))}
            </ol>
          </div>

          {/* Credit bureau disclosure */}
          {app.creditScore != null && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
              <p className="font-semibold mb-2">Credit Information Disclosure</p>
              <p className="mb-2">
                Your credit score of <strong>{app.creditScore}</strong> was obtained from{' '}
                <strong>{BUREAU.name}</strong>. Credit scores range from 300 to 850. Key factors
                affecting your score are reflected in the reasons above.
              </p>
              <p className="text-xs text-gray-600">
                <strong>{BUREAU.name}</strong> · {BUREAU.address} · {BUREAU.phone} · {BUREAU.web}
              </p>
            </div>
          )}

          {/* FCRA / ECOA rights */}
          <div className="mb-6">
            <p className="font-semibold mb-2">Your Rights Under Federal Law</p>
            <p className="mb-3">
              The federal Equal Credit Opportunity Act (ECOA) prohibits creditors from discriminating
              against credit applicants on the basis of race, color, religion, national origin, sex,
              marital status, age, or because you receive public assistance. The federal agency that
              administers compliance is the Consumer Financial Protection Bureau (CFPB),
              1700 G Street N.W., Washington, DC 20552.
            </p>
            <p className="mb-3">
              Under the Fair Credit Reporting Act (FCRA), you have the right to a free copy of your
              credit report from the reporting agency used in this decision if you request it within
              60 days of receiving this notice. You also have the right to dispute inaccurate or
              incomplete information in your credit report.
            </p>
            <p>
              To obtain a free credit report, visit{' '}
              <strong>annualcreditreport.com</strong> or call <strong>1-877-322-8228</strong>.
            </p>
          </div>

          {/* Closing */}
          <p className="mb-6">
            You are welcome to reapply for credit in the future. If you have questions about this
            decision, please contact our credit department at {BANK_PHONE}.
          </p>

          <p className="mb-8">Sincerely,</p>

          <div>
            <div className="font-semibold">{BANK_NAME} Credit Card Division</div>
            <div className="text-xs text-gray-500 mt-1">
              This is an automated notice issued in compliance with the Equal Credit Opportunity
              Act and the Fair Credit Reporting Act.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
