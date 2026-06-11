// Poppins type system. On React Native, custom-font weight comes from the
// FONT FAMILY, not `fontWeight` — so never combine `fontWeight` with these.
export const fontFamily = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

export const fontSizes = {
  caption: 11,
  footnote: 12,
  body: 14,
  bodyLg: 16,
  subtitle: 18,
  title: 22,
  h2: 26,
  display: 32,
};

const lineHeights = {
  caption: 16,
  footnote: 18,
  body: 20,
  bodyLg: 24,
  subtitle: 24,
  title: 28,
  h2: 32,
  display: 40,
};

// t("title", "bold") -> { fontFamily, fontSize, lineHeight }
export function t(variant = "body", weight = "regular") {
  return {
    fontFamily: fontFamily[weight] || fontFamily.regular,
    fontSize: fontSizes[variant] || fontSizes.body,
    lineHeight: lineHeights[variant] || lineHeights.body,
  };
}

export const typography = { fontFamily, fontSizes, lineHeights, t };
export default typography;
