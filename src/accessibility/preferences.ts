import { storage } from "../lib/storage";

export const ACCESSIBILITY_PREFERENCES_KEY =
  "oracle:accessibility-preferences:v1";

export const colorVisionModes = [
  "default",
  "redGreen",
  "blueYellow",
  "highContrast",
] as const;

export type ColorVisionMode = (typeof colorVisionModes)[number];

export type AccessibilityPreferences = {
  colorVisionMode: ColorVisionMode;
  dyslexiaFriendlyText: boolean;
  largerText: boolean;
};

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  colorVisionMode: "default",
  dyslexiaFriendlyText: false,
  largerText: false,
};

export function parseAccessibilityPreferences(
  raw: string | null,
): AccessibilityPreferences {
  if (!raw) return defaultAccessibilityPreferences;

  try {
    const value = JSON.parse(raw) as Partial<AccessibilityPreferences>;
    return {
      colorVisionMode: colorVisionModes.includes(
        value.colorVisionMode as ColorVisionMode,
      )
        ? (value.colorVisionMode as ColorVisionMode)
        : "default",
      dyslexiaFriendlyText: value.dyslexiaFriendlyText === true,
      largerText: value.largerText === true,
    };
  } catch {
    return defaultAccessibilityPreferences;
  }
}

export async function loadAccessibilityPreferences() {
  return parseAccessibilityPreferences(
    await storage.getItem(ACCESSIBILITY_PREFERENCES_KEY),
  );
}

export async function saveAccessibilityPreferences(
  preferences: AccessibilityPreferences,
) {
  await storage.setItem(
    ACCESSIBILITY_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
}
