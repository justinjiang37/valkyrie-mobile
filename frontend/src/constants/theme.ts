export const Colors = {
  // Base colors
  background: '#FFFFFF',
  surface: '#FFFFFF',
  cardBg: '#F5F4F3',

  // Text colors (opacity-based hierarchy)
  textPrimary: '#000000',
  textSecondary: 'rgba(0, 0, 0, 0.75)',
  textTertiary: 'rgba(0, 0, 0, 0.5)',
  textQuaternary: 'rgba(0, 0, 0, 0.4)',
  textFaint: 'rgba(0, 0, 0, 0.25)',

  // Borders
  border: '#E4E4E4',

  // Accent colors
  accent: '#ED622B',
  accentLight: '#FFFBDB',
  secondary: '#EAE6E4',

  // Status colors with bg/text pairs
  healthy: { bg: '#D5FFD7', text: '#007A06' },
  warning: { bg: '#FFF1A9', text: '#E7C000' },
  critical: { bg: '#FFCABE', text: '#E72A00' },
  info: { bg: '#BBDDFF', text: '#5070F0' },

  // Status tag bar colors
  statusBars: {
    healthy: ['#029c0a', '#d9d9d9', '#d9d9d9'],
    warning: ['#ebd450', '#e7c000', '#d9d9d9'],
    critical: ['#e16d00', '#e0460a', '#d40101'],
    info: ['#d9d9d9', '#d9d9d9', '#d9d9d9'],
  },

  // Video container
  videoBg: '#1f2123',

  // Utility
  white: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.35)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  title: 28,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
};
