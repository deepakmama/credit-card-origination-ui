import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

function CitizensLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="4" fill="#008555"/>
      <rect x="5" y="9" width="22" height="14" rx="2.5" fill="white" fillOpacity="0.95"/>
      <rect x="5" y="13" width="22" height="3.5" fill="#008555" fillOpacity="0.15"/>
      <rect x="8" y="18" width="5" height="1.5" rx="0.75" fill="#008555" fillOpacity="0.5"/>
      <rect x="15" y="18" width="3" height="1.5" rx="0.75" fill="#008555" fillOpacity="0.35"/>
    </svg>
  )
}

export default function Header() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { to: '/apply',        label: 'Apply Now' },
    { to: '/applications', label: 'Applications' },
    { to: '/dashboard',    label: 'Dashboard' },
  ]

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <header className="bg-white border-b border-citizens-border sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="bg-citizens-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-8 gap-6">
            <span className="text-white/80 text-xs">Personal Banking</span>
            <span className="text-white text-xs font-semibold border-b border-white/60 pb-0.5">Credit Cards</span>
            <span className="text-white/80 text-xs">Business</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <CitizensLogo />
            <div>
              <div className="text-citizens-green font-bold text-xl leading-none tracking-tight">Citizens</div>
              <div className="text-citizens-gray text-[10px] tracking-widest uppercase font-medium">Credit Card LOS</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 text-sm font-semibold transition-colors rounded relative ${
                  isActive(link.to)
                    ? 'text-citizens-green'
                    : 'text-citizens-gray-dark hover:text-citizens-green'
                }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-citizens-green rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/applications" className="text-sm font-semibold text-citizens-gray-dark hover:text-citizens-green transition-colors">
              Sign In
            </Link>
            <Link to="/apply" className="btn-primary text-sm px-5 py-2">
              Apply Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded text-citizens-gray hover:text-citizens-green"
            onClick={() => setMobileOpen(o => !o)}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-citizens-border px-4 py-3 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded text-sm font-semibold ${
                isActive(link.to)
                  ? 'bg-citizens-green-light text-citizens-green'
                  : 'text-citizens-gray-dark hover:bg-citizens-green-light hover:text-citizens-green'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/apply" className="btn-primary w-full mt-2" onClick={() => setMobileOpen(false)}>
            Apply Now
          </Link>
        </div>
      )}
    </header>
  )
}
