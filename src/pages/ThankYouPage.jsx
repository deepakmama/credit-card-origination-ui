import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getApplication } from '../api/cardApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ThankYouPage() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApplication(id).then(setApp).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner message="Fetching your application..." />

  const isApproved = app?.status === 'CARD_ISSUED'
  const isDenied = app?.status === 'DENIED'
  const isManual = app?.status === 'MANUAL_REVIEW'

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">
        {isApproved ? '🎉' : isDenied ? '❌' : '⏳'}
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {isApproved ? 'Congratulations!' : isDenied ? 'Application Not Approved' : 'Under Review'}
      </h1>
      <p className="text-gray-500 mb-6">
        {isApproved
          ? 'Your credit card has been approved and issued. Your card will arrive in 5–7 business days.'
          : isDenied
            ? 'Unfortunately we were unable to approve your application at this time.'
            : 'Your application requires manual review. We will contact you within 2–3 business days.'}
      </p>

      {app && (
        <div className="card p-6 text-left mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Application ID</span>
            <span className="text-sm font-mono text-gray-700">{app.id?.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Status</span>
            <StatusBadge status={app.status} />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Card Type</span>
            <span className="text-sm font-medium">{app.cardRequest?.cardType?.replace(/_/g, ' ')}</span>
          </div>
          {isApproved && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Credit Limit</span>
                <span className="text-sm font-semibold text-green-600">
                  {app.creditLimit != null ? `$${Number(app.creditLimit).toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Card Number</span>
                <span className="text-sm font-mono">{app.maskedCardNumber}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Link to={`/applications/${id}`} className="btn-primary px-6 py-2.5">
          View Full Details
        </Link>
        <Link to="/applications" className="btn-secondary px-6 py-2.5">
          All Applications
        </Link>
        {(isDenied || isManual) && (
          <Link to="/apply" className="btn-secondary px-6 py-2.5">
            New Application
          </Link>
        )}
      </div>
    </div>
  )
}
