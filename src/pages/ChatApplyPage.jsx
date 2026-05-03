import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { sendChatMessage, submitApplication, prefillWithProve } from '../api/cardApi'

// ── Field extraction from assistant messages ───────────────────────────────────
function extractFields(messages) {
  const fields = {}
  const text = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n')

  const patterns = {
    firstName:              /first\s*name[:\s]+([A-Za-z]+)/i,
    lastName:               /last\s*name[:\s]+([A-Za-z]+)/i,
    email:                  /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
    phone:                  /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/,
    ssn:                    /\d{3}-\d{2}-\d{4}/,
    dob:                    /\d{4}-\d{2}-\d{2}/,
    annualIncome:           /annual\s*income[:\s$]*([0-9,]+)/i,
    monthlyHousingPayment:  /(?:monthly\s*housing|housing\s*payment)[:\s$]*([0-9,]+)/i,
    cardType:               /card\s*type[:\s]*(CASH_BACK|BALANCE_TRANSFER|NEW_TO_CREDIT)/i,
    employmentType:         /employment\s*type[:\s]*(EMPLOYED|SELF_EMPLOYED|STUDENT|UNEMPLOYED|RETIRED)/i,
    requestedCreditLimit:   /(?:requested\s*)?credit\s*limit[:\s$]*([0-9,]+)/i,
  }

  for (const [k, re] of Object.entries(patterns)) {
    const m = text.match(re)
    if (m) fields[k] = m[1] ? m[1].replace(/,/g, '') : m[0]
  }
  return fields
}

// ── Submit token parser ────────────────────────────────────────────────────────
function parseSubmitToken(text) {
  const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
  const match = cleaned.match(/\[SUBMIT_APPLICATION\]\s*(\{[\s\S]*\})/)
  if (!match) return null
  try { return JSON.parse(match[1]) } catch { return null }
}

// ── Card type pill ─────────────────────────────────────────────────────────────
const CARD_TYPE_INFO = {
  CASH_BACK:        { label: 'Cash Back',        color: 'bg-creditcard-purple text-white', icon: '💳' },
  BALANCE_TRANSFER: { label: 'Balance Transfer',  color: 'bg-blue-600 text-white',          icon: '🔄' },
  NEW_TO_CREDIT:    { label: 'New to Credit',     color: 'bg-green-600 text-white',         icon: '🌱' },
}

// ── Field labels ───────────────────────────────────────────────────────────────
const FIELD_LABELS = {
  firstName: 'First Name', lastName: 'Last Name',
  email: 'Email', phone: 'Phone',
  ssn: 'SSN', dob: 'Date of Birth',
  annualIncome: 'Annual Income', monthlyHousingPayment: 'Housing Payment',
  cardType: 'Card Type', employmentType: 'Employment',
  requestedCreditLimit: 'Requested Limit',
}
const TOTAL_FIELDS = Object.keys(FIELD_LABELS).length

