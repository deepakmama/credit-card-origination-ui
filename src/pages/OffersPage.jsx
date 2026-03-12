import { useEffect, useState } from 'react'
import { getOffers, createOffer, createOfferBatch, acceptOffer, cancelOffer, getApplication } from '../api/cardApi'
import { Link, useNavigate } from 'react-router-dom'

const ISSUED_STATUSES = ['CARD_ISSUED', 'AUTH_USER_ADDED', 'AUTH_USER_SKIPPED', 'BALANCE_TRANSFER_INITIATED']

const fmt = (n) => n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
}

const CARD_TYPES = ['CASH_BACK', 'BALANCE_TRANSFER', 'NEW_TO_CREDIT']
const SEGMENTS = ['PREMIUM', 'STANDARD', 'STARTER']
const STATUSES = ['ACTIVE', 'ACCEPTED', 'EXPIRED', 'CANCELLED']
const EMP_TYPES = ['EMPLOYED', 'SELF_EMPLOYED', 'STUDENT', 'UNEMPLOYED', 'RETIRED']

const emptyOffer = {
  firstName: '', lastName: '', email: '', phone: '', ssn: '', dob: '',
  address: '', employerName: '', employmentType: 'EMPLOYED',
  annualIncome: '', existingBankRelationship: false,
  offeredCardType: 'CASH_BACK', offeredCreditLimit: '', offeredApr: '',
  targetSegment: 'PREMIUM', targetBranch: '', targetLocation: '', expiryDays: 30,
}

const emptyBatchRow = () => ({ ...emptyOffer })

function OfferForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">Create Pre-approved Offer</h3>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="section-label">First Name *</label><input value={form.firstName} onChange={e => set('firstName', e.target.value)} className="form-input" required /></div>
        <div><label className="section-label">Last Name *</label><input value={form.lastName} onChange={e => set('lastName', e.target.value)} className="form-input" required /></div>
        <div><label className="section-label">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="form-input" /></div>
        <div><label className="section-label">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="form-input" /></div>
        <div><label className="section-label">SSN</label><input value={form.ssn} onChange={e => set('ssn', e.target.value)} placeholder="123-45-6789" className="form-input" /></div>
        <div><label className="section-label">Date of Birth</label><input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} className="form-input" /></div>
        <div className="col-span-2"><label className="section-label">Address</label><input value={form.address} onChange={e => set('address', e.target.value)} className="form-input" /></div>
        <div><label className="section-label">Employer</label><input value={form.employerName} onChange={e => set('employerName', e.target.value)} className="form-input" /></div>
        <div>
          <label className="section-label">Employment Type</label>
          <select value={form.employmentType} onChange={e => set('employmentType', e.target.value)} className="form-input">
            {EMP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div><label className="section-label">Annual Income ($)</label><input type="number" value={form.annualIncome} onChange={e => set('annualIncome', e.target.value)} className="form-input" /></div>
        <div>
          <label className="section-label">Card Type</label>
          <select value={form.offeredCardType} onChange={e => set('offeredCardType', e.target.value)} className="form-input">
            {CARD_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div><label className="section-label">Credit Limit ($)</label><input type="number" value={form.offeredCreditLimit} onChange={e => set('offeredCreditLimit', e.target.value)} className="form-input" /></div>
        <div><label className="section-label">APR (%)</label><input type="number" step="0.01" value={form.offeredApr} onChange={e => set('offeredApr', e.target.value)} className="form-input" /></div>
        <div>
          <label className="section-label">Segment</label>
          <select value={form.targetSegment} onChange={e => set('targetSegment', e.target.value)} className="form-input">
            {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="section-label">Branch</label><input value={form.targetBranch} onChange={e => set('targetBranch', e.target.value)} className="form-input" /></div>
        <div><label className="section-label">Location</label><input value={form.targetLocation} onChange={e => set('targetLocation', e.target.value)} className="form-input" /></div>
        <div><label className="section-label">Expiry (days)</label><input type="number" value={form.expiryDays} onChange={e => set('expiryDays', parseInt(e.target.value))} className="form-input" /></div>
        <div className="flex items-center gap-2 pt-4">
          <input type="checkbox" checked={form.existingBankRelationship} onChange={e => set('existingBankRelationship', e.target.checked)} className="accent-purple-600 w-4 h-4" />
          <span className="text-sm text-gray-700">Existing Bank Relationship</span>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={() => onSave(form)} disabled={saving} className="btn-primary py-2 px-5 bg-creditcard-purple hover:bg-creditcard-purple/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Create Offer'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
      </div>
    </div>
  )
}

export default function OffersPage() {
  const navigate = useNavigate()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBatch, setShowBatch] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({ segment: '', status: '', cardType: '' })
  const [batchRows, setBatchRows] = useState([emptyBatchRow()])
  const [acceptedApp, setAcceptedApp] = useState(null)
  const [appStatuses, setAppStatuses] = useState({})

  const loadOffers = () => {
    setLoading(true)
    getOffers().then(setOffers).catch(e => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { loadOffers() }, [])

  useEffect(() => {
    const withApp = offers.filter(o => o.applicationId)
    if (withApp.length === 0) { setAppStatuses({}); return }
    Promise.all(
      withApp.map(o =>
        getApplication(o.applicationId)
          .then(a => [o.applicationId, a.status])
          .catch(() => [o.applicationId, null])
      )
    ).then(results => {
      setAppStatuses(Object.fromEntries(results.filter(([, s]) => s != null)))
    })
  }, [offers])

  const handleCreate = async (form) => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        annualIncome: form.annualIncome ? parseFloat(form.annualIncome) : null,
        offeredCreditLimit: form.offeredCreditLimit ? parseFloat(form.offeredCreditLimit) : null,
        offeredApr: form.offeredApr ? parseFloat(form.offeredApr) : null,
        dob: form.dob || null,
      }
      await createOffer(payload)
      setShowForm(false)
      loadOffers()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBatchCreate = async () => {
    setSaving(true)
    setError(null)
    try {
      const payloads = batchRows.map(r => ({
        ...r,
        annualIncome: r.annualIncome ? parseFloat(r.annualIncome) : null,
        offeredCreditLimit: r.offeredCreditLimit ? parseFloat(r.offeredCreditLimit) : null,
        offeredApr: r.offeredApr ? parseFloat(r.offeredApr) : null,
        dob: r.dob || null,
      }))
      await createOfferBatch(payloads)
      setShowBatch(false)
      setBatchRows([emptyBatchRow()])
      loadOffers()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAccept = async (offer) => {
    if (!confirm(`Accept offer for ${offer.firstName} ${offer.lastName} and run through the pipeline?`)) return
    setSaving(true)
    setError(null)
    try {
      const app = await acceptOffer(offer.id)
      loadOffers()
      // Navigate to the pre-approved application so customer can fill in income/housing and submit
      navigate(`/applications/${app.id}`)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (offer) => {
    if (!confirm(`Cancel offer for ${offer.firstName} ${offer.lastName}?`)) return
    try {
      await cancelOffer(offer.id)
      loadOffers()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    }
  }

  const filtered = offers.filter(o => {
    if (filter.segment && o.targetSegment !== filter.segment) return false
    if (filter.status && o.status !== filter.status) return false
    if (filter.cardType && o.offeredCardType !== filter.cardType) return false
    return true
  })

  const counts = {
    total: offers.length,
    active: offers.filter(o => o.status === 'ACTIVE').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    expired: offers.filter(o => o.status === 'EXPIRED').length,
  }

  const statuses = Object.values(appStatuses)
  const approved = statuses.filter(s => ISSUED_STATUSES.includes(s)).length
  const declined = statuses.filter(s => s === 'DENIED').length
  const inPipeline = statuses.filter(s => !ISSUED_STATUSES.includes(s) && s !== 'DENIED').length
  const decided = approved + declined
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : null
  const declineRate = decided > 0 ? Math.round((declined / decided) * 100) : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-approved Offers</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage and track pre-approved credit card offers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowBatch(false); setShowForm(s => !s) }} className="btn-primary px-4 py-2 text-sm bg-creditcard-purple hover:bg-creditcard-purple/90">
            + Create Offer
          </button>
          <button onClick={() => { setShowForm(false); setShowBatch(s => !s) }} className="px-4 py-2 rounded-lg border border-creditcard-purple text-creditcard-purple text-sm font-semibold hover:bg-creditcard-purple/10">
            Batch
          </button>
        </div>
      </div>

      {/* Stats — Offer Funnel */}
      <div className="grid grid-cols-4 gap-4 mb-3">
        {[
          { label: 'Total', value: counts.total, color: 'bg-gray-100 text-gray-700' },
          { label: 'Active', value: counts.active, color: 'bg-green-100 text-green-700' },
          { label: 'Accepted', value: counts.accepted, color: 'bg-blue-100 text-blue-700' },
          { label: 'Expired', value: counts.expired, color: 'bg-gray-100 text-gray-500' },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.color}`}>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stats — Pipeline Outcomes */}
      {statuses.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4 bg-emerald-50 text-emerald-700">
            <div className="text-3xl font-bold">{approved}</div>
            <div className="text-sm font-medium mt-1">Approved</div>
            <div className="text-xs text-emerald-500 mt-0.5">Card Issued</div>
          </div>
          <div className="card p-4 bg-red-50 text-red-700">
            <div className="text-3xl font-bold">{declined}</div>
            <div className="text-sm font-medium mt-1">Declined</div>
            <div className="text-xs text-red-400 mt-0.5">Denied</div>
          </div>
          <div className="card p-4 bg-amber-50 text-amber-700">
            <div className="text-3xl font-bold">{inPipeline}</div>
            <div className="text-sm font-medium mt-1">In Pipeline</div>
            <div className="text-xs text-amber-500 mt-0.5">Awaiting decision</div>
          </div>
          <div className="card p-4 bg-creditcard-purple/10 text-creditcard-purple">
            <div className="text-3xl font-bold">
              {approvalRate != null ? `${approvalRate}%` : '—'}
            </div>
            <div className="text-sm font-medium mt-1">Approval Rate</div>
            <div className="text-xs mt-0.5 opacity-70">
              {declineRate != null ? `${declineRate}% declined` : 'No decisions yet'}
            </div>
          </div>
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {showForm && (
        <div className="mb-6">
          <OfferForm initial={emptyOffer} onSave={handleCreate} onCancel={() => setShowForm(false)} saving={saving} />
        </div>
      )}

      {showBatch && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Batch Create Offers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  {['First', 'Last', 'Email', 'Card Type', 'Limit', 'APR', 'Segment', 'Expiry Days', ''].map(h => (
                    <th key={h} className="px-2 py-1.5 text-left text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batchRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-1 py-1"><input value={row.firstName} onChange={e => setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, firstName: e.target.value } : r))} className="form-input text-xs py-1" /></td>
                    <td className="px-1 py-1"><input value={row.lastName} onChange={e => setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, lastName: e.target.value } : r))} className="form-input text-xs py-1" /></td>
                    <td className="px-1 py-1"><input value={row.email} onChange={e => setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, email: e.target.value } : r))} className="form-input text-xs py-1" /></td>
                    <td className="px-1 py-1">
                      <select value={row.offeredCardType} onChange={e => setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, offeredCardType: e.target.value } : r))} className="form-input text-xs py-1">
                        {CARD_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1"><input type="number" value={row.offeredCreditLimit} onChange={e => setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, offeredCreditLimit: e.target.value } : r))} className="form-input text-xs py-1" /></td>
                    <td className="px-1 py-1"><input type="number" step="0.01" value={row.offeredApr} onChange={e => setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, offeredApr: e.target.value } : r))} className="form-input text-xs py-1" /></td>
                    <td className="px-1 py-1">
                      <select value={row.targetSegment} onChange={e => setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, targetSegment: e.target.value } : r))} className="form-input text-xs py-1">
                        {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1"><input type="number" value={row.expiryDays} onChange={e => setBatchRows(rows => rows.map((r, j) => j === i ? { ...r, expiryDays: parseInt(e.target.value) } : r))} className="form-input text-xs py-1" /></td>
                    <td className="px-1 py-1">
                      <button type="button" onClick={() => setBatchRows(rows => rows.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-xs px-1">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setBatchRows(rows => [...rows, emptyBatchRow()])} className="text-sm text-creditcard-purple font-medium hover:underline">+ Add Row</button>
            <button type="button" onClick={handleBatchCreate} disabled={saving} className="btn-primary py-2 px-5 text-sm bg-creditcard-purple disabled:opacity-50">
              {saving ? 'Creating...' : `Create ${batchRows.length} Offers`}
            </button>
            <button type="button" onClick={() => setShowBatch(false)} className="px-4 py-2 rounded-lg border text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={filter.segment} onChange={e => setFilter(f => ({ ...f, segment: e.target.value }))} className="form-input text-sm py-1.5 w-40">
          <option value="">All Segments</option>
          {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="form-input text-sm py-1.5 w-40">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.cardType} onChange={e => setFilter(f => ({ ...f, cardType: e.target.value }))} className="form-input text-sm py-1.5 w-48">
          <option value="">All Card Types</option>
          {CARD_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading offers...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-medium text-gray-600">No offers found</div>
          <div className="text-sm mt-1">Create a pre-approved offer to get started</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Card Type', 'Limit', 'APR', 'Segment', 'Branch', 'Location', 'Expires', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map(offer => (
                <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-sm font-medium text-gray-900">{offer.firstName} {offer.lastName}</td>
                  <td className="px-3 py-3 text-sm text-gray-500">{offer.email || '—'}</td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-700">{offer.offeredCardType?.replace(/_/g, ' ') || '—'}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{fmt(offer.offeredCreditLimit)}</td>
                  <td className="px-3 py-3 text-sm text-gray-700">{offer.offeredApr != null ? `${offer.offeredApr}%` : '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${offer.targetSegment === 'PREMIUM' ? 'bg-purple-100 text-purple-700' : offer.targetSegment === 'STANDARD' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {offer.targetSegment || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{offer.targetBranch || '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{offer.targetLocation || '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{fmtDate(offer.expiresAt)}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[offer.status] || 'bg-gray-100 text-gray-600'}`}>
                      {offer.status}
                    </span>
                    {offer.applicationId && (
                      <Link to={`/applications/${offer.applicationId}`} className="ml-2 text-xs text-creditcard-purple hover:underline">View App</Link>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      {offer.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleAccept(offer)}
                            disabled={saving}
                            className="text-xs px-2.5 py-1 rounded bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleCancel(offer)}
                            className="text-xs px-2.5 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
