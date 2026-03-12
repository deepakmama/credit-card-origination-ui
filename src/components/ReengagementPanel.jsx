import { useEffect, useState } from 'react'
import { getReengagement, cancelCampaign } from '../api/cardApi'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

function statusStyle(status) {
  switch (status) {
    case 'SENT': return 'bg-green-100 text-green-700'
    case 'CANCELLED': return 'bg-gray-100 text-gray-500 line-through'
    default: return 'bg-blue-100 text-blue-700'
  }
}

export default function ReengagementPanel({ applicationId }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    if (!applicationId) return
    getReengagement(applicationId)
      .then(data => setCampaigns(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [applicationId])

  const handleCancel = async (campaignId) => {
    setCancelling(campaignId)
    try {
      const updated = await cancelCampaign(campaignId)
      setCampaigns(prev => prev.map(c => c.id === campaignId ? updated : c))
    } catch (e) {
      // ignore
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return null
  if (campaigns.length === 0) return null

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Re-engagement Campaigns</h3>
      <p className="text-xs text-gray-500 mb-4">
        Scheduled follow-up emails to help {campaigns[0]?.applicantName?.split(' ')[0]} re-apply when eligible.
      </p>

      {/* 3-node timeline */}
      <div className="flex items-start justify-between relative">
        {/* Connector line */}
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200" />

        {campaigns.map((c, i) => (
          <div key={c.id} className="flex flex-col items-center flex-1 relative">
            {/* Node */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow z-10 ${
              c.status === 'CANCELLED' ? 'bg-gray-300 text-gray-500' :
              c.status === 'SENT' ? 'bg-green-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {c.dayOffset}d
            </div>

            {/* Details */}
            <div className="mt-2 text-center max-w-24">
              <div className="text-xs font-semibold text-gray-700">Day {c.dayOffset}</div>
              <div className="text-xs text-gray-500">{fmtDate(c.scheduledAt)}</div>
              <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle(c.status)}`}>
                {c.status}
              </span>
              {c.status === 'SCHEDULED' && (
                <button
                  onClick={() => handleCancel(c.id)}
                  disabled={cancelling === c.id}
                  className="block mt-1.5 mx-auto text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
                >
                  {cancelling === c.id ? '...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {campaigns[0]?.denialReason && (
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          Denial reason: <span className="font-medium text-gray-700">{campaigns[0].denialReason}</span>
        </div>
      )}
    </div>
  )
}
