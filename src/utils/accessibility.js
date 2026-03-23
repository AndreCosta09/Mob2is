export const APP_PREFERENCES_KEY = "mob2is_prefs_v1";

export const DEFAULT_APP_PREFERENCES = {
  notifications: true,
  useLocation: true,
  reduceMotion: false,
  highContrast: false,
};

export function getMotionDuration(reduceMotion, duration) {
  return reduceMotion ? 0 : duration;
}

export function getModalAnimationType(reduceMotion, type = "fade") {
  return reduceMotion ? "none" : type;
}

export function getAppPalette(highContrast = false) {
  if (highContrast) {
    return {
      bg: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceAlt: "#F4F4F4",
      text: "#000000",
      muted: "#1F1F1F",
      border: "#000000",
      accent: "#A15C00",
      accentStrong: "#7A4300",
      accentText: "#000000",
      success: "#0B6E2E",
      dangerBg: "#FFFFFF",
      dangerBorder: "#000000",
      dangerText: "#000000",
      iconInactive: "#000000",
      overlay: "rgba(0,0,0,0.24)",
      cardShadow: "#000000",
    };
  }

  return {
    bg: "#F3F5F7",
    surface: "#FFFFFF",
    surfaceAlt: "#EEF1F4",
    text: "#0B2D4D",
    muted: "rgba(11,45,77,0.62)",
    border: "rgba(11,45,77,0.08)",
    accent: "#F09C1F",
    accentStrong: "#1579B3",
    accentText: "#051F41",
    success: "#39A25D",
    dangerBg: "#FFF4E8",
    dangerBorder: "rgba(241,143,1,0.26)",
    dangerText: "#8A4B00",
    iconInactive: "#9AA3AD",
    overlay: "rgba(5,31,65,0.28)",
    cardShadow: "#000000",
  };
}
