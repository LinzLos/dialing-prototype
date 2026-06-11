import './NavRail.css'

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function IconKey() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2L11 12" />
      <path d="M17.5 5.5L19 4" />
      <path d="M15 8L16.5 6.5" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function IconBrowser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="16" rx="2" />
      <path d="M2 8h20" />
      <circle cx="5.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="5.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconHierarchy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="8" height="6" rx="1.5" />
      <rect x="14" y="3" width="8" height="6" rx="1.5" />
      <rect x="14" y="15" width="8" height="6" rx="1.5" />
      <path d="M10 10h2a2 2 0 0 1 2-2V6" />
      <path d="M10 10h2a2 2 0 0 1 2 2v1.5" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.93 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.84 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconPeople() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// ─── Nav Rail ─────────────────────────────────────────────────────────────────

const INACTIVE_ITEMS = [
  { id: 'browser',   label: 'Monitor',   Icon: IconBrowser   },
  { id: 'hierarchy', label: 'Groups',    Icon: IconHierarchy },
  { id: 'phone',     label: 'Calls',     Icon: IconPhone     },
  { id: 'people',    label: 'Team',      Icon: IconPeople    },
]

export function NavRail() {
  return (
    <nav className="nav-rail" aria-label="Navigation">
      <div className="nav-pill">

        {/* Active item */}
        <div className="nav-item-active" aria-current="page" title="Dialing Controls">
          <IconKey />
        </div>

        {/* Separator */}
        <div className="nav-separator" />

        {/* Inline icon (no circle) */}
        <div className="nav-item-inline" title="Routing">
          <IconArrowRight />
        </div>

        {/* Inactive items with circle backgrounds */}
        {INACTIVE_ITEMS.map(({ id, label, Icon }) => (
          <div key={id} className="nav-item-inactive" title={label}>
            <Icon />
          </div>
        ))}

        {/* Spacer pushes avatar to bottom */}
        <div className="nav-spacer" />

        {/* Avatar */}
        <div className="nav-avatar" title="Profile">
          <IconUser />
        </div>

      </div>
    </nav>
  )
}
