/**
 * Sidenav — reusable floating sidebar component
 *
 * Peer deps: react, react-router-dom
 * CSS deps:  tokens/globals.css (for --* vars, .nav-tooltip, .nav-item-wrap)
 *
 * Usage:
 *   const myNavItems = [
 *     { path: '/', label: 'Home', viewBox: '0 0 20 20', d: 'M...' },
 *   ]
 *   <Sidenav navItems={myNavItems} />
 */

import { Link, useLocation } from 'react-router-dom'

export type NavItem = {
  path: string
  label: string
  viewBox: string
  d: string
}

type Props = {
  navItems: NavItem[]
  /** Override the brand logo SVG. Defaults to the Shift logomark. */
  logo?: React.ReactNode
}

// Default logomark — Key icon in design system red
function DefaultLogo() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 48 48">
      <path
        d="M41.9996 4L37.9996 8M37.9996 8L43.9996 14L36.9996 21L30.9996 15M37.9996 8L30.9996 15M22.7796 23.22C23.8123 24.2389 24.6332 25.4521 25.1951 26.7896C25.757 28.1271 26.0488 29.5625 26.0536 31.0133C26.0585 32.464 25.7763 33.9014 25.2234 35.2426C24.6705 36.5838 23.8577 37.8025 22.8319 38.8283C21.806 39.8541 20.5874 40.6669 19.2462 41.2198C17.9049 41.7728 16.4676 42.0549 15.0168 42.0501C13.5661 42.0452 12.1307 41.7534 10.7932 41.1915C9.45565 40.6296 8.24251 39.8087 7.22357 38.776C5.21983 36.7014 4.1111 33.9228 4.13616 31.0386C4.16122 28.1544 5.31808 25.3955 7.35757 23.356C9.39706 21.3165 12.156 20.1596 15.0402 20.1346C17.9243 20.1095 20.7029 21.2183 22.7776 23.222L22.7796 23.22ZM22.7796 23.22L30.9996 15"
        stroke="var(--danger)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  )
}

function Divider() {
  return (
    <div style={{ width: 64, height: 1, background: 'var(--border)', flexShrink: 0 }} />
  )
}

export default function Sidenav({ navItems, logo }: Props) {
  const { pathname } = useLocation()

  return (
    <div style={{
      background: 'var(--surface-subtle)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 64,
    }}>

      {/* Brand / logo */}
      <div style={{
        width: 64,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {logo ?? <DefaultLogo />}
      </div>

      <Divider />

      {/* Nav items */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '16px 8px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {navItems.map(({ path, label, viewBox, d }) => {
          const isActive = pathname === path
          return (
            <div
              key={path}
              className="nav-item-wrap"
              style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
            >
              <Link
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 'var(--size-nav-item)',
                  height: 'var(--size-nav-item)',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-nav)' : 'none',
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" fill="none" viewBox={viewBox}>
                  <path
                    d={d}
                    stroke={isActive ? 'var(--brand)' : 'var(--text-tertiary)'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </Link>
              <div className="nav-tooltip">{label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
