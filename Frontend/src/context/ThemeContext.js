import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing } from "../theme/spacing";
import { radii } from "../theme/radii";
import { shadows } from "../theme/shadows";
import { typography } from "../theme/typography";
import { getStatusColor } from "../theme/statusColors";

const STORAGE_KEY = "@smart_delivery_dark_mode";

// Modern emerald palette on slate ink. Existing token keys are preserved
// (so every `colors.*` reader keeps working) and retuned + extended.
const lightColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  primary: "#0E9F6E",
  primaryDark: "#0C7A55",
  primaryLight: "#E7F6EF",
  success: "#16A34A",
  danger: "#E11D48",
  warning: "#F59E0B",
  inputBg: "#FFFFFF",
  cardShadow: "#000000",
  // role accents
  partner: "#0D9488",
  admin: "#4F46E5",
};

const darkColors = {
  background: "#0B1220",
  surface: "#111A2E",
  surfaceAlt: "#1E293B",
  text: "#F1F5F9",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  border: "#334155",
  primary: "#34D399",
  primaryDark: "#10B981",
  primaryLight: "#0B2E22",
  success: "#22C55E",
  danger: "#FB7185",
  warning: "#FBBF24",
  inputBg: "#1E293B",
  cardShadow: "#000000",
  partner: "#2DD4BF",
  admin: "#818CF8",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === "true") setIsDarkMode(true);
    });
  }, []);

  const toggleDarkMode = async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    await AsyncStorage.setItem(STORAGE_KEY, next ? "true" : "false");
  };

  const colors = useMemo(() => (isDarkMode ? darkColors : lightColors), [isDarkMode]);

  // status -> { bg, fg } resolved for the current theme
  const statusColor = useMemo(() => (status) => getStatusColor(status, isDarkMode), [isDarkMode]);

  const value = useMemo(
    () => ({ isDarkMode, toggleDarkMode, colors, spacing, radii, shadows, typography, statusColor }),
    [isDarkMode, colors, statusColor]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
