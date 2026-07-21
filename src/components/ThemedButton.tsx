import { useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Platform,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { colors, radii, spacing } from "../theme";
import { useAccessibility } from "../accessibility/AccessibilityProvider";
import Text from "./AccessibleText";

type Variant = "primary" | "secondary" | "ghost";

type ThemedButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

const buttonFontFamily = Platform.select({
  ios: "MilongaRegular",
  android: "MilongaRegular",
  default: "'MilongaRegular', 'Times New Roman', serif",
});

export default function ThemedButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
  labelStyle: labelStyleOverride,
}: ThemedButtonProps) {
  const accessibility = useAccessibility();
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale }, { translateY }],
    }),
    [scale, translateY]
  );

  const { containerStyle, labelStyle } = useMemo(() => {
    switch (variant) {
      case "secondary":
        return {
          containerStyle: [styles.base, styles.secondary],
          labelStyle: [styles.label, styles.labelDark],
        };
      case "ghost":
        return {
          containerStyle: [styles.base, styles.ghost],
          labelStyle: [styles.label, styles.labelLight],
        };
      default:
        return {
          containerStyle: [styles.base, styles.primary],
          labelStyle: [styles.label, styles.labelDark],
        };
    }
  }, [variant]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.975,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
      Animated.spring(translateY, {
        toValue: 2,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
    ]).start();
  };

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            animatedStyle,
            containerStyle,
            styles.depth,
            pressed && styles.depthPressed,
            disabled && styles.disabled,
            {
              borderColor: accessibility.colors.border,
              minHeight: 44,
            },
            variant === "primary" && {
              backgroundColor: accessibility.colors.accent,
            },
            variant === "secondary" && {
              backgroundColor: accessibility.colors.selected,
            },
            style,
          ]}
        >
          <Text
            style={[
              labelStyle,
              {
                color:
                  variant === "ghost"
                    ? accessibility.colors.textPrimary
                    : accessibility.colors.accentText,
                fontFamily: accessibility.preferences.dyslexiaFriendlyText
                  ? "AtkinsonHyperlegibleBold"
                  : buttonFontFamily,
                fontSize: accessibility.preferences.largerText ? 20.8 : 17.6,
              },
              labelStyleOverride,
            ]}
          >
            {label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 3,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  label: {
    fontFamily: buttonFontFamily,
    fontWeight: "700",
    fontSize: 17.6,
    letterSpacing: 0.2,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  labelDark: {
    color: colors.bg,
  },
  labelLight: {
    color: colors.text,
  },
  depth: {
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  depthPressed: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
});
