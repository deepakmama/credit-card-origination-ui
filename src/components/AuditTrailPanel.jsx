import { useState } from 'react'
import { getAuditTrail } from '../api/cardApi'

const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—'

function eventStyle(eventType) {
  switch (eventType) {
    case 'MANUAL_OVERRIDE': return { dot: 'bg-amber-400', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
    case 'ACTIVATION': return { dot: 'bg-blue-400', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' }
    case 'PIPELINE':
    default:
      return { dot: 'bg-citizens-green', text: 'text-citizens-green', badge: 'bg-citizens-green-light text-citizens-green' }
  }
}

export default function AuditTrailPanel({ applicationId }) {
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const toggle = async () => {
    if (!open && events.length === 0) {
      setLoading(true)
      try {
        const data = await getAuditTrail(applicationId)
        setEvents(data || [])
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    setOpen(o => !o)
  }

  const visible = showAll ? events : events.slice(-3)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="font-semibold text-gray-800 text-sm">Decision Audit Trail</span>
          {events.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{events.length} events</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {loading && <div className="py-4 text-center text-sm text-gray-500">Loading audit trail...</div>}
          {!loading && events.length === 0 && (
            <div className="py-4 text-center text-sm text-gray-500">No audit events found.</div>
          )}
          {!loading && events.length > 0 && (
            <>
              {!showAll && events.length > 3 && (
                <button onClick={() => setShowAll(true)}
                  className="w-full text-xs text-citizens-green hover:underline py-2 text-center">
                  Show all {events.length} events
                </button>
              )}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-2.5 top-4 bottom-4 w-px bg-gray-200" />
                <div className="space-y-4 mt-3">
                  {visible.map((ev, i) => {
                    const s = eventStyle(ev.eventType)
                    return (
                      <div key={ev.id || i} className="flex gap-4 relative">
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-2 border-white shadow ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                              {ev.eventType}
                            </span>
                            {ev.oldStatus && ev.newStatus && (
                              <span className="text-xs text-gray-600">
                                <span className="font-mono bg-gray-100 px-1 rounded">{ev.oldStatus}</span>
                                {' → '}
                                <span className="font-mono bg-gray-100 px-1 rounded">{ev.newStatus}</span>
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">{fmtDate(ev.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {ev.actor && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                {ev.actor}
                              </span>
                            )}
                            {ev.reason && (
                              <span className="text-xs text-gray-600">{ev.reason}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {showAll && events.length > 3 && (
                <button onClick={() => setShowAll(false)}
                  className="w-full text-xs text-citizens-green hover:underline py-2 text-center mt-2">
                  Show fewer
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
