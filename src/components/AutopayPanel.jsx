import { useEffect, useState } from 'react'
import { getAutopay, enrollAutopay, cancelAutopay } from '../api/cardApi'

const PAYMENT_TYPES = [
  { value: 'MINIMUM', label: 'Minimum Payment', desc: 'Pay the minimum amount due each month' },
  { value: 'FULL_BALANCE', label: 'Full Balance', desc: 'Pay the full statement balance each month' },
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount', desc: 'Pay a fixed dollar amount each month' },
]

const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 1)

export default function AutopayPanel({ applicationId, onStatusChange }) {
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ paymentType: 'MINIMUM', fixedAmount: '', paymentDueDay: 1 })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const loadEnrollment = () => {
    setLoading(true)
    getAutopay(applicationId)
      .then(data => {
        const active = data.find(e => e.status === 'ACTIVE')
        setEnrollment(active || null)
      })
      .catch(() => setEnrollment(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadEnrollment() }, [applicationId])

  const handleEnroll = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await enrollAutopay(applicationId, {
        paymentType: form.paymentType,
        fixedAmount: form.paymentType === 'FIXED_AMOUNT' ? parseFloat(form.fixedAmount) : null,
        paymentDueDay: form.paymentDueDay,
      })
      setEnrollment(data)
      setSuccess('Autopay enrolled successfully!')
      if (onStatusChange) onStatusChange()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel autopay enrollment?')) return
    setSaving(true)
    setError(null)
    try {
      await cancelAutopay(applicationId)
      setEnrollment(null)
      setSuccess('Autopay cancelled.')
      if (onStatusChange) onStatusChange()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-gray-400 py-2">Loading autopay status...</div>

  if (enrollment) {
    const paymentDesc = enrollment.paymentType === 'FIXED_AMOUNT'
      ? `Fixed $${enrollment.fixedAmount}`
      : enrollment.paymentType === 'FULL_BALANCE' ? 'Full Balance' : 'Minimum Payment'

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-green-800">Autopay Active</div>
            <div className="text-xs text-green-600">{paymentDesc} on day {enrollment.paymentDueDay} of each month</div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Cancel
          </button>
        </div>
        {error && <div className="text-red-600 text-xs">{error}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {PAYMENT_TYPES.map(pt => (
          <label key={pt.value} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:border-creditcard-purple/40">
            <input
              type="radio"
              name="paymentType"
              value={pt.value}
              checked={form.paymentType === pt.value}
              onChange={() => setForm(f => ({ ...f, paymentType: pt.value }))}
              className="mt-0.5 accent-purple-600"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{pt.label}</div>
              <div className="text-xs text-gray-500">{pt.desc}</div>
              {pt.value === 'FIXED_AMOUNT' && form.paymentType === 'FIXED_AMOUNT' && (
                <input
                  type="number"
                  value={form.fixedAmount}
                  onChange={e => setForm(f => ({ ...f, fixedAmount: e.target.value }))}
                  placeholder="Amount ($)"
                  className="form-input mt-2 text-sm"
                  min="1"
                />
              )}
            </div>
          </label>
        ))}
      </div>

      <div>
        <label className="section-label">Payment Due Day</label>
        <select
          value={form.paymentDueDay}
          onChange={e => setForm(f => ({ ...f, paymentDueDay: parseInt(e.target.value) }))}
          className="form-input"
        >
          {DAY_OPTIONS.map(d => (
            <option key={d} value={d}>Day {d} of each month</option>
          ))}
        </select>
      </div>

      {error && <div className="text-red-600 text-xs">{error}</div>}
      {success && <div className="text-green-600 text-xs">{success}</div>}

      <button
        type="button"
        onClick={handleEnroll}
        disabled={saving || (form.paymentType === 'FIXED_AMOUNT' && !form.fixedAmount)}
        className="w-full py-2 rounded-lg bg-creditcard-purple text-white text-sm font-semibold hover:bg-creditcard-purple/90 transition-colors disabled:opacity-50"
      >
        {saving ? 'Enrolling...' : 'Enroll in Autopay'}
      </button>
    </div>
  )
}
