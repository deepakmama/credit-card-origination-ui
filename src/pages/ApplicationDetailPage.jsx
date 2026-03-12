import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getApplication, reprocessApplication, submitPreapproved } from '../api/cardApi'
import StatusBadge from '../components/StatusBadge'
import PipelineTracker from '../components/PipelineTracker'
import IssuedCardPanel from '../components/IssuedCardPanel'
import DocumentUploadPanel from '../components/DocumentUploadPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import AuthUserPanel from '../components/AuthUserPanel'
import BalanceTransferPanel from '../components/BalanceTransferPanel'
import AdverseActionLetter from '../components/AdverseActionLetter'
import SpendControlPanel from '../components/SpendControlPanel'
import AuditTrailPanel from '../components/AuditTrailPanel'
import ReengagementPanel from '../components/ReengagementPanel'
import WelcomeJourneyPanel from '../components/WelcomeJourneyPanel'

const fmt = (n) => n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—'

const TEST_SSNS = [
  { ssn: '123-45-6789', label: '750 → Approve' },
  { ssn: '444-44-4444', label: '800 → Approve' },
  { ssn: '333-33-3333', label: '720 → Approve' },
  { ssn: '555-55-5555', label: '610 → Borderline' },
  { ssn: '222-22-2222', label: 'Fraud Score 55' },
  { ssn: '000-00-0000', label: 'Identity Fail' },
]

