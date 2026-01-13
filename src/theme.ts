export const colors = {
  bg: "#121024",
  surface: "#1B1836",
  surfaceAlt: "#161D18",
  text: "#FBFAFF",
  textSoft: "rgba(251,250,255,0.78)",
  muted: "rgba(251,250,255,0.75)",
  primary: "#D6F5D6",
  secondary: "#F6F1DE",
  accentPeach: "#FFD6A5",
  accentLavender: "#BDB2FF",
  accentBlue: "#A7C7E7",
  borderSoft: "rgba(251,250,255,0.10)",
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  title: 28,
  subtitle: 14,
  body: 14,
  button: 15,
};

export const shadow = {
  soft: {
    shadowColor: colors.accentLavender,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  glow: {
    shadowColor: colors.accentLavender,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },
};
