import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplications, approveApplication, denyApplication } from '../api/cardApi'
import LoadingSpinner from '../components/LoadingSpinner'

const fmt = (n) => n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—'

const DENY_REASONS = [
  { value: 'INSUFFICIENT_INCOME', label: 'Insufficient Income' },
  { value: 'HIGH_RISK', label: 'High Risk Profile' },
  { value: 'FRAUD_RISK', label: 'Fraud Risk' },
  { value: 'OTHER', label: 'Other' },
]

function ReviewRow({ app, onActionDone }) {
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState(null) // 'approve' | 'deny'
  const [approveForm, setApproveForm] = useState({ approvedCreditLimit: '', apr: '', notes: '' })
  const [denyForm, setDenyForm] = useState({ reason: 'INSUFFICIENT_INCOME', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const timeInQueue = app.submittedAt
    ? Math.round((Date.now() - new Date(app.submittedAt)) / 60000) + ' min'
    : '—'

  const handleApprove = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await approveApplication(app.id, {
        approvedCreditLimit: parseFloat(approveForm.approvedCreditLimit),
        apr: parseFloat(approveForm.apr),
        notes: approveForm.notes,
      })
      onActionDone(app.id)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeny = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await denyApplication(app.id, denyForm)
      onActionDone(app.id)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 text-sm">
            {app.applicant?.firstName} {app.applicant?.lastName}
          </div>
          <div className="text-xs text-gray-500 font-mono truncate">{app.id}</div>
        </div>
        <div className="text-xs text-gray-600 w-24 text-center">
          {{ CASH_BACK: 'Summit Reserve', BALANCE_TRANSFER: 'Summit', NEW_TO_CREDIT: 'Amp' }[app.cardRequest?.cardType] || '—'}
        </div>
        <div className={`text-xs font-bold w-16 text-center ${
          app.creditScore >= 720 ? 'text-green-600' : app.creditScore >= 650 ? 'text-amber-600' : 'text-red-600'
        }`}>{app.creditScore ?? '—'}</div>
        <div className={`text-xs font-bold w-16 text-center ${
          app.dti <= 30 ? 'text-green-600' : app.dti <= 43 ? 'text-amber-600' : 'text-red-600'
        }`}>{app.dti != null ? `${app.dti}%` : '—'}</div>
        <div className={`text-xs font-bold w-16 text-center ${
          app.fraudScore <= 30 ? 'text-green-600' : app.fraudScore <= 70 ? 'text-amber-600' : 'text-red-600'
        }`}>{app.fraudScore ?? '—'}</div>
        <div className="text-xs text-gray-600 w-24 text-right">{fmt(app.applicant?.annualIncome)}</div>
        <div className="text-xs text-gray-500 w-20 text-right">{timeInQueue}</div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded action panel */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-5">
          {error && <div className="text-red-600 text-xs mb-3">{error}</div>}

          {mode === null && (
            <div className="flex gap-3">
              <button onClick={() => setMode('approve')}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-lg transition-colors">
                Approve Application
              </button>
              <button onClick={() => setMode('deny')}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors">
                Deny Application
              </button>
              <Link to={`/applications/${app.id}`} target="_blank"
                className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold text-sm rounded-lg hover:bg-white transition-colors">
                Full View
              </Link>
            </div>
          )}

          {mode === 'approve' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-green-800 mb-2">Approve Application</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Credit Limit ($)</label>
                  <input type="number" value={approveForm.approvedCreditLimit}
                    onChange={e => setApproveForm(f => ({ ...f, approvedCreditLimit: e.target.value }))}
                    className="form-input" placeholder="5000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">APR (%)</label>
                  <input type="number" value={approveForm.apr}
                    onChange={e => setApproveForm(f => ({ ...f, apr: e.target.value }))}
                    className="form-input" placeholder="21.99" step="0.01" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <input value={approveForm.notes}
                  onChange={e => setApproveForm(f => ({ ...f, notes: e.target.value }))}
                  className="form-input" placeholder="Underwriter notes..." />
              </div>
              <div className="flex gap-2">
                <button onClick={handleApprove} disabled={submitting}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-lg">
                  {submitting ? 'Approving...' : 'Confirm Approval'}
                </button>
                <button onClick={() => setMode(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-white">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'deny' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-red-800 mb-2">Deny Application</div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                <select value={denyForm.reason}
                  onChange={e => setDenyForm(f => ({ ...f, reason: e.target.value }))}
                  className="form-input">
                  {DENY_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <input value={denyForm.notes}
                  onChange={e => setDenyForm(f => ({ ...f, notes: e.target.value }))}
                  className="form-input" placeholder="Denial notes..." />
              </div>
              <div className="flex gap-2">
                <button onClick={handleDeny} disabled={submitting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg">
                  {submitting ? 'Denying...' : 'Confirm Denial'}
                </button>
                <button onClick={() => setMode(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-white">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReviewQueuePage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    getApplications()
      .then(all => setApps(all.filter(a => a.status === 'MANUAL_REVIEW')))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleActionDone = (id) => {
    setApps(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return <LoadingSpinner message="Loading review queue..." />

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Review Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Applications requiring underwriter review</p>
        </div>
        <div className="flex items-center gap-3">
          {apps.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full">
              {apps.length} pending
            </span>
          )}
          <button onClick={load} className="btn-secondary text-sm px-4 py-2">Refresh</button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {apps.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h3 className="font-semibold text-gray-700 mb-1">Queue is empty</h3>
          <p className="text-sm text-gray-500">No applications currently require manual review.</p>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 mb-2">
            <div className="flex-1">Applicant</div>
            <div className="w-24 text-center">Card</div>
            <div className="w-16 text-center">Score</div>
            <div className="w-16 text-center">DTI</div>
            <div className="w-16 text-center">Fraud</div>
            <div className="w-24 text-right">Income</div>
            <div className="w-20 text-right">In Queue</div>
            <div className="w-4" />
          </div>

          {apps.map(app => (
            <ReviewRow key={app.id} app={app} onActionDone={handleActionDone} />
          ))}
        </>
      )}
    </div>
  )
}
