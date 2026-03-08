import { useState } from 'react'
import { prefillWithProve } from '../api/cardApi'

export default function ProveVerificationPanel({ onPrefill }) {
  const [phone, setPhone] = useState('')
  const [ssn4, setSsn4] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // null | 'verified' | 'not_found'
  const [verifiedName, setVerifiedName] = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')

  const canSubmit = phone.trim() && ssn4.trim().length === 4

  const handleVerify = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const data = await prefillWithProve(phone.trim(), ssn4.trim())
      if (data.verificationStatus === 'VERIFIED') {
        setStatus('verified')
        setVerifiedName(`${data.firstName} ${data.lastName}`)
        setVerifiedPhone(data.phone)
        onPrefill(data)
      } else {
        setStatus('not_found')
      }
    } catch {
      setStatus('not_found')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleVerify()
  }

  const handleSsn4Change = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setSsn4(val)
  }

  return (
    <div className="mb-4">
      {status === 'verified' ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Identity verified · {verifiedName} · {verifiedPhone}
            </p>
            <p className="text-xs text-green-600 mt-0.5">Fields prefilled below — you may edit any field before submitting.</p>
          </div>
        </div>
      ) : status === 'not_found' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Identity not recognized</p>
            <p className="text-xs text-amber-700 mt-0.5">Phone and last 4 of SSN did not match — please fill in your details manually below.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded bg-purple-700 flex items-center justify-center">
                <span className="text-white text-xs font-black">P</span>
              </div>
              <span className="text-sm font-bold text-purple-800 tracking-wide">PROVE</span>
            </div>
            <span className="text-xs text-purple-600">· Instant identity verification & prefill</span>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Phone  e.g. 617-555-0001"
              className="flex-1 px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            />
            <input
              type="password"
              value={ssn4}
              onChange={handleSsn4Change}
              onKeyDown={handleKeyDown}
              placeholder="Last 4 SSN"
              maxLength={4}
              className="w-28 px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white tracking-widest"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || !canSubmit}
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-700 rounded-lg hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying…
                </>
              ) : 'Verify & Prefill'}
            </button>
          </div>
          <p className="text-xs text-purple-500 mt-2">Try: 617-555-0001 + 6789 · 617-555-0002 + 3333 · 617-555-0003 + 5555 · 617-555-0004 + 4444</p>
        </div>
      )}
    </div>
  )
}
