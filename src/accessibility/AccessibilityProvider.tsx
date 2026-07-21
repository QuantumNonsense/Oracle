import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform, type TextStyle } from "react-native";
import { useFonts } from "expo-font";
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";

import {
  defaultAccessibilityPreferences,
  loadAccessibilityPreferences,
  saveAccessibilityPreferences,
  type AccessibilityPreferences,
  type ColorVisionMode,
} from "./preferences";

export type SemanticColors = {
  background: string;
  overlay: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentText: string;
  selected: string;
  success: string;
  warning: string;
  error: string;
  disabled: string;
};

const palettes: Record<ColorVisionMode, SemanticColors> = {
  default: {
    background: "#121024",
    overlay: "rgba(18,16,36,0.18)",
    surface: "#312B26",
    surfaceElevated: "#423A32",
    textPrimary: "#FBFAFF",
    textSecondary: "#D8CDB7",
    border: "#E2D3AE",
    accent: "#BDB2FF",
    accentText: "#121024",
    selected: "#D6F5D6",
    success: "#9FE3B1",
    warning: "#FFD6A5",
    error: "#FF9EAA",
    disabled: "#8C877F",
  },
  redGreen: {
    background: "#10182B",
    overlay: "rgba(16,24,43,0.25)",
    surface: "#28334A",
    surfaceElevated: "#35445F",
    textPrimary: "#FFFFFF",
    textSecondary: "#DBE6F5",
    border: "#F2D27A",
    accent: "#73B7E8",
    accentText: "#08131F",
    selected: "#F2D27A",
    success: "#79C7F2",
    warning: "#FFD166",
    error: "#EF9A62",
    disabled: "#8993A4",
  },
  blueYellow: {
    background: "#21131E",
    overlay: "rgba(33,19,30,0.24)",
    surface: "#44303D",
    surfaceElevated: "#594050",
    textPrimary: "#FFFFFF",
    textSecondary: "#F2DCE8",
    border: "#F0A6CA",
    accent: "#F0A6CA",
    accentText: "#21131E",
    selected: "#F2B880",
    success: "#EFA6D2",
    warning: "#F2B880",
    error: "#FF8E86",
    disabled: "#A28E9C",
  },
  highContrast: {
    background: "#000000",
    overlay: "rgba(0,0,0,0.48)",
    surface: "#111111",
    surfaceElevated: "#242424",
    textPrimary: "#FFFFFF",
    textSecondary: "#F1F1F1",
    border: "#FFFFFF",
    accent: "#FFDF4D",
    accentText: "#000000",
    selected: "#FFDF4D",
    success: "#8FF0A4",
    warning: "#FFD166",
    error: "#FF8A8A",
    disabled: "#A6A6A6",
  },
};

type AccessibilityContextValue = {
  preferences: AccessibilityPreferences;
  colors: SemanticColors;
  bodyTextStyle: TextStyle;
  headingTextStyle: TextStyle;
  setColorVisionMode: (mode: ColorVisionMode) => void;
  setDyslexiaFriendlyText: (enabled: boolean) => void;
  setLargerText: (enabled: boolean) => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null,
);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultAccessibilityPreferences);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [fontsLoaded] = useFonts({
    MilongaRegular: require("../../assets/Milonga-Regular.ttf"),
    AtkinsonHyperlegible: AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegibleBold: AtkinsonHyperlegible_700Bold,
  });

  useEffect(() => {
    let active = true;
    void loadAccessibilityPreferences().then((saved) => {
      if (active) {
        setPreferences(saved);
        setPreferencesLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const updatePreferences = useCallback(
    (update: Partial<AccessibilityPreferences>) => {
      setPreferences((current) => {
        const next = { ...current, ...update };
        void saveAccessibilityPreferences(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo<AccessibilityContextValue>(() => {
    const scale = preferences.largerText ? 1.18 : 1;
    const fontFamily = preferences.dyslexiaFriendlyText
      ? Platform.select({
          default: "AtkinsonHyperlegible",
          web: "AtkinsonHyperlegible, Arial, sans-serif",
        })
      : undefined;
    return {
      preferences,
      colors: palettes[preferences.colorVisionMode],
      bodyTextStyle: {
        fontFamily,
        fontSize: 16 * scale,
        lineHeight: Math.round(24 * scale),
        letterSpacing: preferences.dyslexiaFriendlyText ? 0.25 : 0,
        textAlign: "left",
      },
      headingTextStyle: {
        fontFamily: preferences.dyslexiaFriendlyText
          ? "AtkinsonHyperlegibleBold"
          : undefined,
        fontSize: 19 * scale,
        lineHeight: Math.round(25 * scale),
        letterSpacing: preferences.dyslexiaFriendlyText ? 0.2 : 0,
      },
      setColorVisionMode: (colorVisionMode) =>
        updatePreferences({ colorVisionMode }),
      setDyslexiaFriendlyText: (dyslexiaFriendlyText) =>
        updatePreferences({ dyslexiaFriendlyText }),
      setLargerText: (largerText) => updatePreferences({ largerText }),
    };
  }, [preferences, updatePreferences]);

  if (!fontsLoaded || !preferencesLoaded) return null;

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const value = useContext(AccessibilityContext);
  if (!value) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return value;
}

export { palettes as accessibilityPalettes };
