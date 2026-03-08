// Mastercard overlapping circles logo
function MastercardLogo({ size = 36 }) {
  return (
    <svg width={size} height={size * 0.625} viewBox="0 0 36 22.5" fill="none">
      <circle cx="13" cy="11.25" r="11" fill="#EB001B" />
      <circle cx="23" cy="11.25" r="11" fill="#F79E1B" opacity="0.9" />
      <ellipse cx="18" cy="11.25" rx="4.2" ry="11" fill="#FF5F00" />
    </svg>
  )
}

// Mountain silhouette path used on Summit cards
function MountainSilhouette({ color = 'white', opacity = 0.15 }) {
  return (
    <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 w-full h-12">
      <path
        d="M0 80 L40 35 L65 52 L100 15 L130 42 L165 8 L200 45 L230 25 L260 50 L300 18 L300 80 Z"
        fill={color}
        fillOpacity={opacity}
      />
    </svg>
  )
}

// ── Summit Reserve Card (Cash Back) ─────────────────────────────────────────
// Premium black metal card, Citizens' top-tier product
function SummitReserveArt({ selected }) {
  return (
    <div
      className={`relative rounded-xl h-32 overflow-hidden transition-all duration-150 ${selected ? 'opacity-100' : 'opacity-80'}`}
      style={{ background: 'linear-gradient(135deg, #0D0D0D 0%, #1C1C1C 40%, #2A2A2A 70%, #111111 100%)' }}
    >
      {/* Subtle metallic sheen */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)' }} />
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, #E8C96B, #C9A84C, transparent)' }} />
      {/* Card content */}
      <div className="relative p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-auto">
          <div>
            <div className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: '#C9A84C' }}>Summit Reserve</div>
            <div className="text-white/50 text-xs mt-0.5">World Elite</div>
          </div>
          <MastercardLogo size={30} />
        </div>
        <div className="flex justify-between items-end">
          <div className="font-mono text-xs tracking-widest text-white/60">•••• •••• •••• ••••</div>
          <div className="text-white/40 text-xs font-semibold">CITIZENS</div>
        </div>
      </div>
      {/* Chip */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-5 rounded" style={{ background: 'linear-gradient(135deg, #B8960C, #F0D060, #B8960C)', opacity: 0.85 }}>
        <div className="absolute inset-0.5 rounded border border-yellow-800/30 opacity-60" />
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#008555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}

// ── Summit Card (Balance Transfer) ──────────────────────────────────────────
// Mid-tier, Citizens green with mountain landscape
function SummitArt({ selected }) {
  return (
    <div
      className={`relative rounded-xl h-32 overflow-hidden transition-all duration-150 ${selected ? 'opacity-100' : 'opacity-80'}`}
      style={{ background: 'linear-gradient(135deg, #005C3B 0%, #007A50 45%, #00A86B 100%)' }}
    >
      {/* Sky gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,100,70,0) 40%, rgba(0,40,25,0.4) 100%)' }} />
      {/* Mountain silhouette */}
      <MountainSilhouette color="white" opacity={0.12} />
      {/* Second, closer mountain layer */}
      <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 w-full h-8">
        <path d="M0 60 L60 30 L90 45 L130 18 L170 40 L210 20 L250 38 L300 12 L300 60 Z" fill="white" fillOpacity="0.08" />
      </svg>
      {/* Card content */}
      <div className="relative p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-auto">
          <div>
            <div className="text-xs font-bold tracking-[0.15em] uppercase text-white">Summit</div>
            <div className="text-white/60 text-xs mt-0.5">World Mastercard</div>
          </div>
          <MastercardLogo size={30} />
        </div>
        <div className="flex justify-between items-end">
          <div className="font-mono text-xs tracking-widest text-white/60">•••• •••• •••• ••••</div>
          <div className="text-white/50 text-xs font-semibold">CITIZENS</div>
        </div>
      </div>
      {/* Chip */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-5 rounded bg-yellow-200/80">
        <div className="absolute inset-0.5 rounded border border-yellow-600/30 opacity-60" />
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#008555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}

// ── AMP Card (New to Credit) ─────────────────────────────────────────────────
// Credit-builder card, vibrant/energetic lime-green gradient
function AmpArt({ selected }) {
  return (
    <div
      className={`relative rounded-xl h-32 overflow-hidden transition-all duration-150 ${selected ? 'opacity-100' : 'opacity-80'}`}
      style={{ background: 'linear-gradient(135deg, #00B86B 0%, #00D97E 50%, #00C070 100%)' }}
    >
      {/* Energetic wave / arc decoration */}
      <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <path d="M -20 100 Q 80 20 180 80 Q 250 120 320 40" stroke="white" strokeWidth="20" fill="none" opacity="0.08" />
        <path d="M -20 120 Q 100 40 200 100 Q 260 130 320 60" stroke="white" strokeWidth="14" fill="none" opacity="0.06" />
      </svg>
      {/* Large AMP text watermark */}
      <div className="absolute right-3 bottom-2 text-white/10 font-black text-5xl tracking-tight select-none pointer-events-none">AMP</div>
      {/* Card content */}
      <div className="relative p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-auto">
          <div>
            <div className="text-xs font-black tracking-[0.12em] uppercase text-white">Amp</div>
            <div className="text-white/70 text-xs mt-0.5">Mastercard®</div>
          </div>
          <MastercardLogo size={30} />
        </div>
        <div className="flex justify-between items-end">
          <div className="font-mono text-xs tracking-widest text-white/60">•••• •••• •••• ••••</div>
          <div className="text-white/50 text-xs font-semibold">CITIZENS</div>
        </div>
      </div>
      {/* Chip */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-5 rounded bg-yellow-200/80">
        <div className="absolute inset-0.5 rounded border border-yellow-600/30 opacity-60" />
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#008555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}

const CARD_ART = {
  CASH_BACK:        SummitReserveArt,
  BALANCE_TRANSFER: SummitArt,
  NEW_TO_CREDIT:    AmpArt,
}

const CARD_TYPES = [
  {
    key: 'CASH_BACK',
    name: 'Summit Reserve',
    tagline: 'Premium cash back on everything',
    minScore: 680,
    limitRange: '$1,000 – $10,000',
    aprRange: '18.99% – 23.99%',
    highlight: 'Up to 3% cash back',
    network: 'MASTERCARD',
  },
  {
    key: 'BALANCE_TRANSFER',
    name: 'Summit',
    tagline: 'Pay down debt with 0% intro APR',
    minScore: 720,
    limitRange: '$2,000 – $15,000',
    aprRange: '0% intro / 19.99–24.99%',
    highlight: '0% intro APR for 15 months',
    network: 'MASTERCARD',
  },
  {
    key: 'NEW_TO_CREDIT',
    name: 'Amp',
    tagline: 'Build your credit history today',
    minScore: null,
    limitRange: '$300 – $1,000',
    aprRange: '25.99% – 28.99%',
    highlight: 'No minimum credit score',
    network: 'MASTERCARD',
  },
]

export default function CardTypeSelector({ value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="section-label">Select Card Type</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CARD_TYPES.map(card => {
          const Art = CARD_ART[card.key]
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onChange(card.key)}
              className={`text-left rounded-xl border-2 overflow-hidden transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-citizens-green focus:ring-offset-2 ${
                value === card.key
                  ? 'border-citizens-green shadow-green'
                  : 'border-citizens-border hover:border-citizens-green/50'
              }`}
            >
              <Art selected={value === card.key} />
              <div className="p-3 bg-white">
                <div className="font-bold text-citizens-charcoal text-sm mb-0.5">{card.name}</div>
                <div className="text-xs text-citizens-gray mb-2">{card.tagline}</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-citizens-gray">Limit</span>
                    <span className="font-medium text-citizens-charcoal">{card.limitRange}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-citizens-gray">APR</span>
                    <span className="font-medium text-citizens-charcoal">{card.aprRange}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-citizens-gray">Min. Score</span>
                    <span className={`font-medium ${card.minScore ? 'text-citizens-charcoal' : 'text-citizens-green'}`}>
                      {card.minScore ?? 'None required'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
