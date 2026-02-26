export const colors = {
  dark: {
    background: '#0B0F17',
    surface: '#121A27',
    surfaceHighlight: '#1F2937',
    primary: '#3B82F6',
    primaryGradientStart: '#3B82F6',
    primaryGradientEnd: '#2563EB',
    accent: '#F59E0B',
    success: '#10B981',
    danger: '#EF4444',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#1F2937',
    inputBackground: '#1F2937',
    muted: '#94A3B8'
  },
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceHighlight: '#F1F5F9',
    primary: '#6366F1',
    primaryGradientStart: '#818CF8',
    primaryGradientEnd: '#4F46E5',
    accent: '#F59E0B',
    accentGradientStart: '#FBBF24',
    accentGradientEnd: '#F59E0B',
    success: '#10B981',
    successLight: '#D1FAE5',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    inputBackground: '#F8FAFC',
    muted: '#94A3B8',
    xpGold: '#F59E0B',
    streakFire: '#F97316',
    levelPurple: '#8B5CF6'
  }
}

export const spacing = { s4: 4, s8: 8, s12: 12, s16: 16, s24: 24, s32: 32, s48: 48, s64: 64 }
export const radii = { small: 10, card: 20, button: 14, large: 28, full: 9999 }
export const typography = { 
  display: 34, 
  header: 26, 
  title: 20, 
  body: 16, 
  caption: 14, 
  small: 12,
  lineHeight: 1.5 
}

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
  glow: (color: string) => ({ shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 })
}

export const animation = {
  duration: { fast: 150, normal: 250, slow: 400 },
  spring: { damping: 15, stiffness: 150 }
}

export const tokens = { colors, spacing, radii, typography, shadows, animation }

