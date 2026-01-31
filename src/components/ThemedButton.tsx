import { useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, radii, spacing } from "../theme";

type Variant = "primary" | "secondary" | "ghost";

type ThemedButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const buttonFontFamily = Platform.select({
  ios: "Palatino",
  android: "serif",
  default: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
});

export default function ThemedButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
}: ThemedButtonProps) {
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
            style,
          ]}
        >
          <View pointerEvents="none" style={styles.highlight} />
          <Text style={labelStyle}>{label}</Text>
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
    fontSize: 16,
    letterSpacing: 0.2,
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
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.text,
    opacity: 0.18,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
});
