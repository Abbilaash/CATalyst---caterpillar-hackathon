// CAT Rental Operations — Design Tokens
// Industrial dark theme inspired by Caterpillar, IBM Maximo, Microsoft enterprise apps.

export const PALETTE = {
  // Brand
  catYellow: '#FFCD11',
  catYellowDeep: '#E6B800',
  catYellowSoft: 'rgba(255, 205, 17, 0.14)',
  catYellowBorder: 'rgba(255, 205, 17, 0.35)',

  // Surfaces
  bg: '#111315',
  surface: '#1B1D20',
  surfaceRaised: '#23262B',
  surfaceOverlay: '#2A2E33',
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',

  // Text
  textPrimary: '#F5F7FA',
  textSecondary: '#A8AFB8',
  textTertiary: '#6B7280',
  textInverse: '#111315',

  // Status
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.16)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.16)',
  info: '#3B82F6',
  infoSoft: 'rgba(59, 130, 246, 0.16)',

  // Priority
  priorityHigh: '#EF4444',
  priorityHighSoft: 'rgba(239, 68, 68, 0.16)',
  priorityMedium: '#F59E0B',
  priorityMediumSoft: 'rgba(245, 158, 11, 0.16)',
  priorityLow: '#22C55E',
  priorityLowSoft: 'rgba(34, 197, 94, 0.16)',
} as const;

export const FONT = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.36,
    shadowRadius: 18,
    elevation: 6,
  },
  glow: {
    shadowColor: PALETTE.catYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 3,
  },
} as const;

export const TYPO = {
  hero: { fontFamily: FONT.bold, fontSize: 32, lineHeight: 38, color: PALETTE.textPrimary },
  h1: { fontFamily: FONT.bold, fontSize: 26, lineHeight: 32, color: PALETTE.textPrimary },
  h2: { fontFamily: FONT.bold, fontSize: 21, lineHeight: 27, color: PALETTE.textPrimary },
  h3: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 24, color: PALETTE.textPrimary },
  h4: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 22, color: PALETTE.textPrimary },
  body: { fontFamily: FONT.regular, fontSize: 15, lineHeight: 22, color: PALETTE.textPrimary },
  bodySmall: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 19, color: PALETTE.textSecondary },
  caption: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, color: PALETTE.textTertiary },
  label: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 18, color: PALETTE.textSecondary },
} as const;