// ── Summary Panel ──────────────────────────────────────────────────────────────
function SummaryPanel({ fields, submitting, result }) {
  const hasAny = Object.keys(fields).length > 0
  const progress = Math.min(100, Math.round((Object.keys(fields).length / TOTAL_FIELDS) * 100))

  if (result) {
    const isIssued = ['CARD_ISSUED', 'AUTH_USER_ADDED', 'AUTH_USER_SKIPPED', 'BALANCE_TRANSFER_INITIATED'].includes(result.status)
    const isDenied = result.status === 'DENIED'
    const isReview = result.status === 'MANUAL_REVIEW'

    const style = isIssued ? 'bg-green-50 border-green-300 text-green-800'
                : isDenied ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-amber-50 border-amber-300 text-amber-800'

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Application Result</p>
        </div>
        <div className="p-4 flex-1">
          <div className={`border rounded-xl p-4 mb-4 ${style}`}>
            <div className="text-lg font-bold mb-1">
              {isIssued ? '✅ Approved' : isDenied ? '❌ Denied' : '⏳ Under Review'}
            </div>
            <div className="text-sm font-semibold mb-2">{result.status}</div>
            {result.maskedCardNumber && (
              <div className="text-sm font-mono font-bold">Card: {result.maskedCardNumber}</div>
            )}
            {result.approvedCreditLimit && (
              <div className="text-sm">Limit: <strong>${Number(result.approvedCreditLimit).toLocaleString()}</strong></div>
            )}
            {result.finalApr && (
              <div className="text-sm">APR: <strong>{result.finalApr}%</strong></div>
            )}
            {result.decisionReason && (
              <div className="text-xs mt-2 italic opacity-80">{result.decisionReason}</div>
            )}
          </div>
          <Link
            to={`/applications/${result.id}`}
            className="block text-center text-sm font-semibold bg-creditcard-purple text-white rounded-xl py-2.5 hover:bg-purple-700 transition-colors"
          >
            View Full Application →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-creditcard-purple animate-pulse" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Application Progress</p>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-1">
        {submitting && (
          <div className="flex items-center gap-2 text-sm text-creditcard-purple font-medium mb-3">
            <div className="w-4 h-4 border-2 border-creditcard-purple border-t-transparent rounded-full animate-spin" />
            Submitting application…
          </div>
        )}

        {!hasAny && !submitting && (
          <p className="text-xs text-gray-400 italic pt-2">Start chatting to see your information appear here.</p>
        )}

        {Object.entries(fields).map(([k, v]) => (
          <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-400">{FIELD_LABELS[k] ?? k}</span>
            {k === 'cardType' && CARD_TYPE_INFO[v] ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CARD_TYPE_INFO[v].color}`}>
                {CARD_TYPE_INFO[v].icon} {CARD_TYPE_INFO[v].label}
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%] truncate">
                {k === 'annualIncome' || k === 'monthlyHousingPayment' || k === 'requestedCreditLimit'
                  ? `$${Number(v).toLocaleString()}`
                  : k === 'ssn' ? '•••-••-' + v.slice(-4)
                  : v}
              </span>
            )}
          </div>
        ))}

        {hasAny && !submitting && (
          <div className="pt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-creditcard-purple rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card type guide */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Card Options</p>
        {Object.entries(CARD_TYPE_INFO).map(([key, info]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-sm">{info.icon}</span>
            <div>
              <div className="text-xs font-semibold text-gray-700">{info.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chat Bubble ────────────────────────────────────────────────────────────────
function Bubble({ role, content, isThinking }) {
  const isUser = role === 'user'
  const display = content
    .replace(/\[SUBMIT_APPLICATION\]\{[\s\S]*\}/, '[Submitting your application…]')
    .trim()

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5
        ${isUser
          ? 'bg-creditcard-purple text-white'
          : 'bg-white border-2 border-creditcard-purple/30 text-creditcard-purple'
        }`}>
        {isUser ? 'You' : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed
        ${isUser
          ? 'bg-creditcard-purple text-white rounded-tr-sm'
          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
        }`}>
        {isThinking ? (
          <div className="flex gap-1 py-1">
            {[0, 150, 300].map(delay => (
              <div key={delay} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
        ) : (
          <span style={{ whiteSpace: 'pre-wrap' }}>{display}</span>
        )}
      </div>
    </div>
  )
}

// ── PROVE Prefill Bar ──────────────────────────────────────────────────────────
function ProveBar({ onPrefilled, disabled }) {
  const [phone,    setPhone]    = useState('')
  const [ssn4,     setSsn4]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [verified, setVerified] = useState(false)
  const [error,    setError]    = useState('')

  const handleSsn4 = e => setSsn4(e.target.value.replace(/\D/g, '').slice(0, 4))
  const canVerify  = phone.trim().length >= 10 && ssn4.length === 4

  const verify = async () => {
    if (!canVerify || loading) return
    setLoading(true); setError('')
    try {
      const data = await prefillWithProve(phone.trim(), ssn4)
      if (data.verificationStatus === 'VERIFIED') {
        setVerified(true)
        onPrefilled(data)
      } else {
        setError('Identity not recognised — please fill details manually in the chat.')
      }
    } catch {
      setError('PROVE lookup failed — please continue manually.')
    } finally { setLoading(false) }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-200 text-sm text-green-800 flex-shrink-0">
        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="font-semibold">PROVE verified</span>
        <span className="text-green-600 text-xs">— identity prefilled, continuing with remaining fields</span>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-5 h-5 rounded bg-creditcard-purple flex items-center justify-center">
            <span className="text-white text-[9px] font-black">P</span>
          </div>
          <span className="text-xs font-bold text-creditcard-purple">PROVE</span>
          <span className="text-xs text-purple-500 hidden sm:inline">· Skip manual entry</span>
        </div>

        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && verify()}
          placeholder="Phone  e.g. 6175550001"
          disabled={disabled || loading}
          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-creditcard-purple/30 bg-white disabled:opacity-50"
        />
        <input
          type="password"
          value={ssn4}
          onChange={handleSsn4}
          onKeyDown={e => e.key === 'Enter' && verify()}
          placeholder="Last 4 SSN"
          maxLength={4}
          disabled={disabled || loading}
          className="w-24 px-2.5 py-1.5 text-xs border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-creditcard-purple/30 bg-white tracking-widest disabled:opacity-50"
        />
        <button
          type="button"
          onClick={verify}
          disabled={!canVerify || loading || disabled}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-creditcard-purple rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors"
        >
          {loading ? '…' : 'Verify & Prefill'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      {!error && <p className="text-[10px] text-purple-400 mt-1">Try: 6175550001 + 6789 · 6175550005 + 4321 · 6175550008 + 3344</p>}
    </div>
  )
}

// ── Suggested prompts ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "I'd like a cash back card",
  "I want to transfer a balance",
  "I'm new to credit cards",
  "What card is right for me?",
]

// ── Main Page ──────────────────────────────────────────────────────────────────
const GREETING = `Hi! I'm your Citizens Credit Card assistant. I can help you apply for a new credit card in just a few minutes.

We offer three cards:
💳 Cash Back — earn rewards on everyday purchases
🔄 Balance Transfer — consolidate existing card debt at a lower rate
🌱 New to Credit — build your credit history

Let's get started! What's your first and last name?`

export default function ChatApplyPage() {
  const [messages,   setMessages]   = useState([{ role: 'assistant', content: GREETING }])
  const [input,      setInput]      = useState('')
  const [thinking,   setThinking]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)
  const [proveVerified, setProveVerified] = useState(false)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const fields = useMemo(() => extractFields(messages), [messages])

  async function handleSend(text) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || thinking || submitting) return

    const userMsg    = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setThinking(true)
    setError(null)

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const response    = await sendChatMessage(apiMessages)
      const assistantText = response.content?.[0]?.text ?? ''

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])

      // Check for submit token
      const payload = parseSubmitToken(assistantText)
      if (payload) {
        setThinking(false)
        setSubmitting(true)
        try {
          const appResult = await submitApplication(payload)
          setResult(appResult)
        } catch (err) {
          setError('Application submission failed: ' + (err.response?.data?.reason?.localizedMessage ?? err.message))
        } finally {
          setSubmitting(false)
        }
        return
      }
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'API key not configured. Add ANTHROPIC_API_KEY to your .env file and restart Vite.'
        : (err.response?.data?.error?.message ?? err.message ?? 'Failed to contact AI assistant.')
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I ran into an issue: ${msg}` }])
      setError(msg)
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  function handleReset() {
    setMessages([{ role: 'assistant', content: GREETING }])
    setInput('')
    setResult(null)
    setError(null)
    setThinking(false)
    setSubmitting(false)
    setProveVerified(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function handleProvePrefill(data) {
    setProveVerified(true)
    // Inject prefilled identity into the conversation so Claude knows what's already collected
    const prefillMsg = `[PROVE_PREFILL] My identity has been verified. Here is my prefilled information:
- First Name: ${data.firstName}
- Last Name: ${data.lastName}
- SSN: ${data.ssn}
- Date of Birth: ${data.dob}
- Address: ${data.address}
- Email: ${data.email}
- Phone: ${data.phone}

Please acknowledge this prefill and ask me only for the remaining fields needed (employment details, income, housing payment, card type preference, existing bank customer, balance transfer need, and requested credit limit).`

    const userMsg    = { role: 'user', content: prefillMsg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setThinking(true)
    setError(null)
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const response    = await sendChatMessage(apiMessages)
      const assistantText = response.content?.[0]?.text ?? ''
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
    } catch (err) {
      setError(err.response?.data?.error?.message ?? err.message ?? 'Failed to contact AI assistant.')
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  const showSuggestions = messages.length === 1 && !thinking

  return (
    <div className="flex flex-col px-6 py-5" style={{ height: 'calc(100vh - 130px)', minHeight: 560 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-creditcard-purple flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Credit Card Assistant</h1>
            <p className="text-xs text-gray-400">Citizens Bank · Guided Application</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-creditcard-purple animate-pulse" />
            Powered by Claude AI
          </div>
          <button onClick={handleReset}
            className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            Start Over
          </button>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Chat window */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* PROVE prefill bar — shown until verified or first user message */}
          {!result && (
            <ProveBar
              onPrefilled={handleProvePrefill}
              disabled={thinking || submitting}
            />
          )}

          {/* Messages — hide the PROVE prefill context message from display */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages
              .filter(m => !m.content.startsWith('[PROVE_PREFILL]'))
              .map((m, i) => (
                <Bubble key={i} role={m.role} content={m.content} />
              ))}
            {thinking && <Bubble role="assistant" content="" isThinking />}
            {submitting && (
              <div className="flex items-center justify-center gap-3 py-4 text-sm text-creditcard-purple font-medium">
                <div className="w-5 h-5 border-2 border-creditcard-purple border-t-transparent rounded-full animate-spin" />
                Running your application through the pipeline…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested openers */}
          {showSuggestions && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-creditcard-purple/30 text-creditcard-purple hover:bg-creditcard-purple/5 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Error bar */}
          {error && (
            <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            {result ? (
              <p className="text-center text-sm text-gray-400 py-1">
                Application submitted.{' '}
                <button onClick={handleReset} className="text-creditcard-purple font-semibold hover:underline">
                  Start a new application
                </button>
              </p>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your response…"
                  disabled={thinking || submitting}
                  autoFocus
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-creditcard-purple/40 focus:border-creditcard-purple disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                />
                <button type="submit" disabled={!input.trim() || thinking || submitting}
                  className="bg-creditcard-purple text-white rounded-xl px-4 py-2.5 hover:bg-purple-700 disabled:opacity-40 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <SummaryPanel fields={fields} submitting={submitting} result={result} />
        </div>
      </div>
    </div>
  )
}
