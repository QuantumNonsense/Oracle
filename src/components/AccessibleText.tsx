import { Platform, StyleSheet, Text as NativeText, type TextProps } from "react-native";

import { useAccessibility } from "../accessibility/AccessibilityProvider";

export default function AccessibleText({ style, ...props }: TextProps) {
  const { preferences } = useAccessibility();

  if (!preferences.dyslexiaFriendlyText) {
    return <NativeText {...props} style={style} />;
  }

  const flattenedStyle = StyleSheet.flatten(style);
  const fontWeight = flattenedStyle?.fontWeight;
  const numericWeight =
    typeof fontWeight === "string" ? Number.parseInt(fontWeight, 10) : 0;
  const isBold =
    fontWeight === "bold" ||
    (Number.isFinite(numericWeight) && numericWeight >= 600) ||
    (typeof flattenedStyle?.fontFamily === "string" &&
      flattenedStyle.fontFamily.toLowerCase().includes("bold"));
  const fontFamily = isBold
    ? Platform.select({
        default: "AtkinsonHyperlegibleBold",
        web: "AtkinsonHyperlegibleBold, Arial, sans-serif",
      })
    : Platform.select({
        default: "AtkinsonHyperlegible",
        web: "AtkinsonHyperlegible, Arial, sans-serif",
      });

  return <NativeText {...props} style={[style, { fontFamily }]} />;
}
