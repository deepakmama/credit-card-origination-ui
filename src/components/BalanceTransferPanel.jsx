import { useState } from 'react'
import { initiateBalanceTransfer } from '../api/cardApi'

const fmt = (n) => n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—'

export default function BalanceTransferPanel({ app, onUpdate }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleInitiate = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const updated = await initiateBalanceTransfer(app.id)
      setResult({
        referenceNumber: updated.balanceTransferReferenceNumber,
        estimatedDays: updated.balanceTransferEstimatedDays,
      })
      onUpdate()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="card p-5 border border-blue-200 bg-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="font-semibold text-blue-800">Balance Transfer Initiated</h3>
        </div>
        <div className="space-y-1 text-sm text-blue-900">
          <div><span className="font-medium">Reference:</span> <span className="font-mono">{result.referenceNumber}</span></div>
          <div><span className="font-medium">Estimated completion:</span> {result.estimatedDays} business days</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5 border-2 border-blue-200 bg-blue-50">
      <h3 className="font-semibold text-blue-900 mb-1">Initiate Balance Transfer</h3>
      <p className="text-xs text-blue-700 mb-4">Transfer your existing balance from your source bank to this card.</p>

      <div className="bg-white rounded-lg p-3 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Transfer Amount</span>
          <span className="font-semibold text-gray-800">{fmt(app.cardRequest?.balanceTransferAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">From Bank</span>
          <span className="font-semibold text-gray-800">{app.cardRequest?.balanceTransferBank || '—'}</span>
        </div>
      </div>

      {error && <div className="text-red-600 text-xs mb-3 p-2 bg-red-50 rounded">{error}</div>}

      <button onClick={handleInitiate} disabled={submitting}
        className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
        {submitting ? 'Initiating...' : 'Initiate Balance Transfer'}
      </button>
    </div>
  )
}
