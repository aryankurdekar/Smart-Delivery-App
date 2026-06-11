// Single source of truth for order-status badge colors (was hardcoded in 6 screens).
// Keys MUST match the load-bearing status strings exactly — do not rename.
const LIGHT = {
  "Placed": { bg: "#FEF3C7", fg: "#B45309" },
  "Assigned": { bg: "#DBEAFE", fg: "#1D4ED8" },
  "Picked Up": { bg: "#CCFBF1", fg: "#0F766E" },
  "Out For Delivery": { bg: "#FFEDD5", fg: "#C2410C" },
  "Delivered": { bg: "#DCFCE7", fg: "#15803D" },
  "Cancelled": { bg: "#FFE4E6", fg: "#BE123C" },
};

const DARK = {
  "Placed": { bg: "#3B2F0B", fg: "#FCD34D" },
  "Assigned": { bg: "#10243F", fg: "#93C5FD" },
  "Picked Up": { bg: "#0B2E2A", fg: "#5EEAD4" },
  "Out For Delivery": { bg: "#3A1E0B", fg: "#FDBA74" },
  "Delivered": { bg: "#0C2A18", fg: "#86EFAC" },
  "Cancelled": { bg: "#3A1016", fg: "#FDA4AF" },
};

const FALLBACK = {
  light: { bg: "#F1F5F9", fg: "#475569" },
  dark: { bg: "#1E293B", fg: "#CBD5E1" },
};

export function getStatusColor(status, isDarkMode = false) {
  const map = isDarkMode ? DARK : LIGHT;
  return map[status] || (isDarkMode ? FALLBACK.dark : FALLBACK.light);
}

export default getStatusColor;
