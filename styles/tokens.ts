export const PALETTE = {
  // Base Colors (Dark Theme)
  background: '#000000', // Pure Black
  surface: '#1C1C1E', // iOS Secondary
  surface2: '#2C2C2E', // iOS Tertiary
  border: '#2C2C2E',

  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: '#8E8E93',
    white: '#ffffff',
    black: '#000000',
  },

  // Strict Requested Colors
  success: '#00e17a', // Green
  warning: '#ffd21f', // Yellow/Orange
  danger: '#f04248', // Red

  // UI Accents (Standardized)
  info: '#007AFF', // iOS Blue (Keep for generic links/info)
  gold: '#ffd21f', // Map Gold to Warning for consistency in stars/records

  // Functional Colors (Mapped to new palette where possible)
  muscle: {
    pecs: '#007AFF', // Blue
    back: '#00e17a', // Success Green
    legs: '#ffd21f', // Warning Yellow (Legacy Global)
    quads: '#EAB308', // Yellow/Gold
    hamstrings: '#F97316', // Orange Rust
    glutes: '#EC4899', // Pink/Magenta
    shoulders: '#8B5CF6', // Purple (Keep for distinction)
    arms: '#f04248', // Danger Red
    abs: '#06B6D4', // Cyan
    calves: '#FF5F1F', // Orange
    forearms: '#6366F1', // Indigo
    cardio: '#8E8E93', // Gray
    neck: '#8E8E93',
  },

  // Fatigue Scale (RPE Adjusted: 1=Low/Good, 5=High/Bad)
  fatigue: {
    1: '#00e17a', // Success (Facile)
    2: '#E2FF3B', // Lime
    3: '#ffd21f', // Warning (Moyen)
    4: '#FF5F1F', // Orange
    5: '#f04248', // Danger (Epuisant)
  },

  // Accents for charts/themes (Simplified)
  accents: {
    blue: { primary: '#007AFF', glow: 'rgba(0, 122, 255, 0.3)' },
    orange: { primary: '#FF5F1F', glow: 'rgba(255, 95, 31, 0.3)' }, // Burnt Orange
    emerald: { primary: '#00e17a', glow: 'rgba(0, 225, 122, 0.3)' },
    gold: { primary: '#ffd21f', glow: 'rgba(255, 210, 31, 0.3)' },
    red: { primary: '#f04248', glow: 'rgba(240, 66, 72, 0.3)' },
    purple: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.3)' },
    cyan: { primary: '#06B6D4', glow: 'rgba(6, 182, 212, 0.3)' },
    gray: { primary: '#8E8E93', glow: 'rgba(142, 142, 147, 0.3)' },
  },
};

export const SPACING = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: '0.5rem',
  md: '1rem',
  lg: '2rem',
  full: '9999px',
};
