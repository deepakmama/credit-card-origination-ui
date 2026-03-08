const fmt = (n) => n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—'

function MastercardLogo({ size = 40 }) {
  return (
    <svg width={size} height={size * 0.625} viewBox="0 0 40 25" fill="none">
      <circle cx="14.5" cy="12.5" r="12" fill="#EB001B" />
      <circle cx="25.5" cy="12.5" r="12" fill="#F79E1B" opacity="0.9" />
      <ellipse cx="20" cy="12.5" rx="5" ry="12" fill="#FF5F00" />
    </svg>
  )
}

function Chip() {
  return (
    <div className="w-9 h-6 rounded relative overflow-hidden flex-shrink-0"
         style={{ background: 'linear-gradient(135deg, #C9A84C, #F0D060, #C9A84C)' }}>
      <div className="absolute inset-0.5 rounded border border-yellow-700/30" />
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-yellow-700/20" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-yellow-700/20" />
    </div>
  )
}

const CARD_STYLES = {
  CASH_BACK: {
    cardName: 'Summit Reserve',
    tier: 'World Elite',
    background: 'linear-gradient(135deg, #0D0D0D 0%, #1C1C1C 40%, #2A2A2A 70%, #111111 100%)',
    sheen: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)',
    accentLine: 'linear-gradient(90deg, transparent, #C9A84C, #E8C96B, #C9A84C, transparent)',
    textColor: 'text-white',
    subtleText: 'text-white/50',
    accentColor: '#C9A84C',
    hasMountains: false,
  },
  BALANCE_TRANSFER: {
    cardName: 'Summit',
    tier: 'World Mastercard',
    background: 'linear-gradient(135deg, #005C3B 0%, #007A50 45%, #00A86B 100%)',
    sheen: 'linear-gradient(180deg, rgba(0,100,70,0) 40%, rgba(0,40,25,0.35) 100%)',
    accentLine: null,
    textColor: 'text-white',
    subtleText: 'text-white/55',
    accentColor: null,
    hasMountains: true,
  },
  NEW_TO_CREDIT: {
    cardName: 'Amp',
    tier: 'Mastercard®',
    background: 'linear-gradient(135deg, #00B86B 0%, #00D97E 50%, #00C070 100%)',
    sheen: null,
    accentLine: null,
    textColor: 'text-white',
    subtleText: 'text-white/60',
    accentColor: null,
    hasWave: true,
  },
}

export default function IssuedCardPanel({ app }) {
  if (!app?.maskedCardNumber) return null

  const style = CARD_STYLES[app.cardRequest?.cardType] || CARD_STYLES.CASH_BACK

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-citizens-charcoal mb-4 text-sm uppercase tracking-wide">Issued Card</h3>

      {/* Card Visual */}
      <div
        className="rounded-2xl relative overflow-hidden"
        style={{ background: style.background, minHeight: 190 }}
      >
        {/* Sheen overlay */}
        {style.sheen && (
          <div className="absolute inset-0" style={{ background: style.sheen }} />
        )}

        {/* Gold accent top line (Summit Reserve) */}
        {style.accentLine && (
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: style.accentLine }} />
        )}

        {/* Mountain layers (Summit) */}
        {style.hasMountains && (
          <>
            <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 w-full h-14">
              <path d="M0 80 L40 35 L65 52 L100 15 L130 42 L165 8 L200 45 L230 25 L260 50 L300 18 L300 80 Z" fill="white" fillOpacity="0.10" />
            </svg>
            <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 w-full h-8">
              <path d="M0 60 L60 30 L90 45 L130 18 L170 40 L210 20 L250 38 L300 12 L300 60 Z" fill="white" fillOpacity="0.07" />
            </svg>
          </>
        )}

        {/* Wave decoration (AMP) */}
        {style.hasWave && (
          <svg viewBox="0 0 300 190" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <path d="M-20 140 Q80 60 180 120 Q250 160 320 80" stroke="white" strokeWidth="22" fill="none" opacity="0.07" />
            <path d="M-20 165 Q100 80 200 140 Q265 175 330 100" stroke="white" strokeWidth="16" fill="none" opacity="0.05" />
            <text x="170" y="170" fontSize="72" fontWeight="900" fill="white" fillOpacity="0.07" fontFamily="sans-serif">AMP</text>
          </svg>
        )}

        {/* Card content */}
        <div className="relative p-5 flex flex-col h-full" style={{ minHeight: 190 }}>
          {/* Top row */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div
                className="text-xs font-bold tracking-[0.15em] uppercase"
                style={{ color: style.accentColor || 'rgba(255,255,255,0.95)' }}
              >
                {style.cardName}
              </div>
              <div className={`text-xs mt-0.5 ${style.subtleText}`}>{style.tier}</div>
            </div>
            <MastercardLogo size={40} />
          </div>

          {/* Chip */}
          <div className="mb-4">
            <Chip />
          </div>

          {/* Card number */}
          <div className={`font-mono text-base tracking-widest mb-4 ${style.textColor}`} style={{ letterSpacing: '0.18em' }}>
            {app.maskedCardNumber}
          </div>

          {/* Bottom row */}
          <div className="flex justify-between items-end mt-auto">
            <div>
              <div className={`text-xs mb-0.5 ${style.subtleText} uppercase tracking-wide`}>Credit Limit</div>
              <div className={`font-bold text-sm ${style.textColor}`}>{fmt(app.creditLimit)}</div>
            </div>
            <div className="text-center">
              <div className={`text-xs mb-0.5 ${style.subtleText} uppercase tracking-wide`}>APR</div>
              <div className={`font-bold text-sm ${style.textColor}`}>{app.finalApr != null ? `${app.finalApr}%` : '—'}</div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-bold ${style.subtleText} uppercase tracking-widest`}>Citizens</div>
              <div className={`text-xs ${style.subtleText}`}>BANK</div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-citizens-green-light rounded-lg p-3">
          <div className="text-xs text-citizens-gray mb-1">Activation Status</div>
          <span className={`font-semibold text-sm ${app.activationStatus === 'ACTIVE' ? 'text-citizens-green' : 'text-amber-600'}`}>
            {app.activationStatus === 'ACTIVE' ? '● Active' : '● Pending Activation'}
          </span>
        </div>
        <div className="bg-citizens-green-light rounded-lg p-3">
          <div className="text-xs text-citizens-gray mb-1">Network</div>
          <div className="font-semibold text-sm text-citizens-charcoal flex items-center gap-1.5">
            <MastercardLogo size={24} />
            Mastercard
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-citizens-green-pale border border-citizens-green/20 rounded-lg flex gap-2.5">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#008555" strokeWidth={2} className="flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-citizens-green-dark leading-relaxed">
          Your card is on its way. You'll receive your physical card within 5–7 business days. Activate it upon arrival.
        </p>
      </div>
    </div>
  )
}
