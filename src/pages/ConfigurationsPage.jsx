import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  getConfigurations, getChangeRequests,
  submitChangeRequest, approveChangeRequest, rejectChangeRequest,
  publishChangeRequest, publishAllChangeRequests
} from '../api/cardApi'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'CREDIT_DECISION',  label: 'Credit Decision',  color: 'blue',   icon: '📊' },
  { key: 'FRAUD_DETECTION',  label: 'Fraud Detection',  color: 'red',    icon: '🛡️' },
  { key: 'PIPELINE',         label: 'Pipeline',          color: 'purple', icon: '⚡' },
  { key: 'OFFERS',           label: 'Offers',            color: 'amber',  icon: '🏷️' },
  { key: 'AUTOPAY',          label: 'Autopay',           color: 'green',  icon: '🔄' },
  { key: 'WELCOME_JOURNEY',  label: 'Welcome Journey',  color: 'indigo', icon: '🗺️' },
  { key: 'CARD_RECOMMENDER', label: 'Card Recommender', color: 'orange', icon: '💡' },
  { key: 'REENGAGEMENT',     label: 'Re-engagement',    color: 'teal',   icon: '📧' },
]

const COLORS = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  teal:   'bg-teal-50 text-teal-700 border-teal-200',
}

const STATUS_CONFIG = {
  PENDING_APPROVAL: { label: 'Pending',   bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  APPROVED:         { label: 'Approved',  bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  PUBLISHED:        { label: 'Published', bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  REJECTED:         { label: 'Rejected',  bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-500'    },
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_APPROVAL
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function DataTypeBadge({ type }) {
  const cls = { NUMBER: 'bg-blue-100 text-blue-700', BOOLEAN: 'bg-green-100 text-green-700', STRING: 'bg-gray-100 text-gray-600' }
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${cls[type] || cls.STRING}`}>{type}</span>
}

function BooleanToggle({ value, onChange, disabled }) {
  const active = value === 'true'
  return (
    <button type="button" onClick={() => onChange(active ? 'false' : 'true')} disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${active ? 'bg-green-500' : 'bg-gray-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function groupConfigs(configs) {
  const groups = {}
  configs.forEach(cfg => {
    const group = cfg.configKey.split('.').slice(0, 2).join('.')
    if (!groups[group]) groups[group] = []
    groups[group].push(cfg)
  })
  return groups
}

function formatGroupLabel(group) {
  return group.split('.').slice(1).join(' — ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function fmtDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── ProposeModal ──────────────────────────────────────────────────────────────

function ProposeModal({ cfg, onClose, onSubmitted }) {
  const [proposedValue, setProposedValue] = useState(cfg.configValue)
  const [requestedBy, setRequestedBy] = useState('INTERNAL_USER')
  const [justification, setJustification] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!proposedValue.trim()) { setError('Proposed value is required'); return }
    if (!justification.trim()) { setError('Justification is required'); return }
    setSubmitting(true); setError('')
    try {
      const req = await submitChangeRequest(cfg.configKey, proposedValue, requestedBy, justification)
      onSubmitted(req)
      onClose()
    } catch (e) {
      setError(e.response?.data?.reason?.localizedMessage || e.response?.data?.message || 'Failed to submit change request')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Propose Configuration Change</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">{cfg.configKey}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Current → Proposed */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-400 mb-1">Current Value</div>
              <div className="font-bold text-gray-700">{cfg.configValue}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-400 mb-1">Proposed Value</div>
              {cfg.dataType === 'BOOLEAN' ? (
                <div className="flex justify-center">
                  <BooleanToggle value={proposedValue} onChange={setProposedValue} />
                </div>
              ) : (
                <input
                  autoFocus
                  type={cfg.dataType === 'NUMBER' ? 'number' : 'text'}
                  value={proposedValue}
                  onChange={e => setProposedValue(e.target.value)}
                  step="any"
                  className="w-full text-center px-2 py-1 border border-creditcard-purple rounded-lg font-bold text-creditcard-purple focus:outline-none focus:ring-2 focus:ring-creditcard-purple/30"
                />
              )}
            </div>
          </div>

          {/* Requested by */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Requested By</label>
            <input
              type="text"
              value={requestedBy}
              onChange={e => setRequestedBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-creditcard-purple/30"
              placeholder="Your name or team"
            />
          </div>

          {/* Justification */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Justification <span className="text-red-400">*</span>
            </label>
            <textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-creditcard-purple/30 resize-none"
              placeholder="Explain why this change is needed..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-creditcard-purple rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ReviewModal ───────────────────────────────────────────────────────────────

function ReviewModal({ request, mode, onClose, onDone }) {
  const [actor, setActor] = useState(mode === 'approve' ? 'RISK_MANAGER' : 'RISK_MANAGER')
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isApprove = mode === 'approve'

  const submit = async () => {
    if (!isApprove && !comments.trim()) { setError('Reason is required for rejection'); return }
    setSaving(true); setError('')
    try {
      let updated
      if (isApprove) {
        updated = await approveChangeRequest(request.id, actor, comments)
      } else {
        updated = await rejectChangeRequest(request.id, actor, comments)
      }
      onDone(updated)
      onClose()
    } catch (e) {
      setError(e.response?.data?.reason?.localizedMessage || e.response?.data?.message || 'Action failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className={`p-5 border-b ${isApprove ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'} rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isApprove ? 'bg-green-500' : 'bg-red-500'}`}>
              {isApprove
                ? <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              }
            </div>
            <div>
              <h3 className={`font-bold ${isApprove ? 'text-green-800' : 'text-red-800'}`}>
                {isApprove ? 'Approve Change' : 'Reject Change'}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{request.configKey}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-700">{request.previousValue}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className={`font-bold ${isApprove ? 'text-green-700' : 'text-gray-700'}`}>{request.proposedValue}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reviewer Name</label>
            <input value={actor} onChange={e => setActor(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-creditcard-purple/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Comments {!isApprove && <span className="text-red-400">*</span>}
            </label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-creditcard-purple/30 resize-none"
              placeholder={isApprove ? 'Optional comments...' : 'Reason for rejection (required)'}
            />
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {saving ? '...' : isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ConfigRow ─────────────────────────────────────────────────────────────────

function ConfigRow({ cfg, pendingRequest, approvedRequest, onPropose }) {
  const hasPending  = !!pendingRequest
  const hasApproved = !!approvedRequest
  const keyLabel    = cfg.configKey.split('.').slice(1).join(' › ')

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Key */}
      <td className="py-3 px-4 w-60">
        <div className="text-sm font-medium text-gray-800 capitalize">{keyLabel}</div>
        <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{cfg.configKey}</div>
      </td>

      {/* Description */}
      <td className="py-3 px-4 text-xs text-gray-500 max-w-xs">{cfg.description}</td>

      {/* Type */}
      <td className="py-3 px-4 text-center w-20">
        <DataTypeBadge type={cfg.dataType} />
      </td>

      {/* Live value */}
      <td className="py-3 px-4 w-40">
        {cfg.dataType === 'BOOLEAN' ? (
          <div className={`inline-flex h-6 w-11 items-center rounded-full ${cfg.configValue === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 ml-1 rounded-full bg-white shadow transform ${cfg.configValue === 'true' ? 'translate-x-5' : ''}`} />
          </div>
        ) : (
          <span className="text-sm font-semibold text-gray-800">{cfg.configValue}</span>
        )}
      </td>

      {/* Pending / Approved indicator */}
      <td className="py-3 px-4 w-52">
        {hasPending && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-amber-700 font-medium">Pending:</span>
            <span className="text-gray-500">{pendingRequest.previousValue}</span>
            <span className="text-gray-400">→</span>
            <span className="font-bold text-amber-800">{pendingRequest.proposedValue}</span>
          </div>
        )}
        {hasApproved && !hasPending && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <span className="text-blue-700 font-medium">Approved:</span>
            <span className="text-gray-500">{approvedRequest.previousValue}</span>
            <span className="text-gray-400">→</span>
            <span className="font-bold text-blue-800">{approvedRequest.proposedValue}</span>
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 w-32 text-right">
        <button
          onClick={() => onPropose(cfg)}
          disabled={hasPending || hasApproved}
          title={hasPending ? 'A pending change request exists' : hasApproved ? 'An approved change is awaiting publish' : 'Propose a change'}
          className="text-xs px-3 py-1.5 rounded-lg border border-creditcard-purple text-creditcard-purple font-semibold hover:bg-creditcard-purple/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {hasPending ? 'Pending' : hasApproved ? 'Approved' : 'Propose'}
        </button>
      </td>
    </tr>
  )
}

// ─── ChangeRequestRow ──────────────────────────────────────────────────────────

function ChangeRequestRow({ req, onUpdate }) {
  const [reviewModal, setReviewModal] = useState(null) // 'approve' | 'reject' | null
  const [publishing, setPublishing] = useState(false)
  const cat = CATEGORIES.find(c => c.key === req.category)

  const doPublish = async () => {
    setPublishing(true)
    try {
      const updated = await publishChangeRequest(req.id, 'RELEASE_MANAGER')
      onUpdate(updated)
    } finally { setPublishing(false) }
  }

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        {/* Category */}
        <td className="py-3 px-4 w-36">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${COLORS[cat?.color || 'blue']}`}>
            {cat?.icon} {cat?.label || req.category}
          </span>
        </td>

        {/* Parameter */}
        <td className="py-3 px-4 w-56">
          <div className="text-sm font-medium text-gray-800 capitalize">
            {req.configKey.split('.').slice(1).join(' › ')}
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{req.configKey}</div>
        </td>

        {/* Change */}
        <td className="py-3 px-4 w-48">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 line-through">{req.previousValue}</span>
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="font-bold text-gray-900">{req.proposedValue}</span>
          </div>
        </td>

        {/* Requested by / date */}
        <td className="py-3 px-4 w-36 text-xs text-gray-500">
          <div className="font-medium text-gray-700">{req.requestedBy}</div>
          <div className="text-gray-400">{fmtDate(req.requestedAt)}</div>
        </td>

        {/* Justification */}
        <td className="py-3 px-4 text-xs text-gray-500 max-w-xs">
          {req.reviewComments && req.status === 'PENDING_APPROVAL'
            ? <span className="italic">{req.reviewComments}</span>
            : req.status !== 'PENDING_APPROVAL' && req.reviewComments
              ? <span>{req.reviewComments}</span>
              : <span className="text-gray-300">—</span>
          }
        </td>

        {/* Reviewer */}
        <td className="py-3 px-4 w-36 text-xs text-gray-500">
          {req.reviewedBy
            ? <><div className="font-medium text-gray-700">{req.reviewedBy}</div><div className="text-gray-400">{fmtDate(req.reviewedAt)}</div></>
            : req.status === 'PUBLISHED'
              ? <><div className="font-medium text-gray-700">{req.publishedBy}</div><div className="text-gray-400">{fmtDate(req.publishedAt)}</div></>
              : <span className="text-gray-300">—</span>
          }
        </td>

        {/* Status */}
        <td className="py-3 px-4 w-28 text-center">
          <StatusBadge status={req.status} />
        </td>

        {/* Actions */}
        <td className="py-3 px-4 w-40 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {req.status === 'PENDING_APPROVAL' && (
              <>
                <button onClick={() => setReviewModal('approve')}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors">
                  Approve
                </button>
                <button onClick={() => setReviewModal('reject')}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 font-semibold hover:bg-red-50 transition-colors">
                  Reject
                </button>
              </>
            )}
            {req.status === 'APPROVED' && (
              <button onClick={doPublish} disabled={publishing}
                className="text-xs px-3 py-1.5 rounded-lg bg-creditcard-purple text-white font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {publishing
                  ? <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>...</>
                  : <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Publish
                  </>
                }
              </button>
            )}
          </div>
        </td>
      </tr>

      {reviewModal && (
        <ReviewModal
          request={req}
          mode={reviewModal}
          onClose={() => setReviewModal(null)}
          onDone={onUpdate}
        />
      )}
    </>
  )
}

// ─── ParametersTab ─────────────────────────────────────────────────────────────

function ParametersTab({ configs, changeRequests, onRefresh }) {
  const [selectedCategory, setSelectedCategory] = useState('CREDIT_DECISION')
  const [search, setSearch]                     = useState('')
  const [proposeTarget, setProposeTarget]       = useState(null)

  const pendingByKey  = useMemo(() => Object.fromEntries(changeRequests.filter(r => r.status === 'PENDING_APPROVAL').map(r => [r.configKey, r])), [changeRequests])
  const approvedByKey = useMemo(() => Object.fromEntries(changeRequests.filter(r => r.status === 'APPROVED').map(r => [r.configKey, r])), [changeRequests])

  const countsByCategory = useMemo(() => {
    const c = {}; configs.forEach(x => { c[x.category] = (c[x.category] || 0) + 1 }); return c
  }, [configs])

  const pendingCountsByCategory = useMemo(() => {
    const c = {}; changeRequests.filter(r => r.status === 'PENDING_APPROVAL').forEach(r => { c[r.category] = (c[r.category] || 0) + 1 }); return c
  }, [changeRequests])

  const filteredConfigs = useMemo(() => {
    let list = configs.filter(c => c.category === selectedCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.configKey.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
    }
    return list
  }, [configs, selectedCategory, search])

  const grouped = useMemo(() => groupConfigs(filteredConfigs), [filteredConfigs])
  const cat = CATEGORIES.find(c => c.key === selectedCategory)

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0">
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search params..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-creditcard-purple/30 bg-white" />
        </div>
        <nav className="space-y-0.5">
          {CATEGORIES.map(c => {
            const isActive = selectedCategory === c.key
            const pending  = pendingCountsByCategory[c.key] || 0
            return (
              <button key={c.key} onClick={() => { setSelectedCategory(c.key); setSearch('') }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${isActive ? 'bg-creditcard-purple text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span className="text-base leading-none">{c.icon}</span>
                <span className="flex-1 text-sm">{c.label}</span>
                <div className="flex items-center gap-1.5">
                  {pending > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{countsByCategory[c.key] || 0}</span>
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Table */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-base">{cat?.icon}</span>
          <h2 className="font-bold text-gray-800">{cat?.label}</h2>
          <span className="text-xs text-gray-400">— {filteredConfigs.length} params</span>
          {pendingCountsByCategory[selectedCategory] > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {pendingCountsByCategory[selectedCategory]} pending
            </span>
          )}
        </div>

        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{formatGroupLabel(group)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left px-4 py-2 w-52">Parameter</th>
                    <th className="text-left px-4 py-2">Description</th>
                    <th className="text-center px-4 py-2 w-20">Type</th>
                    <th className="text-left px-4 py-2 w-36">Live Value</th>
                    <th className="text-left px-4 py-2 w-52">Change Status</th>
                    <th className="px-4 py-2 w-28" />
                  </tr>
                </thead>
                <tbody>
                  {items.map(cfg => (
                    <ConfigRow
                      key={cfg.configKey}
                      cfg={cfg}
                      pendingRequest={pendingByKey[cfg.configKey]}
                      approvedRequest={approvedByKey[cfg.configKey]}
                      onPropose={setProposeTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {proposeTarget && (
        <ProposeModal
          cfg={proposeTarget}
          onClose={() => setProposeTarget(null)}
          onSubmitted={() => { setProposeTarget(null); onRefresh() }}
        />
      )}
    </div>
  )
}

// ─── ApprovalQueueTab ──────────────────────────────────────────────────────────

function ApprovalQueueTab({ changeRequests, onUpdate, onRefresh }) {
  const [filter, setFilter]         = useState('PENDING_APPROVAL')
  const [publishingAll, setPublishingAll] = useState(false)

  const counts = useMemo(() => {
    const c = { ALL: changeRequests.length }
    changeRequests.forEach(r => { c[r.status] = (c[r.status] || 0) + 1 })
    return c
  }, [changeRequests])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return changeRequests
    return changeRequests.filter(r => r.status === filter)
  }, [changeRequests, filter])

  const approvedCount = counts['APPROVED'] || 0

  const doPublishAll = async () => {
    setPublishingAll(true)
    try {
      await publishAllChangeRequests('RELEASE_MANAGER')
      onRefresh()
    } finally { setPublishingAll(false) }
  }

  const FILTERS = [
    { key: 'PENDING_APPROVAL', label: 'Pending' },
    { key: 'APPROVED',         label: 'Approved' },
    { key: 'PUBLISHED',        label: 'Published' },
    { key: 'REJECTED',         label: 'Rejected' },
    { key: 'ALL',              label: 'All' },
  ]

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Pending Review',   count: counts['PENDING_APPROVAL'] || 0, color: 'bg-amber-50 border-amber-200 text-amber-700',  dot: 'bg-amber-400' },
          { label: 'Approved',         count: counts['APPROVED'] || 0,         color: 'bg-blue-50 border-blue-200 text-blue-700',     dot: 'bg-blue-400' },
          { label: 'Published',        count: counts['PUBLISHED'] || 0,        color: 'bg-green-50 border-green-200 text-green-700',  dot: 'bg-green-400' },
          { label: 'Rejected',         count: counts['REJECTED'] || 0,         color: 'bg-red-50 border-red-200 text-red-700',        dot: 'bg-red-400' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl border ${s.color} flex items-center gap-3`}>
            <span className={`w-3 h-3 rounded-full ${s.dot} flex-shrink-0`} />
            <div>
              <div className="text-2xl font-bold">{s.count}</div>
              <div className="text-xs opacity-80">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f.label} {counts[f.key] !== undefined && counts[f.key] > 0 && <span className="ml-1 opacity-60">({counts[f.key]})</span>}
            </button>
          ))}
        </div>

        {approvedCount > 0 && (
          <button onClick={doPublishAll} disabled={publishingAll}
            className="flex items-center gap-2 px-4 py-2 bg-creditcard-purple text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {publishingAll ? 'Publishing...' : `Publish All Approved (${approvedCount})`}
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">
            {filter === 'PENDING_APPROVAL' ? '✅' : filter === 'PUBLISHED' ? '🚀' : '📋'}
          </div>
          <p className="text-gray-500 text-sm">No {filter === 'ALL' ? '' : FILTERS.find(f => f.key === filter)?.label.toLowerCase() + ' '}change requests</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr className="text-xs text-gray-400 font-medium">
                  <th className="text-left px-4 py-3 w-32">Category</th>
                  <th className="text-left px-4 py-3 w-52">Parameter</th>
                  <th className="text-left px-4 py-3 w-44">Change</th>
                  <th className="text-left px-4 py-3 w-36">Requested By</th>
                  <th className="text-left px-4 py-3">Justification / Comment</th>
                  <th className="text-left px-4 py-3 w-36">Reviewed By</th>
                  <th className="text-center px-4 py-3 w-28">Status</th>
                  <th className="px-4 py-3 w-40" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <ChangeRequestRow key={req.id} req={req} onUpdate={r => { onUpdate(r); onRefresh() }} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ConfigurationsPage() {
  const [configs, setConfigs]               = useState([])
  const [changeRequests, setChangeRequests] = useState([])
  const [loading, setLoading]               = useState(true)
  const [activeTab, setActiveTab]           = useState('parameters')

  const load = useCallback(async () => {
    const [cfgs, reqs] = await Promise.all([getConfigurations(), getChangeRequests()])
    setConfigs(cfgs)
    setChangeRequests(reqs)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRequestUpdate = useCallback((updated) => {
    setChangeRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
    // If published, update live config value too
    if (updated.status === 'PUBLISHED') {
      setConfigs(prev => prev.map(c => c.configKey === updated.configKey
        ? { ...c, configValue: updated.proposedValue, lastModifiedBy: updated.publishedBy }
        : c))
    }
  }, [])

  const pendingCount  = changeRequests.filter(r => r.status === 'PENDING_APPROVAL').length
  const approvedCount = changeRequests.filter(r => r.status === 'APPROVED').length

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-creditcard-purple mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading configurations...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-creditcard-purple flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Configurations</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {configs.length} parameters · Changes require approval before publishing to production
                </p>
              </div>
            </div>

            {/* Alert badges */}
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <button onClick={() => setActiveTab('queue')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-sm font-semibold text-amber-700">{pendingCount} awaiting review</span>
                </button>
              )}
              {approvedCount > 0 && (
                <button onClick={() => setActiveTab('queue')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-sm font-semibold text-blue-700">{approvedCount} ready to publish</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {[
              { key: 'parameters', label: 'Parameters', count: configs.length },
              { key: 'queue',      label: 'Approval Queue',
                count: pendingCount + approvedCount,
                highlight: pendingCount > 0 || approvedCount > 0 },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-creditcard-purple text-creditcard-purple bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
                {t.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    t.highlight ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'parameters' ? (
          <ParametersTab configs={configs} changeRequests={changeRequests} onRefresh={load} />
        ) : (
          <ApprovalQueueTab changeRequests={changeRequests} onUpdate={handleRequestUpdate} onRefresh={load} />
        )}
      </div>
    </div>
  )
}
