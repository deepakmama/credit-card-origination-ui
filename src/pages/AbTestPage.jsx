import { useEffect, useState } from 'react'
import {
  getExperiments,
  createExperiment,
  addVariant,
  activateExperiment,
  pauseExperiment,
  completeExperiment,
  getExperimentResults,
} from '../api/cardApi'

const CARD_TYPES = ['CASH_BACK', 'BALANCE_TRANSFER', 'NEW_TO_CREDIT']
const EMP_TYPES = ['EMPLOYED', 'SELF_EMPLOYED', 'STUDENT', 'UNEMPLOYED', 'RETIRED']
const VARIANT_NAMES = ['CONTROL', 'VARIANT_A', 'VARIANT_B']

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
}

const emptyForm = {
  name: '',
  description: '',
  targetCardTypes: [],
  targetMinIncome: '',
  targetMaxIncome: '',
  targetEmploymentTypes: [],
  targetExistingBankOnly: false,
  targetBranches: '',
  targetLocations: '',
  variants: [
    { variantName: 'CONTROL', allocationPercent: 50, cardTypeOverride: '', creditLimitMultiplier: '', aprDiscount: '', description: '' },
    { variantName: 'VARIANT_A', allocationPercent: 50, cardTypeOverride: '', creditLimitMultiplier: '', aprDiscount: '', description: '' },
  ],
}

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function ResultsPanel({ results }) {
  if (!results) return null

  const maxConversion = Math.max(...results.variants.map(v => v.conversionRate))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Assigned', value: results.variants.reduce((s, v) => s + v.totalAssigned, 0) },
          { label: 'Overall Conversion', value: results.variants.reduce((s, v) => s + v.totalAssigned, 0) > 0
              ? `${(results.variants.reduce((s, v) => s + v.cardIssued, 0) / results.variants.reduce((s, v) => s + v.totalAssigned, 0) * 100).toFixed(1)}%`
              : '—' },
          { label: 'Total Issued', value: results.variants.reduce((s, v) => s + v.cardIssued, 0) },
          { label: 'Total Denied', value: results.variants.reduce((s, v) => s + v.denied, 0) },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {['Variant', 'Alloc %', 'Assigned', 'Issued', 'Denied', 'Manual Review', 'Conv Rate'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.variants.map(v => (
              <tr
                key={v.variantId}
                className={`border-b border-gray-100 ${v.conversionRate === maxConversion && v.totalAssigned > 0 ? 'bg-green-50' : ''}`}
              >
                <td className="px-3 py-2 text-sm font-semibold text-gray-800">
                  {v.variantName}
                  {v.conversionRate === maxConversion && v.totalAssigned > 0 && (
                    <span className="ml-2 text-xs text-green-600 font-normal">★ Best</span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">{v.allocationPercent}%</td>
                <td className="px-3 py-2 text-sm text-gray-700 font-medium">{v.totalAssigned}</td>
                <td className="px-3 py-2 text-sm text-green-700 font-medium">{v.cardIssued}</td>
                <td className="px-3 py-2 text-sm text-red-600">{v.denied}</td>
                <td className="px-3 py-2 text-sm text-amber-600">{v.manualReview}</td>
                <td className="px-3 py-2 text-sm font-bold text-gray-900">{v.conversionRate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AbTestPage() {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState(null)
  const [loadingResults, setLoadingResults] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadExperiments = () => {
    setLoading(true)
    getExperiments().then(setExperiments).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { loadExperiments() }, [])

  const totalAlloc = form.variants.reduce((s, v) => s + (parseInt(v.allocationPercent) || 0), 0)

  const handleSave = async (activate) => {
    if (totalAlloc !== 100) { setError('Variant allocations must sum to 100%'); return }
    setSaving(true)
    setError(null)
    try {
      const exp = await createExperiment({
        name: form.name,
        description: form.description,
        targetCardTypes: form.targetCardTypes.join(','),
        targetMinIncome: form.targetMinIncome ? parseFloat(form.targetMinIncome) : null,
        targetMaxIncome: form.targetMaxIncome ? parseFloat(form.targetMaxIncome) : null,
        targetEmploymentTypes: form.targetEmploymentTypes.join(','),
        targetExistingBankOnly: form.targetExistingBankOnly,
        targetBranches: form.targetBranches,
        targetLocations: form.targetLocations,
      })

      for (const v of form.variants) {
        await addVariant(exp.id, {
          variantName: v.variantName,
          description: v.description,
          allocationPercent: parseInt(v.allocationPercent) || 0,
          cardTypeOverride: v.cardTypeOverride || null,
          creditLimitMultiplier: v.creditLimitMultiplier ? parseFloat(v.creditLimitMultiplier) : null,
          aprDiscount: v.aprDiscount ? parseFloat(v.aprDiscount) : null,
        })
      }

      if (activate) {
        await activateExperiment(exp.id)
      }

      setShowForm(false)
      setForm(emptyForm)
      loadExperiments()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (action, id) => {
    try {
      if (action === 'activate') await activateExperiment(id)
      else if (action === 'pause') await pauseExperiment(id)
      else if (action === 'complete') await completeExperiment(id)
      loadExperiments()
      if (selected?.id === id) {
        const refreshed = experiments.find(e => e.id === id)
        if (refreshed) setSelected({ ...refreshed, status: action === 'activate' ? 'ACTIVE' : action === 'pause' ? 'PAUSED' : 'COMPLETED' })
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    }
  }

  const handleLoadResults = async () => {
    if (!selected) return
    setLoadingResults(true)
    try {
      const r = await getExperimentResults(selected.id)
      setResults(r)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoadingResults(false)
    }
  }

  const setVariantField = (i, k, v) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map((vr, j) => j === i ? { ...vr, [k]: v } : vr),
    }))
  }

  const toggleCardType = (ct) => {
    setForm(f => ({
      ...f,
      targetCardTypes: f.targetCardTypes.includes(ct)
        ? f.targetCardTypes.filter(x => x !== ct)
        : [...f.targetCardTypes, ct],
    }))
  }

  const toggleEmpType = (et) => {
    setForm(f => ({
      ...f,
      targetEmploymentTypes: f.targetEmploymentTypes.includes(et)
        ? f.targetEmploymentTypes.filter(x => x !== et)
        : [...f.targetEmploymentTypes, et],
    }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">A/B Testing Framework</h1>
          <p className="text-gray-500 mt-1 text-sm">Design and measure credit card offer experiments</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary px-4 py-2 text-sm bg-creditcard-purple hover:bg-creditcard-purple/90">
          + New Experiment
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Creation Form */}
      {showForm && (
        <div className="mb-6 card p-5 space-y-5">
          <h3 className="font-semibold text-gray-900 text-base">New Experiment</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label">Experiment Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="e.g. Cash Back Q2 Test" />
            </div>
            <div>
              <label className="section-label">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="form-input" placeholder="What are you testing?" />
            </div>
          </div>

          {/* Targeting */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Targeting Criteria</h4>
            <div>
              <label className="section-label mb-1">Card Types</label>
              <div className="flex gap-2 flex-wrap">
                {CARD_TYPES.map(ct => (
                  <label key={ct} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form.targetCardTypes.includes(ct)} onChange={() => toggleCardType(ct)} className="accent-purple-600 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-700">{ct.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">Min Annual Income ($)</label>
                <input type="number" value={form.targetMinIncome} onChange={e => setForm(f => ({ ...f, targetMinIncome: e.target.value }))} className="form-input" />
              </div>
              <div>
                <label className="section-label">Max Annual Income ($)</label>
                <input type="number" value={form.targetMaxIncome} onChange={e => setForm(f => ({ ...f, targetMaxIncome: e.target.value }))} className="form-input" />
              </div>
            </div>
            <div>
              <label className="section-label mb-1">Employment Types</label>
              <div className="flex gap-2 flex-wrap">
                {EMP_TYPES.map(et => (
                  <label key={et} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form.targetEmploymentTypes.includes(et)} onChange={() => toggleEmpType(et)} className="accent-purple-600 w-3.5 h-3.5" />
                    <span className="text-xs text-gray-700">{et.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">Target Branches (comma-separated)</label>
                <input value={form.targetBranches} onChange={e => setForm(f => ({ ...f, targetBranches: e.target.value }))} className="form-input" placeholder="e.g. Boston,NYC" />
              </div>
              <div>
                <label className="section-label">Target Locations (comma-separated)</label>
                <input value={form.targetLocations} onChange={e => setForm(f => ({ ...f, targetLocations: e.target.value }))} className="form-input" placeholder="e.g. MA,NY" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.targetExistingBankOnly} onChange={e => setForm(f => ({ ...f, targetExistingBankOnly: e.target.checked }))} className="accent-purple-600 w-4 h-4" />
              <span className="text-sm text-gray-700">Target existing bank customers only</span>
            </label>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Variants</h4>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${totalAlloc === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                Total: {totalAlloc}% {totalAlloc === 100 ? '✓' : `(need ${100 - totalAlloc}% more)`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Variant', 'Alloc %', 'Card Type Override', 'Limit Multiplier', 'APR Discount', 'Description'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.variants.map((v, i) => (
                    <tr key={v.variantName}>
                      <td className="px-3 py-2 font-semibold text-gray-800">{v.variantName}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.allocationPercent}
                          onChange={e => setVariantField(i, 'allocationPercent', e.target.value)}
                          className="form-input py-1 w-20 text-center"
                          min="0" max="100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select value={v.cardTypeOverride} onChange={e => setVariantField(i, 'cardTypeOverride', e.target.value)} className="form-input py-1">
                          <option value="">None</option>
                          {CARD_TYPES.map(ct => <option key={ct} value={ct}>{ct.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={v.creditLimitMultiplier} onChange={e => setVariantField(i, 'creditLimitMultiplier', e.target.value)} placeholder="e.g. 1.2" className="form-input py-1 w-24" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={v.aprDiscount} onChange={e => setVariantField(i, 'aprDiscount', e.target.value)} placeholder="e.g. 0.5" className="form-input py-1 w-20" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={v.description} onChange={e => setVariantField(i, 'description', e.target.value)} placeholder="Optional" className="form-input py-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-3">
              {form.variants.length < 3 && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { variantName: VARIANT_NAMES[f.variants.length] || `VARIANT_${f.variants.length}`, allocationPercent: 0, cardTypeOverride: '', creditLimitMultiplier: '', aprDiscount: '', description: '' }] }))}
                  className="text-sm text-creditcard-purple hover:underline font-medium"
                >
                  + Add Variant
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || !form.name}
              className="px-5 py-2 rounded-lg border border-creditcard-purple text-creditcard-purple text-sm font-semibold hover:bg-creditcard-purple/10 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !form.name || totalAlloc !== 100}
              className="btn-primary px-5 py-2 text-sm bg-creditcard-purple hover:bg-creditcard-purple/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Activate'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Experiment list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Experiments</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : experiments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border">
              <div className="text-3xl mb-2">🧪</div>
              <div className="text-sm">No experiments yet</div>
            </div>
          ) : (
            experiments.map(exp => (
              <button
                key={exp.id}
                onClick={() => { setSelected(exp); setResults(null) }}
                className={`w-full text-left card p-4 transition-all hover:border-creditcard-purple/40 ${selected?.id === exp.id ? 'border-creditcard-purple ring-1 ring-creditcard-purple/20' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-gray-900 text-sm leading-tight">{exp.name}</span>
                  <StatusBadge status={exp.status} />
                </div>
                {exp.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{exp.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {exp.targetCardTypes && exp.targetCardTypes.split(',').map(ct => ct.trim()).filter(Boolean).map(ct => (
                    <span key={ct} className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">{ct.replace(/_/g, ' ')}</span>
                  ))}
                  {exp.targetMinIncome && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">${(exp.targetMinIncome / 1000).toFixed(0)}K+</span>}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="card p-5 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                  {selected.description && <p className="text-sm text-gray-500 mt-1">{selected.description}</p>}
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {/* Targeting summary */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div className="font-semibold text-gray-700 text-sm mb-2">Targeting</div>
                {selected.targetCardTypes && <div>Card Types: <span className="font-medium text-gray-800">{selected.targetCardTypes}</span></div>}
                {selected.targetMinIncome && <div>Min Income: <span className="font-medium text-gray-800">${Number(selected.targetMinIncome).toLocaleString()}</span></div>}
                {selected.targetMaxIncome && <div>Max Income: <span className="font-medium text-gray-800">${Number(selected.targetMaxIncome).toLocaleString()}</span></div>}
                {selected.targetEmploymentTypes && <div>Employment: <span className="font-medium text-gray-800">{selected.targetEmploymentTypes}</span></div>}
                {selected.targetExistingBankOnly && <div className="text-purple-700">Bank customers only</div>}
                {selected.targetBranches && <div>Branches: <span className="font-medium text-gray-800">{selected.targetBranches}</span></div>}
                {selected.targetLocations && <div>Locations: <span className="font-medium text-gray-800">{selected.targetLocations}</span></div>}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {selected.status === 'DRAFT' && (
                  <button onClick={() => handleAction('activate', selected.id)} className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
                    Activate
                  </button>
                )}
                {selected.status === 'ACTIVE' && (
                  <>
                    <button onClick={() => handleAction('pause', selected.id)} className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">
                      Pause
                    </button>
                    <button onClick={() => handleAction('complete', selected.id)} className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                      Complete
                    </button>
                  </>
                )}
                {selected.status === 'PAUSED' && (
                  <button onClick={() => handleAction('complete', selected.id)} className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                    Complete
                  </button>
                )}
                <button
                  onClick={handleLoadResults}
                  disabled={loadingResults}
                  className="px-4 py-1.5 rounded-lg border border-creditcard-purple text-creditcard-purple text-sm font-semibold hover:bg-creditcard-purple/10 disabled:opacity-50"
                >
                  {loadingResults ? 'Loading...' : 'Load Results'}
                </button>
              </div>

              {results && <ResultsPanel results={results} />}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-gray-200 text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🧪</div>
                <div className="text-sm">Select an experiment to view details</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
