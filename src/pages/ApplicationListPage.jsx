import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplications } from '../api/cardApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

const fmt = (n) => n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

export default function ApplicationListPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    getApplications()
      .then(setApps)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = apps.filter(a => {
    const q = search.toLowerCase()
    const name = `${a.applicant?.firstName} ${a.applicant?.lastName}`.toLowerCase()
    return !q || name.includes(q) || a.id?.includes(q) || a.status?.toLowerCase().includes(q)
  })

  const summary = {
    total: apps.length,
    issued: apps.filter(a => a.status === 'CARD_ISSUED').length,
    denied: apps.filter(a => a.status === 'DENIED').length,
    manual: apps.filter(a => a.status === 'MANUAL_REVIEW').length,
    inProgress: apps.filter(a => !['CARD_ISSUED','DENIED','MANUAL_REVIEW'].includes(a.status)).length,
  }

  if (loading) return <LoadingSpinner message="Loading applications..." />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <Link to="/apply" className="btn-primary px-4 py-2">+ New Application</Link>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: summary.total, color: 'text-gray-700' },
          { label: 'Card Issued', value: summary.issued, color: 'text-green-600' },
          { label: 'Denied', value: summary.denied, color: 'text-red-600' },
          { label: 'Manual Review', value: summary.manual, color: 'text-amber-600' },
          { label: 'In Progress', value: summary.inProgress, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ID, or status..."
          className="form-input max-w-sm"
        />
      </div>

      {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Card Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Credit Limit</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Credit Score</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    {apps.length === 0 ? 'No applications yet. Submit your first one!' : 'No results match your search.'}
                  </td>
                </tr>
              ) : filtered.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {app.applicant?.firstName} {app.applicant?.lastName}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{app.id?.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-700">{{ CASH_BACK: 'Summit Reserve', BALANCE_TRANSFER: 'Summit', NEW_TO_CREDIT: 'Amp' }[app.cardRequest?.cardType] || app.cardRequest?.cardType?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {app.creditLimit != null ? fmt(app.creditLimit) : app.approvedCreditLimit != null ? fmt(app.approvedCreditLimit) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {app.creditScore != null ? (
                      <span className={`font-semibold ${app.creditScore >= 720 ? 'text-green-600' : app.creditScore >= 650 ? 'text-amber-600' : 'text-red-600'}`}>
                        {app.creditScore}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(app.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/applications/${app.id}`} className="text-citizens-green hover:text-citizens-green-dark font-medium text-xs">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
