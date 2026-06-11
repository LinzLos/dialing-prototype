/**
 * Shell — app layout wrapper
 *
 * Renders the floating Sidenav fixed to the top-left and a scrollable
 * main content area to its right. Applies the page-enter animation on
 * every route change via the `key` prop.
 *
 * On mobile (≤768px) the sidenav is hidden and replaced by a fixed
 * bottom navigation bar.
 *
 * CSS deps: tokens/globals.css, App.css (for shell-* and mobile-* classes)
 */

import { Link, useLocation } from 'react-router-dom'
import Sidenav, { type NavItem } from './Sidenav'

type Props = {
  navItems: NavItem[]
  children: React.ReactNode
  /** Override the brand logo rendered inside the Sidenav. */
  logo?: React.ReactNode
}

export default function Shell({ navItems, logo, children }: Props) {
  const { pathname } = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-page)' }}>

      {/* Floating sidebar — desktop only */}
      <div className="shell-sidenav">
        <Sidenav navItems={navItems} logo={logo} />
      </div>

      {/* Main content */}
      <main key={pathname} className="page-enter shell-main">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="mobile-bottom-nav">
        {navItems.map(({ path, label, viewBox, d }) => {
          const isActive = pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`mobile-nav-item${isActive ? ' mobile-nav-item--active' : ''}`}
            >
              <svg width="22" height="22" fill="none" viewBox={viewBox}>
                <path
                  d={d}
                  stroke={isActive ? 'var(--brand)' : 'var(--text-tertiary)'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span className="mobile-nav-label">{label}</span>
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
