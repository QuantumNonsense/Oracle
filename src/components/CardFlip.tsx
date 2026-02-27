import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";
import { colors, radii, shadow } from "../theme";

type CardFlipProps = {
  front: ReactNode;
  back: ReactNode;
  isFront: boolean;
  onBeforeFlip?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  idle?: boolean;
};

const enableIdleBreathDefault = true;

const runParallel = (animations: Animated.CompositeAnimation[]) =>
  new Promise<void>((resolve) => {
    Animated.parallel(animations).start(() => resolve());
  });

const runDelay = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });

export default function CardFlip({
  front,
  back,
  isFront,
  onBeforeFlip,
  style,
  disabled = false,
  idle = enableIdleBreathDefault,
}: CardFlipProps) {
  const flip = useRef(new Animated.Value(0)).current;
  const liftScale = useRef(new Animated.Value(1)).current;
  const liftTranslate = useRef(new Animated.Value(0)).current;
  const idleScale = useRef(new Animated.Value(1)).current;
  const idleTranslate = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const isRevealing = useRef(false);
  const idleLoop = useRef<Animated.CompositeAnimation | null>(null);
  const isFrontRef = useRef(isFront);
  const ios = Platform.OS === "ios";

  useEffect(() => {
    isFrontRef.current = isFront;
  }, [isFront]);

  useEffect(() => {
    Animated.timing(flip, {
      toValue: isFront ? 180 : 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "ios",
    }).start();
  }, [flip, isFront]);

  useEffect(() => {
    if (!idle || isFront || isRevealing.current) {
      idleLoop.current?.stop();
      idleScale.setValue(1);
      idleTranslate.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(idleScale, {
            toValue: 1.008,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(idleTranslate, {
            toValue: -2,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(idleScale, {
            toValue: 1,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(idleTranslate, {
            toValue: 0,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    idleLoop.current = loop;
    loop.start();

    return () => loop.stop();
  }, [idleScale, idleTranslate, isFront]);

  const flipAnimatedStyle = useMemo(() => {
    return {
      transform: [
        { perspective: 1000 },
        {
          rotateY: flip.interpolate({
            inputRange: [0, 180],
            outputRange: ["0deg", "180deg"],
          }),
        },
      ],
    };
  }, [flip]);

  const frontOpacity = useMemo(() => {
    if (!ios) {
      return 1;
    }
    return flip.interpolate({
      inputRange: [0, 88, 90, 92, 180],
      outputRange: [0, 0, 0.18, 1, 1],
    });
  }, [flip, ios]);

  const backOpacity = useMemo(() => {
    if (!ios) {
      return 1;
    }
    return flip.interpolate({
      inputRange: [0, 88, 90, 92, 180],
      outputRange: [1, 1, 0.18, 0, 0],
    });
  }, [flip, ios]);

  const cardPresenceStyle = useMemo(
    () => ({
      transform: [
        {
          scale: Animated.multiply(liftScale, idleScale),
        },
        {
          translateY: Animated.add(liftTranslate, idleTranslate),
        },
      ],
    }),
    [idleScale, idleTranslate, liftScale, liftTranslate]
  );

  const glowStyle = useMemo(
    () => ({
      opacity: glowPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, 0.22],
      }),
      transform: [
        { translateX: -160 },
        { translateY: -220 },
        {
          scale: glowPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.06],
          }),
        },
      ],
    }),
    [glowPulse]
  );

  const startIdleIfNeeded = () => {
    if (!idle || isFrontRef.current || isRevealing.current) {
      return;
    }
    idleLoop.current?.stop();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(idleScale, {
            toValue: 1.008,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(idleTranslate, {
            toValue: -2,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(idleScale, {
            toValue: 1,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(idleTranslate, {
            toValue: 0,
            duration: 2600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    idleLoop.current = loop;
    loop.start();
  };

  const handleRevealPress = async () => {
    if (disabled) {
      return;
    }
    if (isRevealing.current) {
      return;
    }

    if (isFront) {
      onBeforeFlip?.();
      return;
    }

    isRevealing.current = true;
    idleLoop.current?.stop();

    await runParallel([
      Animated.timing(liftScale, {
        toValue: 1.02,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(liftTranslate, {
        toValue: -6,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowPulse, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    onBeforeFlip?.();

    await runParallel([
      Animated.timing(liftScale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(liftTranslate, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowPulse, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    isRevealing.current = false;
    startIdleIfNeeded();
  };

  return (
    <Pressable
      onPress={handleRevealPress}
      style={styles.wrapper}
      disabled={disabled}
    >
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.cardFrame, style, cardPresenceStyle]}>
        <Animated.View style={[styles.card3d, flipAnimatedStyle]}>
          <View style={[styles.card, styles.underlay]} pointerEvents="none">
            {back}
          </View>
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              Platform.OS === "ios" ? { opacity: backOpacity } : null,
            ]}
          >
            {back}
          </Animated.View>
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              Platform.OS === "ios" ? { opacity: frontOpacity } : null,
            ]}
          >
            {front}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glow: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 320,
    height: 440,
    borderRadius: 200,
    backgroundColor: colors.accentLavender,
    opacity: 0.12,
    ...shadow.glow,
  },
  cardFrame: {
    aspectRatio: 2 / 3,
  },
  card3d: {
    width: "100%",
    height: "100%",
    ...(Platform.OS === "ios" ? {} : { transformStyle: "preserve-3d" }),
  },
  card: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...(Platform.OS === "ios"
      ? { backfaceVisibility: "visible" }
      : { backfaceVisibility: "hidden" }),
    backgroundColor: "transparent",
  },
  underlay: {
    backgroundColor: colors.surface,
    zIndex: 0,
  },
  cardFront: {
    transform: [{ rotateY: "180deg" }],
    backgroundColor: colors.surface,
    zIndex: 2,
  },
  cardBack: {
    backgroundColor: colors.surface,
    zIndex: 1,
  },
});
