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
        {navItems.map(({ path, label, Icon }) => {
          const isActive = pathname === path
          return (
            <Link
              key={path}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              className={`mobile-nav-item${isActive ? ' mobile-nav-item--active' : ''}`}
              style={{ color: isActive ? 'var(--brand)' : 'var(--text-tertiary)' }}
            >
              <Icon size={22} weight="regular" />
              <span className="mobile-nav-label">{label}</span>
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
