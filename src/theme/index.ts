// =============================================================================
// ARNOLD — Theme
// Dark, bold, high-contrast. Like chalk and iron.
// =============================================================================

export const colors = {
  // Base
  bg: "#0A0A0B",
  bgCard: "#141416",
  bgCardHover: "#1C1C1F",
  bgElevated: "#1E1E22",

  // Text
  text: "#F5F5F7",
  textSecondary: "#8E8E93",
  textMuted: "#5A5A5E",

  // Accent — warm amber/gold. Power and grit.
  accent: "#F5A623",
  accentDim: "#C4841D",
  accentGlow: "rgba(245, 166, 35, 0.15)",

  // Semantic
  success: "#34C759",
  warning: "#FF9F0A",
  danger: "#FF453A",
  info: "#64D2FF",

  // Goal colors
  streetLifting: "#E63946",
  endurance: "#F77F00",
  skillAcquisition: "#2A9D8F",
  mobility: "#6A4C93",

  // Pain scale
  painMild: "#F5A623",
  painModerate: "#FF6B35",
  painSevere: "#FF453A",

  // Borders
  border: "#2C2C2E",
  borderFocus: "#F5A623",
} as const;

export const typography = {
  // Using system fonts for RN — will swap to custom fonts later
  fontBold: "System",
  fontMedium: "System",
  fontRegular: "System",

  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 22,
    xl: 28,
    xxl: 34,
    hero: 42,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
