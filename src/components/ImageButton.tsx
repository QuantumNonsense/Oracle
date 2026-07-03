import { useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type ImageButtonProps = {
  source: ImageSourcePropType;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function ImageButton({
  source,
  accessibilityLabel,
  onPress,
  disabled = false,
  style,
}: ImageButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale }, { translateY }],
    }),
    [scale, translateY],
  );

  const animatePress = (pressed: boolean) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressed ? 0.94 : 1,
        useNativeDriver: true,
        speed: 24,
        bounciness: 0,
      }),
      Animated.spring(translateY, {
        toValue: pressed ? 2 : 0,
        useNativeDriver: true,
        speed: 24,
        bounciness: 0,
      }),
    ]).start();
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      onPressIn={() => animatePress(true)}
      onPressOut={() => animatePress(false)}
      style={[styles.pressable, style]}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.surface,
            animatedStyle,
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={source}
            style={styles.image}
          />
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 112,
    height: 76,
  },
  surface: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.45,
  },
});
