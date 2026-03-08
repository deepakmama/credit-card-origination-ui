import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplications } from '../api/cardApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

const fmt = (n) => n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) : '—'
const pct = (n, d) => d ? Math.round(n / d * 100) + '%' : '0%'

export default function DashboardPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApplications().then(setApps).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  const total = apps.length
  const issued = apps.filter(a => a.status === 'CARD_ISSUED')
  const denied = apps.filter(a => a.status === 'DENIED')
  const manual = apps.filter(a => a.status === 'MANUAL_REVIEW')
  const inProgress = apps.filter(a => !['CARD_ISSUED','DENIED','MANUAL_REVIEW'].includes(a.status))

  const avgCreditScore = apps.filter(a => a.creditScore).reduce((s, a, _, arr) => s + a.creditScore / arr.length, 0)
  const avgLimit = issued.filter(a => a.creditLimit).reduce((s, a, _, arr) => s + a.creditLimit / arr.length, 0)

  // Prefill insights
  const withBank    = apps.filter(a => a.applicant?.existingBankRelationship)
  const withoutBank = apps.filter(a => !a.applicant?.existingBankRelationship)
  const bankApprovalRate    = pct(withBank.filter(a => a.status === 'CARD_ISSUED').length, withBank.length)
  const nonBankApprovalRate = pct(withoutBank.filter(a => a.status === 'CARD_ISSUED').length, withoutBank.length)

  // Card type breakdown
  const CARD_TYPE_LABELS = { CASH_BACK: 'Summit Reserve', BALANCE_TRANSFER: 'Summit', NEW_TO_CREDIT: 'Amp' }
  const byCardType = ['CASH_BACK','BALANCE_TRANSFER','NEW_TO_CREDIT'].map(ct => ({
    type: ct,
    label: CARD_TYPE_LABELS[ct] || ct.replace(/_/g, ' '),
    total: apps.filter(a => a.cardRequest?.cardType === ct).length,
    issued: apps.filter(a => a.cardRequest?.cardType === ct && a.status === 'CARD_ISSUED').length,
    denied: apps.filter(a => a.cardRequest?.cardType === ct && a.status === 'DENIED').length,
  }))

  // Score buckets
  const scoreBuckets = [
    { label: '800+', min: 800, max: 999 },
    { label: '750–799', min: 750, max: 799 },
    { label: '700–749', min: 700, max: 749 },
    { label: '650–699', min: 650, max: 699 },
    { label: '600–649', min: 600, max: 649 },
    { label: '<600', min: 0, max: 599 },
  ].map(b => {
    const bucket = apps.filter(a => a.creditScore != null && a.creditScore >= b.min && a.creditScore <= b.max)
    return { ...b, count: bucket.length, approved: bucket.filter(a => a.status === 'CARD_ISSUED').length }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Applications', value: total, color: 'bg-citizens-green-light text-citizens-green' },
          { label: 'Approval Rate', value: pct(issued.length, total), color: 'bg-green-50 text-green-700' },
          { label: 'Avg Credit Limit', value: fmt(avgLimit), color: 'bg-blue-50 text-blue-700' },
          { label: 'Avg Credit Score', value: avgCreditScore ? Math.round(avgCreditScore) : '—', color: 'bg-amber-50 text-amber-700' },
          { label: 'Bank Prefill Rate', value: pct(withBank.length, total), color: 'bg-purple-50 text-purple-700' },
        ].map(kpi => (
          <div key={kpi.label} className={`card p-5 ${kpi.color}`}>
            <div className="text-3xl font-bold mb-1">{kpi.value}</div>
            <div className="text-sm font-medium opacity-75">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline Funnel */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Pipeline Funnel</h2>
          {[
            { label: 'Submitted', count: total, color: 'bg-gray-200' },
            { label: 'KYC Passed', count: apps.filter(a => a.kycVerified).length, color: 'bg-blue-300' },
            { label: 'Fraud Cleared', count: apps.filter(a => a.fraudScore != null && a.fraudScore <= 80).length, color: 'bg-indigo-300' },
            { label: 'Credit Approved', count: apps.filter(a => a.decisionType === 'APPROVED').length, color: 'bg-purple-300' },
            { label: 'Card Issued', count: issued.length, color: 'bg-green-400' },
          ].map((step, i) => (
            <div key={step.label} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{step.label}</span>
                <span className="font-medium">{step.count} ({pct(step.count, total)})</span>
              </div>
              <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${step.color} rounded-full transition-all`}
                     style={{ width: total > 0 ? `${step.count / total * 100}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* By Card Type */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">By Card Type</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Total</th>
                <th className="pb-2 font-medium text-right">Issued</th>
                <th className="pb-2 font-medium text-right">Denied</th>
                <th className="pb-2 font-medium text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {byCardType.map(row => (
                <tr key={row.type} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-800">{row.label}</td>
                  <td className="py-2 text-right text-gray-600">{row.total}</td>
                  <td className="py-2 text-right text-green-600 font-medium">{row.issued}</td>
                  <td className="py-2 text-right text-red-500">{row.denied}</td>
                  <td className="py-2 text-right font-semibold text-citizens-green">{pct(row.issued, row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Score Buckets */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Approval Rate by Credit Score</h2>
        <div className="grid grid-cols-6 gap-3">
          {scoreBuckets.map(b => (
            <div key={b.label} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{b.label}</div>
              <div className="text-lg font-bold text-gray-800">{b.count}</div>
              <div className="text-xs text-green-600 font-medium">{pct(b.approved, b.count)} approved</div>
            </div>
          ))}
        </div>
      </div>

      {/* Prefill Insights */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Prefill Insights</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Bank prefill breakdown */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bank Relationship Prefill</div>
            <div className="space-y-3">
              {[
                { label: 'With Bank Prefill', count: withBank.length, rate: bankApprovalRate, color: 'bg-purple-400' },
                { label: 'Without Bank Prefill', count: withoutBank.length, rate: nonBankApprovalRate, color: 'bg-gray-300' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-medium text-gray-700">{row.count} apps · <span className="text-green-600">{row.rate} approved</span></span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all`}
                         style={{ width: total > 0 ? `${row.count / total * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 content-start">
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-700">{withBank.length}</div>
              <div className="text-xs text-purple-500 mt-0.5">Used Bank Prefill</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-700">{bankApprovalRate}</div>
              <div className="text-xs text-green-500 mt-0.5">Approval w/ Prefill</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-600">{withoutBank.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">Manual Entry</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-600">{nonBankApprovalRate}</div>
              <div className="text-xs text-amber-500 mt-0.5">Approval w/o Prefill</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Applications</h2>
        {apps.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No applications yet. <Link to="/apply" className="text-citizens-green hover:underline">Create one</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {apps.slice(0, 10).map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-citizens-green-light rounded-full flex items-center justify-center text-xs font-bold text-citizens-green">
                    {app.applicant?.firstName?.[0]}{app.applicant?.lastName?.[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-800">{app.applicant?.firstName} {app.applicant?.lastName}</div>
                    <div className="text-xs text-gray-400">{CARD_TYPE_LABELS[app.cardRequest?.cardType] || app.cardRequest?.cardType?.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={app.status} />
                  <Link to={`/applications/${app.id}`} className="text-citizens-green text-xs hover:underline">View →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
