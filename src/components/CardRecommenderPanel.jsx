import { useState } from 'react'
import { getCardRecommendation } from '../api/cardApi'

export default function CardRecommenderPanel({ onRecommend }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    annualIncome: '',
    monthlyHousingPayment: '',
    existingBankRelationship: false,
    needsBalanceTransfer: false,
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRecommend = async () => {
    if (!form.annualIncome) return
    setLoading(true)
    setError(null)
    try {
      const data = await getCardRecommendation({
        annualIncome: parseFloat(form.annualIncome),
        monthlyHousingPayment: parseFloat(form.monthlyHousingPayment) || 0,
        existingBankRelationship: form.existingBankRelationship,
        needsBalanceTransfer: form.needsBalanceTransfer,
      })
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUseCard = () => {
    if (result && onRecommend) {
      onRecommend(result.recommendedCard)
    }
  }

  return (
    <div className="card border border-creditcard-purple/20 bg-purple-50/40">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-creditcard-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.75 3.75 0 01-5.303-5.303 5 5 0 015.303 5.303" />
          </svg>
          <span className="font-semibold text-creditcard-purple text-sm">Not sure which card? Get a recommendation</span>
        </div>
        <svg className={`w-4 h-4 text-creditcard-purple transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label">Annual Income ($) *</label>
              <input
                type="number"
                value={form.annualIncome}
                onChange={e => setForm(f => ({ ...f, annualIncome: e.target.value }))}
                placeholder="e.g. 75000"
                className="form-input"
              />
            </div>
            <div>
              <label className="section-label">Monthly Housing Payment ($)</label>
              <input
                type="number"
                value={form.monthlyHousingPayment}
                onChange={e => setForm(f => ({ ...f, monthlyHousingPayment: e.target.value }))}
                placeholder="e.g. 1500"
                className="form-input"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, existingBankRelationship: !f.existingBankRelationship }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.existingBankRelationship ? 'bg-creditcard-purple' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.existingBankRelationship ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-gray-700">I have an existing bank relationship</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, needsBalanceTransfer: !f.needsBalanceTransfer }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.needsBalanceTransfer ? 'bg-creditcard-purple' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.needsBalanceTransfer ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-gray-700">I want to transfer a balance from another card</span>
            </label>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="button"
            onClick={handleRecommend}
            disabled={loading || !form.annualIncome}
            className="btn-primary text-sm px-5 py-2 bg-creditcard-purple hover:bg-creditcard-purple/90 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Get Recommendation'}
          </button>

          {result && (
            <div className="bg-white rounded-xl border border-creditcard-purple/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Recommended Card</div>
                  <div className="text-lg font-bold text-gray-900">{result.cardName}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.confidence === 'HIGH' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {result.confidence} Confidence
                </span>
              </div>

              {result.estimatedDti != null && (
                <div className="text-xs text-gray-500">
                  Estimated DTI: <span className="font-semibold text-gray-700">{result.estimatedDti}%</span>
                </div>
              )}

              {result.primaryReasons && result.primaryReasons.length > 0 && (
                <ul className="space-y-1">
                  {result.primaryReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-creditcard-purple flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {reason}
                    </li>
                  ))}
                </ul>
              )}

              {result.alternativeCardName && (
                <div className="text-xs text-gray-500 pt-1 border-t">
                  Alternative: <span className="font-medium text-gray-700">{result.alternativeCardName}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleUseCard}
                className="w-full py-2 rounded-lg bg-creditcard-purple text-white text-sm font-semibold hover:bg-creditcard-purple/90 transition-colors"
              >
                Use {result.cardName} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
