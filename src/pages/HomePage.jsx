import { Link } from 'react-router-dom'

const features = [
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#008555" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Instant Decision',
    desc: 'Get a credit card decision in under 60 seconds with our fully automated pipeline.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#008555" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Bank-Grade Security',
    desc: 'KYC identity verification, fraud screening, and income validation at every step.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#008555" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: '3 Card Products',
    desc: 'Cash Back, Balance Transfer, and New to Credit — a card for every financial need.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#008555" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Transparent Pipeline',
    desc: 'Real-time visibility into every step — see exactly where your application stands.',
  },
]

// Mastercard overlapping circles for homepage card comparison
function MCLogo({ size = 32 }) {
  return (
    <svg width={size} height={size * 0.625} viewBox="0 0 32 20" fill="none">
      <circle cx="11.5" cy="10" r="9.5" fill="#EB001B" />
      <circle cx="20.5" cy="10" r="9.5" fill="#F79E1B" opacity="0.9" />
      <ellipse cx="16" cy="10" rx="3.8" ry="9.5" fill="#FF5F00" />
    </svg>
  )
}

const cards = [
  {
    name: 'Summit Reserve',
    subtitle: 'Premium cash back rewards',
    cardBg: 'linear-gradient(135deg, #0D0D0D 0%, #1C1C1C 40%, #2A2A2A 70%, #111111 100%)',
    accentColor: '#C9A84C',
    rate: 'Up to 3% cash back',
    apr: '18.99% – 23.99% APR',
    limit: '$1,000 – $10,000',
    minScore: '680+',
    network: 'MASTERCARD',
    href: '/apply',
  },
  {
    name: 'Summit',
    subtitle: 'Pay down debt faster',
    cardBg: 'linear-gradient(135deg, #005C3B 0%, #007A50 45%, #00A86B 100%)',
    accentColor: null,
    rate: '0% intro APR for 15 months',
    apr: '19.99% – 24.99% after',
    limit: '$2,000 – $15,000',
    minScore: '720+',
    network: 'MASTERCARD',
    href: '/apply',
    featured: true,
  },
  {
    name: 'Amp',
    subtitle: 'Build your credit history',
    cardBg: 'linear-gradient(135deg, #00B86B 0%, #00D97E 50%, #00C070 100%)',
    accentColor: null,
    rate: 'No minimum credit score',
    apr: '25.99% – 28.99% APR',
    limit: '$300 – $1,000',
    minScore: 'None',
    network: 'MASTERCARD',
    href: '/apply',
  },
]

