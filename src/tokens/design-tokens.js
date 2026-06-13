/**
 * Shift Design Tokens
 * Extracted from prototype/src/index.css and component files.
 * These are the semantic tokens as implemented in the prototype.
 */

export const tokens = {

  // ─── Colors ──────────────────────────────────────────────────────────────────

  colors: {
    // Surfaces
    surface:       '#FFFFFF',
    surfaceSubtle: '#F7F4F2',
    surfacePage:   '#F7F4F2',
    surfaceMuted:  '#F1EDEB',

    // Borders
    border:        '#D6CFCB',
    borderLight:   '#E5DFDC',
    borderDashed:  '#A89E99',

    // Text
    textPrimary:   '#1E1918',
    textSecondary: '#5C504F',
    textTertiary:  '#6E625F',
    textInverse:   '#FFFFFF',

    // Brand (green)
    brand:         '#629460',
    brandLight:    '#F2F6F2',
    brandMid:      '#C8D9C7',
    brandDark:     '#3F603E',

    // Status — Danger (orange-red)
    danger:        '#CE430A',
    dangerLight:   '#FBEFEB',
    dangerMid:     '#EBB39D',

    // Status — Warning (disciplined amber)
    warning:       '#9A6B33',
    warningLight:  '#F4EFEA',
    warningMid:    '#DCC9B5',

    // Status — Info (dark blue)
    info:          '#243B83',
    infoLight:     '#EEF1FB',
    infoMid:       '#BCC9EA',

    // Accent (cobalt)
    accent:        '#2F4BA6',
    accentLight:   '#EEF1FB',

    // Data / charts
    dataInflow:    '#CE430A',  // volume coming in — reads as pressure
    dataOutflow:   '#629460',  // volume going out — reads as relief
    dataTarget:    '#A89E99',  // baseline / target reference line
    chartBlue:     '#243B83',
    chartAzure:    '#0EA5E9',
  },

  // ─── Typography ──────────────────────────────────────────────────────────────

  typography: {
    fontFamily: {
      heading: "'Bricolage Grotesque', sans-serif",
      body:    "'DM Sans', sans-serif",
    },
    // px values
    fontSize: {
      '2xs': 9,
      xs:    10,
      sm:    11,
      md:    12,
      base:  13,
      lg:    16,
      xl:    19,
      '2xl': 23,
      '3xl': 28,
    },
    fontWeight: {
      light:    300,
      regular:  400,
      medium:   500,
      semibold: 600,
      bold:     700,
    },
    lineHeight: {
      tight:   1,
      snug:    1.1,
      compact: 1.3,
      normal:  1.5,
    },
    letterSpacing: {
      tight:  '-0.02em',
      snug:   '-0.01em',
      slight: '-0.005em',
      caps:   '0.07em',
    },
  },

  // ─── Spacing ─────────────────────────────────────────────────────────────────
  // px values

  spacing: {
    0:  0,
    2:  2,
    4:  4,
    5:  4,
    6:  6,
    7:  8,
    8:  8,
    10: 10,
    12: 12,
    14: 14,
    16: 16,
    18: 18,
    20: 20,
    24: 24,
  },

  // ─── Border Radius ───────────────────────────────────────────────────────────

  borderRadius: {
    xs:   '4px',
    sm:   '6px',
    md:   '8px',
    base: '8px',
    full: '9999px',
  },

  // ─── Shadows ─────────────────────────────────────────────────────────────────

  shadows: {
    card:      '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    navActive: '0 1px 3px rgba(0,0,0,0.08)',
    toggle:    '0 1px 3px rgba(0,0,0,0.10)',
    cardHover: '0 6px 24px rgba(0,0,0,0.07)',
    modal:     '0 4px 16px rgba(0,0,0,0.10)',
    dropdown:  '0 8px 24px rgba(0,0,0,0.10)',
    overlay:   '0 4px 20px rgba(0,0,0,0.18)',
  },

  // ─── Sizes ───────────────────────────────────────────────────────────────────

  sizes: {
    iconSm:        13,
    iconBase:      18,
    avatarSm:      30,
    avatarLg:      34,
    logoMark:      32,
    navItem:       40,
    statusDotSm:   6,
    statusDotBase: 7,
    statusDotLg:   8,
    barHeight:     5,
    barHeightLg:   6,
  },

  // ─── Layout ──────────────────────────────────────────────────────────────────

  layout: {
    sidebarWidth: 56,
    topbarHeight: 56,
  },

  // ─── Animation ───────────────────────────────────────────────────────────────

  animation: {
    easing: {
      spring:   'cubic-bezier(0.16, 1, 0.3, 1)',
      easeOut:  'ease-out',
      standard: 'ease',
    },
    duration: {
      fast:     '0.18s',
      base:     '0.22s',
      moderate: '0.30s',
      slow:     '0.35s',
    },
  },

  // ─── Opacity Scale ───────────────────────────────────────────────────────────

  opacity: {
    subtle: 0.01,
    light:  0.04,
    medium: 0.06,
    strong: 0.08,
    fill:   0.12,
  },
}

export default tokens
