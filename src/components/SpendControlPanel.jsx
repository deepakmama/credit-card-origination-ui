import { useEffect, useState } from 'react'
import { getSpendControls, saveSpendControls } from '../api/cardApi'

const CATEGORIES = [
  { key: 'DINING', label: 'Dining', icon: '🍽' },
  { key: 'TRAVEL', label: 'Travel', icon: '✈' },
  { key: 'SHOPPING', label: 'Shopping', icon: '🛍' },
  { key: 'FUEL', label: 'Fuel', icon: '⛽' },
  { key: 'GROCERIES', label: 'Groceries', icon: '🛒' },
  { key: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎭' },
  { key: 'TOTAL', label: 'Total Monthly', icon: '📊' },
]

function defaultControl(category) {
  return { category, monthlyLimit: '', alertThreshold: '', alertEnabled: false }
}

export default function SpendControlPanel({ app }) {
  const [controls, setControls] = useState(CATEGORIES.map(c => defaultControl(c.key)))
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!app?.id) return
    getSpendControls(app.id).then(existing => {
      if (existing && existing.length > 0) {
        const merged = CATEGORIES.map(cat => {
          const found = existing.find(c => c.category === cat.key)
          return found
            ? { ...found, monthlyLimit: found.monthlyLimit ?? '', alertThreshold: found.alertThreshold ?? '' }
            : defaultControl(cat.key)
        })
        setControls(merged)
      }
    }).catch(() => {})
  }, [app?.id])

  const update = (idx, field, value) => {
    setControls(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const payload = controls.map(c => ({
        category: c.category,
        monthlyLimit: c.monthlyLimit !== '' ? parseFloat(c.monthlyLimit) : null,
        alertThreshold: c.alertThreshold !== '' ? parseFloat(c.alertThreshold) : null,
        alertEnabled: c.alertEnabled,
      }))
      await saveSpendControls(app.id, payload)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Spend Controls & Alerts</h3>
        <span className="text-xs text-gray-500">Set monthly limits per category</span>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
          ✓ Spend controls saved successfully
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {controls.map((ctrl, idx) => {
          const cat = CATEGORIES.find(c => c.key === ctrl.category)
          return (
            <div key={ctrl.category}
              className={`rounded-xl border p-3 ${ctrl.category === 'TOTAL' ? 'col-span-2 border-citizens-green bg-citizens-green-pale' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{cat?.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{cat?.label}</span>
                {/* Alert toggle */}
                <button
                  type="button"
                  onClick={() => update(idx, 'alertEnabled', !ctrl.alertEnabled)}
                  className={`ml-auto w-9 h-5 rounded-full transition-colors relative ${ctrl.alertEnabled ? 'bg-citizens-green' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${ctrl.alertEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Limit ($)</label>
                  <input
                    type="number" min="0" step="50"
                    value={ctrl.monthlyLimit}
                    onChange={e => update(idx, 'monthlyLimit', e.target.value)}
                    placeholder="No limit"
                    className="form-input text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Alert at ($)</label>
                  <input
                    type="number" min="0" step="50"
                    value={ctrl.alertThreshold}
                    onChange={e => update(idx, 'alertThreshold', e.target.value)}
                    placeholder="No alert"
                    className="form-input text-xs py-1.5"
                    disabled={!ctrl.alertEnabled}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="btn-primary w-full py-2.5 text-sm">
        {saving ? 'Saving...' : 'Save Spend Controls'}
      </button>
    </div>
  )
}