export default function HomePage() {
  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="bg-citizens-green-pale border-b border-citizens-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-citizens-green-light text-citizens-green-dark text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-citizens-green inline-block" />
                Powered by Citizens LOS Platform
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-citizens-charcoal leading-tight mb-5">
                The right credit card<br />
                <span className="text-citizens-green">for your life.</span>
              </h1>
              <p className="text-lg text-citizens-gray mb-8 leading-relaxed">
                Apply in minutes. Get an automated decision in seconds. We offer Cash Back, Balance Transfer, and New to Credit cards — all with transparent, fair decisions.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/apply" className="btn-primary text-base px-7 py-3 shadow-green">
                  Apply Now
                </Link>
                <Link to="/prequalify" className="btn-secondary text-base px-7 py-3">
                  Check If You Qualify
                </Link>
              </div>
              <p className="text-xs text-citizens-gray mt-4">No impact to your credit score to check your rate.</p>
            </div>

            {/* Hero visual — card stack */}
            <div className="relative hidden md:flex justify-center items-center h-64">
              {/* AMP card (back) */}
              <div className="absolute left-8 top-4 w-64 h-40 rounded-2xl shadow-xl rotate-[-6deg] opacity-60 overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #00B86B 0%, #00D97E 50%, #00C070 100%)' }}>
                <div className="absolute right-3 bottom-2 text-white/10 font-black text-4xl">AMP</div>
              </div>
              {/* Summit card (middle) */}
              <div className="absolute left-16 top-0 w-64 h-40 rounded-2xl shadow-xl rotate-[-2deg] opacity-80 overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #005C3B 0%, #007A50 45%, #00A86B 100%)' }}>
                <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 w-full h-10">
                  <path d="M0 80 L40 35 L65 52 L100 15 L130 42 L165 8 L200 45 L230 25 L260 50 L300 18 L300 80 Z" fill="white" fillOpacity="0.12" />
                </svg>
                <div className="relative p-4 text-white text-xs font-bold tracking-widest opacity-80">Summit</div>
              </div>
              {/* Summit Reserve card (front) */}
              <div className="relative w-64 h-40 rounded-2xl shadow-2xl overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #0D0D0D 0%, #1C1C1C 40%, #2A2A2A 70%, #111111 100%)' }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, #E8C96B, #C9A84C, transparent)' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
                <div className="relative p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-auto">
                    <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#C9A84C' }}>Summit Reserve</div>
                    <svg width="28" height="18" viewBox="0 0 32 20" fill="none">
                      <circle cx="11.5" cy="10" r="9.5" fill="#EB001B" />
                      <circle cx="20.5" cy="10" r="9.5" fill="#F79E1B" opacity="0.9" />
                      <ellipse cx="16" cy="10" rx="3.8" ry="9.5" fill="#FF5F00" />
                    </svg>
                  </div>
                  <div className="w-7 h-5 rounded mb-2" style={{ background: 'linear-gradient(135deg, #C9A84C, #F0D060, #C9A84C)' }} />
                  <div className="font-mono text-xs tracking-widest text-white/60">XXXX XXXX XXXX 1234</div>
                  <div className="flex justify-between mt-1">
                    <div className="text-xs text-white/50">Citizens Bank</div>
                    <div className="text-xs" style={{ color: '#C9A84C' }}>Up to 3% cash back</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-citizens-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: '<60s', label: 'Decision Time' },
              { value: '5-Step', label: 'Automated Pipeline' },
              { value: '3 Cards', label: 'Products Available' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/75 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-citizens-charcoal mb-3">Compare Our Cards</h2>
            <p className="text-citizens-gray max-w-xl mx-auto">Find the card that fits your lifestyle and financial goals.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {cards.map(card => (
              <div
                key={card.name}
                className={`rounded-xl border-2 overflow-hidden transition-shadow duration-200 hover:shadow-card-hover ${
                  card.featured ? 'border-citizens-green shadow-green' : 'border-citizens-border'
                }`}
              >
                {card.featured && (
                  <div className="bg-citizens-green text-white text-xs font-bold text-center py-1.5 tracking-wide uppercase">
                    Most Popular
                  </div>
                )}
                {/* Card Art */}
                <div
                  className="h-32 relative overflow-hidden p-4 flex flex-col justify-between"
                  style={{ background: card.cardBg }}
                >
                  {/* Summit mountain layers */}
                  {card.name === 'Summit' && (
                    <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 w-full h-10">
                      <path d="M0 80 L40 35 L65 52 L100 15 L130 42 L165 8 L200 45 L230 25 L260 50 L300 18 L300 80 Z" fill="white" fillOpacity="0.10" />
                    </svg>
                  )}
                  {/* AMP wave */}
                  {card.name === 'Amp' && (
                    <svg viewBox="0 0 300 128" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                      <path d="M-20 90 Q80 30 180 75 Q250 105 320 45" stroke="white" strokeWidth="18" fill="none" opacity="0.08" />
                    </svg>
                  )}
                  {/* Summit Reserve gold accent line */}
                  {card.name === 'Summit Reserve' && (
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, #E8C96B, #C9A84C, transparent)' }} />
                  )}
                  <div className="flex justify-between items-start relative">
                    <div>
                      <div className="font-bold text-sm text-white" style={card.accentColor ? { color: card.accentColor } : {}}>
                        {card.name}
                      </div>
                      <div className="text-white/60 text-xs mt-0.5">{card.subtitle}</div>
                    </div>
                    <MCLogo size={28} />
                  </div>
                  <div className="relative text-xs font-semibold text-white/80">{card.rate}</div>
                </div>
                {/* Details */}
                <div className="p-5 bg-white">
                  <div className="space-y-2.5 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-citizens-gray">APR</span>
                      <span className="font-semibold text-citizens-charcoal">{card.apr}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-citizens-gray">Credit Limit</span>
                      <span className="font-semibold text-citizens-charcoal">{card.limit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-citizens-gray">Min. Score</span>
                      <span className="font-semibold text-citizens-charcoal">{card.minScore}</span>
                    </div>
                  </div>
                  <Link
                    to={card.href}
                    className={`block text-center py-2.5 rounded font-semibold text-sm transition-colors ${
                      card.featured
                        ? 'bg-citizens-green hover:bg-citizens-green-dark text-white'
                        : 'border border-citizens-green text-citizens-green hover:bg-citizens-green-light'
                    }`}
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-citizens-green-pale border-t border-b border-citizens-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-citizens-charcoal mb-3">How It Works</h2>
            <p className="text-citizens-gray">Our automated pipeline reviews your application in real time.</p>
          </div>
          <div className="flex flex-wrap justify-center items-start gap-0">
            {['Submit', 'KYC', 'Fraud Check', 'Credit Review', 'Income Verify', 'Card Issued'].map((step, i, arr) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center px-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    i === arr.length - 1
                      ? 'bg-citizens-green border-citizens-green text-white'
                      : 'bg-white border-citizens-green text-citizens-green'
                  }`}>
                    {i === arr.length - 1 ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-medium text-citizens-gray-dark mt-2 text-center w-16">{step}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-6 h-0.5 bg-citizens-green opacity-40 mb-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-citizens-charcoal mb-3">Why Citizens Bank?</h2>
            <p className="text-citizens-gray max-w-xl mx-auto">Built on trust, transparency, and technology.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="card-hover p-6">
                <div className="w-12 h-12 bg-citizens-green-light rounded-lg flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-citizens-charcoal mb-2">{f.title}</h3>
                <p className="text-sm text-citizens-gray leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-citizens-charcoal">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to get started?</h2>
          <p className="text-gray-400 mb-8">Apply for your Citizens credit card today. It takes just a few minutes.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/apply" className="btn-primary text-base px-8 py-3 shadow-green">
              Start Your Application
            </Link>
            <Link to="/dashboard" className="border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-3 rounded transition-colors text-base">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-citizens-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-citizens-green font-bold text-lg">Citizens</div>
              <span className="text-citizens-gray text-xs">|</span>
              <span className="text-citizens-gray text-xs">Credit Card Loan Origination System</span>
            </div>
            <div className="flex gap-6 text-xs text-citizens-gray">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Equal Housing Lender</span>
              <span>© 2025 Citizens Bank</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