const POST_ISSUANCE_STATUSES = ['CARD_ISSUED', 'AUTH_USER_ADDED', 'AUTH_USER_SKIPPED', 'BALANCE_TRANSFER_INITIATED']

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right max-w-xs">{value ?? '—'}</span>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reprocessing, setReprocessing] = useState(false)
  const [selectedSsn, setSelectedSsn] = useState('')
  const [reprocessError, setReprocessError] = useState(null)
  const [error, setError] = useState(null)
  const [showLetter, setShowLetter] = useState(false)
  const [preApprovedForm, setPreApprovedForm] = useState({ annualIncome: '', monthlyHousingPayment: '' })
  const [submittingPreApproved, setSubmittingPreApproved] = useState(false)
  const [preApprovedError, setPreApprovedError] = useState(null)

  const loadApp = () => {
    setLoading(true)
    getApplication(id).then(setApp).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { loadApp() }, [id])

  const handleReprocess = async () => {
    setReprocessing(true)
    setReprocessError(null)
    try {
      const updated = await reprocessApplication(id, selectedSsn || undefined)
      setApp(updated)
    } catch (e) {
      setReprocessError(e.response?.data?.message || e.message)
    } finally {
      setReprocessing(false)
    }
  }

  if (loading) return <LoadingSpinner message="Loading application..." />
  if (error) return <div className="max-w-4xl mx-auto px-4 py-8 text-red-600">{error}</div>
  if (!app) return null

  const scoreColor = (s) => !s ? 'text-gray-400' : s >= 720 ? 'text-green-600' : s >= 650 ? 'text-amber-600' : 'text-red-600'
  const dtiColor = (d) => !d ? 'text-gray-400' : d <= 30 ? 'text-green-600' : d <= 43 ? 'text-amber-600' : 'text-red-600'
  const cashflowColor = (c) => !c ? 'text-gray-400' : c >= 750 ? 'text-green-600' : c >= 680 ? 'text-amber-600' : 'text-red-600'

  const canReprocess = app.status === 'DENIED' || app.status === 'MANUAL_REVIEW'
  const isPostIssuance = POST_ISSUANCE_STATUSES.includes(app.status)
  const isPreApproved = app.status === 'PRE_APPROVED'

  const preApprovedFormReady =
    preApprovedForm.annualIncome !== '' &&
    parseFloat(preApprovedForm.annualIncome) > 0 &&
    preApprovedForm.monthlyHousingPayment !== ''

  const handleSubmitPreApproved = async (e) => {
    e.preventDefault()
    if (!preApprovedFormReady) return
    setSubmittingPreApproved(true)
    setPreApprovedError(null)
    try {
      const updated = await submitPreapproved(id, {
        annualIncome: parseFloat(preApprovedForm.annualIncome),
        monthlyHousingPayment: parseFloat(preApprovedForm.monthlyHousingPayment) || 0,
      })
      setApp(updated)
    } catch (e) {
      setPreApprovedError(e.response?.data?.message || e.message)
    } finally {
      setSubmittingPreApproved(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/applications" className="text-sm text-citizens-green hover:underline mb-2 inline-block">← Applications</Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {app.applicant?.firstName} {app.applicant?.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-400 font-mono">{app.id}</span>
            <StatusBadge status={app.status} />
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Submitted: {fmtDate(app.submittedAt)}</div>
          <div>Updated: {fmtDate(app.updatedAt)}</div>
          {app.status === 'DENIED' && (
            <button
              onClick={() => setShowLetter(true)}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 flex items-center gap-1.5 ml-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Adverse Action Letter
            </button>
          )}
        </div>
      </div>

      {showLetter && <AdverseActionLetter app={app} onClose={() => setShowLetter(false)} />}

      {/* PRE_APPROVED — customer must fill income/housing to submit */}
      {isPreApproved && (
        <div className="mb-6 card p-6 border-2 border-creditcard-purple/40 bg-purple-50/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-creditcard-purple/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-creditcard-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-creditcard-purple">You've Been Pre-Approved!</h2>
              <p className="text-sm text-gray-600">Your details have been pre-filled from the offer. Please provide your income information to complete and submit your application.</p>
            </div>
          </div>

          {/* Pre-filled summary */}
          <div className="grid grid-cols-2 gap-3 mb-5 bg-white rounded-xl p-4 border border-creditcard-purple/20">
            <div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Name</div>
              <div className="text-sm font-medium text-gray-800">{app.applicant?.firstName} {app.applicant?.lastName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Card Type</div>
              <div className="text-sm font-medium text-gray-800">
                {{ CASH_BACK: 'Summit Reserve Cash Back', BALANCE_TRANSFER: 'Summit Balance Transfer', NEW_TO_CREDIT: 'Amp Starter' }[app.cardRequest?.cardType] || app.cardRequest?.cardType?.replace(/_/g, ' ')}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Email</div>
              <div className="text-sm text-gray-700">{app.applicant?.email || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Employment</div>
              <div className="text-sm text-gray-700">{app.applicant?.employmentType?.replace(/_/g, ' ') || '—'}</div>
            </div>
            {app.cardRequest?.requestedCreditLimit && (
              <div>
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Pre-approved Limit</div>
                <div className="text-sm font-semibold text-green-700">{fmt(app.cardRequest.requestedCreditLimit)}</div>
              </div>
            )}
          </div>

          {/* Income form */}
          <form onSubmit={handleSubmitPreApproved} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Your Financial Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="section-label">Annual Income ($) *</label>
                <input
                  type="number"
                  value={preApprovedForm.annualIncome}
                  onChange={e => setPreApprovedForm(f => ({ ...f, annualIncome: e.target.value }))}
                  placeholder="e.g. 75000"
                  className="form-input"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="section-label">Monthly Housing Payment ($) *</label>
                <input
                  type="number"
                  value={preApprovedForm.monthlyHousingPayment}
                  onChange={e => setPreApprovedForm(f => ({ ...f, monthlyHousingPayment: e.target.value }))}
                  placeholder="e.g. 1500 (rent or mortgage, enter 0 if none)"
                  className="form-input"
                  required
                  min="0"
                />
              </div>
            </div>
            {preApprovedError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{preApprovedError}</div>
            )}
            <button
              type="submit"
              disabled={submittingPreApproved || !preApprovedFormReady}
              className="w-full py-3 rounded-xl bg-creditcard-purple text-white font-bold text-base hover:bg-creditcard-purple/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submittingPreApproved ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing through pipeline…
                </>
              ) : (
                'Submit Application →'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Pipeline */}
      <div className="mb-6">
        <PipelineTracker
          status={app.status}
          isBalanceTransfer={app.cardRequest?.cardType === 'BALANCE_TRANSFER'}
        />
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className={`card p-4 ${app.creditScore >= 720 ? 'bg-green-50' : app.creditScore >= 650 ? 'bg-amber-50' : app.creditScore ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Credit Score</div>
          <div className={`text-3xl font-bold ${scoreColor(app.creditScore)}`}>{app.creditScore ?? '—'}</div>
        </div>
        <div className={`card p-4 ${app.dti <= 30 ? 'bg-green-50' : app.dti <= 43 ? 'bg-amber-50' : app.dti ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">DTI Ratio</div>
          <div className={`text-3xl font-bold ${dtiColor(app.dti)}`}>{app.dti != null ? `${app.dti}%` : '—'}</div>
        </div>
        <div className={`card p-4 ${app.fraudScore <= 30 ? 'bg-green-50' : app.fraudScore <= 70 ? 'bg-amber-50' : app.fraudScore ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Fraud Score</div>
          <div className={`text-3xl font-bold ${app.fraudScore <= 30 ? 'text-green-600' : app.fraudScore <= 70 ? 'text-amber-600' : app.fraudScore ? 'text-red-600' : 'text-gray-400'}`}>
            {app.fraudScore ?? '—'}
          </div>
        </div>
        <div className={`card p-4 ${app.cashflowScore >= 750 ? 'bg-green-50' : app.cashflowScore >= 680 ? 'bg-amber-50' : app.cashflowScore ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">Cashflow Score</div>
          <div className={`text-3xl font-bold ${cashflowColor(app.cashflowScore)}`}>{app.cashflowScore ?? '—'}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Applicant Info */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Applicant</h3>
            <div className="space-y-0">
              <InfoRow label="Name" value={`${app.applicant?.firstName} ${app.applicant?.lastName}`} />
              <InfoRow label="SSN" value={app.applicant?.ssn?.replace(/\d(?=\d{4})/g, '*')} />
              <InfoRow label="DOB" value={app.applicant?.dob} />
              <InfoRow label="Email" value={app.applicant?.email} />
              <InfoRow label="Phone" value={app.applicant?.phone} />
              <InfoRow label="Address" value={app.applicant?.address} />
              <InfoRow label="Employment" value={app.applicant?.employmentType?.replace(/_/g, ' ')} />
              <InfoRow label="Employer" value={app.applicant?.employerName} />
              <InfoRow label="Annual Income" value={fmt(app.applicant?.annualIncome)} />
              <InfoRow label="Monthly Housing" value={fmt(app.applicant?.monthlyHousingPayment)} />
            </div>
          </div>

          {/* Card Request */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Card Request</h3>
            <div className="space-y-0">
              <InfoRow label="Card Type" value={{ CASH_BACK: 'Summit Reserve', BALANCE_TRANSFER: 'Summit', NEW_TO_CREDIT: 'Amp' }[app.cardRequest?.cardType] || app.cardRequest?.cardType?.replace(/_/g, ' ')} />
              <InfoRow label="Requested Limit" value={fmt(app.cardRequest?.requestedCreditLimit)} />
              {app.cardRequest?.cardType === 'BALANCE_TRANSFER' && (
                <>
                  <InfoRow label="Transfer Amount" value={fmt(app.cardRequest?.balanceTransferAmount)} />
                  <InfoRow label="Transfer From" value={app.cardRequest?.balanceTransferBank} />
                </>
              )}
            </div>
          </div>

          {/* KYC */}
          {app.kycRiskLevel && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3">KYC Verification</h3>
              <div className="space-y-0">
                <InfoRow label="Identity Verified" value={app.kycVerified ? '✅ Yes' : '❌ No'} />
                <InfoRow label="Risk Level" value={app.kycRiskLevel} />
                <InfoRow label="Risk Reason" value={app.kycRiskReason} />
              </div>
            </div>
          )}

          {/* Fraud */}
          {app.fraudScore != null && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Fraud Screening</h3>
              <div className="space-y-0">
                <InfoRow label="Fraud Score" value={app.fraudScore} />
                <InfoRow label="Recommendation" value={app.fraudRecommendation} />
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Welcome Journey — shown for post-issuance */}
          {isPostIssuance && (
            <WelcomeJourneyPanel app={app} onUpdate={loadApp} />
          )}

          {/* Issued Card */}
          {isPostIssuance && (
            <IssuedCardPanel app={app} onUpdate={loadApp} />
          )}

          {/* Auth User Panel — prompt when CARD_ISSUED */}
          {app.status === 'CARD_ISSUED' && (
            <AuthUserPanel app={app} onUpdate={loadApp} />
          )}

          {/* Auth User Result — show after added */}
          {app.authUserFirstName && (
            <div className="card p-5 border border-citizens-green/30">
              <h3 className="font-semibold text-gray-800 mb-3">Authorized User</h3>
              <InfoRow label="Name" value={`${app.authUserFirstName} ${app.authUserLastName}`} />
              <InfoRow label="Relationship" value={app.authUserRelationship?.replace(/_/g, ' ')} />
            </div>
          )}

          {/* Balance Transfer Panel — prompt when auth user step done, BT card */}
          {['AUTH_USER_ADDED', 'AUTH_USER_SKIPPED'].includes(app.status) &&
            app.cardRequest?.cardType === 'BALANCE_TRANSFER' && (
            <BalanceTransferPanel app={app} onUpdate={loadApp} />
          )}

          {/* Balance Transfer Result — show after initiated */}
          {app.balanceTransferReferenceNumber && (
            <div className="card p-5 border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-3">Balance Transfer</h3>
              <InfoRow label="Reference" value={app.balanceTransferReferenceNumber} />
              <InfoRow label="Status" value={app.balanceTransferStatus} />
              <InfoRow label="Estimated Days" value={app.balanceTransferEstimatedDays != null ? `${app.balanceTransferEstimatedDays} business days` : null} />
            </div>
          )}

          {/* Credit Decision */}
          {app.decisionType && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Credit Decision</h3>
              <div className={`p-3 rounded-lg mb-3 ${app.decisionType === 'APPROVED' ? 'bg-green-50 text-green-700' : app.decisionType === 'DENIED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                <span className="font-semibold">{app.decisionType}</span>
                {app.decisionReason && <div className="text-xs mt-1 opacity-80">{app.decisionReason}</div>}
              </div>
              <div className="space-y-0">
                <InfoRow label="Credit Score" value={app.creditScore} />
                <InfoRow label="DTI Ratio" value={app.dti != null ? `${app.dti}%` : null} />
                <InfoRow label="Approved Limit" value={fmt(app.approvedCreditLimit)} />
                <InfoRow label="APR" value={app.apr != null ? `${app.apr}%` : null} />
              </div>
            </div>
          )}

          {/* Income Verification */}
          {app.cashflowScore != null && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Income Verification</h3>
              <div className="space-y-0">
                <InfoRow label="Monthly Income" value={fmt(app.monthlyIncome)} />
                <InfoRow label="Income Verified" value={app.incomeVerified ? '✅ Yes' : '❌ No'} />
                <InfoRow label="Cashflow Score" value={app.cashflowScore} />
              </div>
            </div>
          )}

          {/* Spend Controls — post-issuance only */}
          {isPostIssuance && (
            <SpendControlPanel app={app} />
          )}

          {/* Re-engagement Campaigns — denied only */}
          {app.status === 'DENIED' && (
            <ReengagementPanel applicationId={app.id} />
          )}

          {/* Document Upload */}
          <DocumentUploadPanel applicationId={app.id} status={app.status} />

          {/* Reprocess Panel */}
          {canReprocess && (
            <div className="card p-5 border-2 border-amber-200 bg-amber-50">
              <h3 className="font-semibold text-amber-900 mb-1">Reprocess Application</h3>
              <p className="text-xs text-amber-700 mb-3">Override SSN to test different decision scenarios.</p>
              {reprocessError && <div className="text-red-600 text-xs mb-2">{reprocessError}</div>}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {TEST_SSNS.map(t => (
                  <button key={t.ssn} type="button"
                    onClick={() => setSelectedSsn(t.ssn)}
                    className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${selectedSsn === t.ssn ? 'border-citizens-green bg-citizens-green-light text-citizens-green' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}`}>
                    <div className="font-mono font-bold">{t.ssn}</div>
                    <div className="opacity-70">{t.label}</div>
                  </button>
                ))}
              </div>
              <input value={selectedSsn} onChange={e => setSelectedSsn(e.target.value)}
                placeholder="Or type SSN: 123-45-6789"
                className="form-input text-xs mb-3" />
              <button onClick={handleReprocess} disabled={reprocessing}
                className="btn-primary w-full py-2 text-sm">
                {reprocessing ? 'Reprocessing...' : 'Reprocess Application'}
              </button>
            </div>
          )}

          {/* Audit Trail — always shown at the bottom */}
          <AuditTrailPanel applicationId={app.id} />
        </div>
      </div>
    </div>
  )
}
