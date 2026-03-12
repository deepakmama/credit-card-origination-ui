import { useState } from 'react'
import { Link } from 'react-router-dom'
import { prequalify } from '../api/cardApi'

const CARD_OPTIONS = [
  { value: 'CASH_BACK', label: 'Summit Reserve', desc: 'Premium cash back rewards' },
  { value: 'BALANCE_TRANSFER', label: 'Summit', desc: '0% intro APR balance transfer' },
  { value: 'NEW_TO_CREDIT', label: 'Amp', desc: 'Build your credit history' },
]

export default function PrequalifyPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', address: '',
    annualIncome: '', monthlyHousingPayment: '', cardType: 'CASH_BACK',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await prequalify({
        ...form,
        annualIncome: parseFloat(form.annualIncome),
        monthlyHousingPayment: parseFloat(form.monthlyHousingPayment),
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const outcomeStyle = {
    LIKELY: { bg: 'bg-green-50 border-green-300', text: 'text-green-800', icon: '✓', badge: 'bg-green-100 text-green-800' },
    CONDITIONAL: { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-800', icon: '~', badge: 'bg-amber-100 text-amber-800' },
    UNLIKELY: { bg: 'bg-red-50 border-red-300', text: 'text-red-800', icon: '✗', badge: 'bg-red-100 text-red-800' },
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link to="/" className="text-sm text-citizens-green hover:underline mb-3 inline-block">← Home</Link>
        <h1 className="text-3xl font-bold text-citizens-charcoal mb-2">Check If You Pre-Qualify</h1>
        <p className="text-citizens-gray">Get an instant estimate with no impact to your credit score.</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
              <input name="firstName" value={form.firstName} onChange={handle} required
                className="form-input" placeholder="Jane" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handle} required
                className="form-input" placeholder="Smith" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="dob" value={form.dob} onChange={handle} required
                className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
              <input name="address" value={form.address} onChange={handle} required
                className="form-input" placeholder="123 Main St, Boston MA" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Annual Income ($)</label>
              <input type="number" name="annualIncome" value={form.annualIncome} onChange={handle} required
                min="0" step="1000" className="form-input" placeholder="75000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Housing Payment ($)</label>
              <input type="number" name="monthlyHousingPayment" value={form.monthlyHousingPayment} onChange={handle} required
                min="0" step="100" className="form-input" placeholder="1500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Card of Interest</label>
            <div className="grid grid-cols-3 gap-3">
              {CARD_OPTIONS.map(opt => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setForm(f => ({ ...f, cardType: opt.value }))}
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${
                    form.cardType === opt.value
                      ? 'border-citizens-green bg-citizens-green-light'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`text-sm font-bold ${form.cardType === opt.value ? 'text-citizens-green' : 'text-gray-800'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-base">
            {loading ? 'Checking...' : 'Check My Pre-Qualification'}
          </button>
          <p className="text-xs text-center text-citizens-gray">
            This is a soft inquiry — no impact to your credit score.
          </p>
        </form>
      ) : (
        <div className="space-y-5">
          {/* Result Banner */}
          {(() => {
            const s = outcomeStyle[result.outcome] || outcomeStyle.UNLIKELY
            return (
              <div className={`rounded-2xl border-2 p-6 ${s.bg}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${s.badge}`}>
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className={`text-xl font-bold ${s.text}`}>
                        {result.outcome === 'LIKELY' ? 'You Likely Qualify!' :
                         result.outcome === 'CONDITIONAL' ? 'You May Qualify' : 'Unlikely to Qualify'}
                      </h2>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}>
                        {result.outcome}
                      </span>
                    </div>
                    <p className={`text-sm ${s.text} mb-3`}>{result.message}</p>
                    <div className={`text-xs ${s.text} opacity-75`}>{result.rationale}</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Details */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Pre-Qualification Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Estimated DTI</div>
                <div className={`text-2xl font-bold ${
                  result.estimatedDti <= 36 ? 'text-green-600' :
                  result.estimatedDti <= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>{result.estimatedDti}%</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Suggested Card</div>
                <div className="text-lg font-bold text-citizens-charcoal">{result.suggestedCardName}</div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            {result.outcome !== 'UNLIKELY' && (
              <Link to="/apply" className="btn-primary flex-1 text-center py-3 text-base">
                Apply Now →
              </Link>
            )}
            <button
              onClick={() => { setResult(null); setError(null) }}
              className="btn-secondary flex-1 py-3 text-base"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
