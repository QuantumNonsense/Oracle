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
import { colors } from "../theme";
import { CARD_ASPECT_RATIO, CARD_CORNER_RADIUS } from "../lib/cardLayout";

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
const FLIP_DURATION_MS = 440;
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
  const isRevealing = useRef(false);
  const idleLoop = useRef<Animated.CompositeAnimation | null>(null);
  const isFrontRef = useRef(isFront);
  const ios = Platform.OS === "ios";
  const android = Platform.OS === "android";

  useEffect(() => {
    isFrontRef.current = isFront;
  }, [isFront]);

  useEffect(() => {
    flip.stopAnimation();
    Animated.timing(flip, {
      toValue: isFront ? 180 : 0,
      duration: FLIP_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
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
    if (ios) {
      return {
        transform: [
          {
            translateY: flip.interpolate({
              inputRange: [0, 90, 180],
              outputRange: [0, -4, 0],
            }),
          },
          {
            scale: flip.interpolate({
              inputRange: [0, 90, 180],
              outputRange: [1, 1.012, 1],
            }),
          },
        ],
      };
    }
    if (android) {
      return {
        transform: [
          {
            translateY: flip.interpolate({
              inputRange: [0, 90, 180],
              outputRange: [0, -4, 0],
            }),
          },
          {
            scale: flip.interpolate({
              inputRange: [0, 90, 180],
              outputRange: [1, 1.012, 1],
            }),
          },
        ],
      };
    }
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
  }, [android, flip, ios]);

  const iosBackFlipStyle = useMemo(() => {
    if (!ios) {
      return null;
    }
    return {
      opacity: flip.interpolate({
        inputRange: [0, 78, 90, 180],
        outputRange: [1, 1, 0, 0],
        extrapolate: "clamp",
      }),
      transform: [
        {
          scaleX: flip.interpolate({
            inputRange: [0, 82, 90, 180],
            outputRange: [1, 0.14, 0.075, 0.075],
            extrapolate: "clamp",
          }),
        },
      ],
    };
  }, [flip, ios]);

  const androidBackFlipStyle = useMemo(() => {
    if (!android) {
      return null;
    }
    return {
      opacity: flip.interpolate({
        inputRange: [0, 78, 90, 180],
        outputRange: [1, 1, 0, 0],
        extrapolate: "clamp",
      }),
      transform: [
        {
          scaleX: flip.interpolate({
            inputRange: [0, 82, 90, 180],
            outputRange: [1, 0.14, 0.075, 0.075],
            extrapolate: "clamp",
          }),
        },
      ],
    };
  }, [android, flip]);

  const iosFrontFlipStyle = useMemo(() => {
    if (!ios) {
      return null;
    }
    return {
      opacity: flip.interpolate({
        inputRange: [0, 90, 102, 180],
        outputRange: [0, 0, 1, 1],
        extrapolate: "clamp",
      }),
      transform: [
        {
          scaleX: flip.interpolate({
            inputRange: [0, 90, 98, 180],
            outputRange: [0.075, 0.075, 0.14, 1],
            extrapolate: "clamp",
          }),
        },
      ],
    };
  }, [flip, ios]);

  const androidFrontFlipStyle = useMemo(() => {
    if (!android) {
      return null;
    }
    return {
      opacity: flip.interpolate({
        inputRange: [0, 90, 102, 180],
        outputRange: [0, 0, 1, 1],
        extrapolate: "clamp",
      }),
      transform: [
        {
          scaleX: flip.interpolate({
            inputRange: [0, 90, 98, 180],
            outputRange: [0.075, 0.075, 0.14, 1],
            extrapolate: "clamp",
          }),
        },
      ],
    };
  }, [android, flip]);

  const iosEdgeStyle = useMemo(() => {
    if (!ios) {
      return null;
    }
    return {
      opacity: flip.interpolate({
        inputRange: [0, 68, 86, 96, 114, 180],
        outputRange: [0, 0, 0.38, 0.86, 0, 0],
        extrapolate: "clamp",
      }),
      transform: [
        {
          translateY: flip.interpolate({
            inputRange: [0, 90, 180],
            outputRange: [0, -1, 0],
            extrapolate: "clamp",
          }),
        },
        {
          scaleX: flip.interpolate({
            inputRange: [0, 90, 180],
            outputRange: [0.012, 0.064, 0.012],
            extrapolate: "clamp",
          }),
        },
      ],
    };
  }, [flip, ios]);

  const androidEdgeStyle = useMemo(() => {
    if (!android) {
      return null;
    }
    return {
      opacity: flip.interpolate({
        inputRange: [0, 68, 86, 96, 114, 180],
        outputRange: [0, 0, 0.38, 0.86, 0, 0],
        extrapolate: "clamp",
      }),
      transform: [
        {
          translateY: flip.interpolate({
            inputRange: [0, 90, 180],
            outputRange: [0, -1, 0],
            extrapolate: "clamp",
          }),
        },
        {
          scaleX: flip.interpolate({
            inputRange: [0, 90, 180],
            outputRange: [0.012, 0.064, 0.012],
            extrapolate: "clamp",
          }),
        },
      ],
    };
  }, [android, flip]);

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
      <Animated.View style={[styles.cardFrame, style, cardPresenceStyle]}>
        <Animated.View style={[styles.card3d, flipAnimatedStyle]}>
          {!ios && !android ? (
            <View style={[styles.card, styles.underlay]} pointerEvents="none">
              {back}
            </View>
          ) : null}
          {ios ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.card, styles.iosCardEdge, iosEdgeStyle]}
            />
          ) : null}
          {android ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.card,
                styles.androidCardEdge,
                androidEdgeStyle,
              ]}
            />
          ) : null}
          <Animated.View
            pointerEvents={isFront ? "none" : "auto"}
            style={[
              styles.card,
              styles.cardBack,
              iosBackFlipStyle,
              androidBackFlipStyle,
            ]}
          >
            {back}
          </Animated.View>
          <Animated.View
            pointerEvents={isFront ? "auto" : "none"}
            style={[
              styles.card,
              styles.cardFront,
              iosFrontFlipStyle,
              androidFrontFlipStyle,
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
  cardFrame: {
    aspectRatio: CARD_ASPECT_RATIO,
  },
  card3d: {
    width: "100%",
    height: "100%",
    ...(Platform.OS === "web" ? { transformStyle: "preserve-3d" } : {}),
  },
  card: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: CARD_CORNER_RADIUS,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    backgroundColor: "transparent",
  },
  underlay: {
    ...(Platform.OS === "ios"
      ? { backgroundColor: "transparent" }
      : { backgroundColor: colors.surface }),
    zIndex: 0,
  },
  cardFront: {
    ...(Platform.OS !== "ios" && Platform.OS !== "android"
      ? { transform: [{ rotateY: "180deg" }] }
      : {}),
    ...(Platform.OS === "ios"
      ? { backgroundColor: "transparent" }
      : { backgroundColor: colors.surface }),
    zIndex: 2,
  },
  cardBack: {
    ...(Platform.OS === "ios"
      ? { backgroundColor: "transparent" }
      : { backgroundColor: colors.surface }),
    zIndex: 1,
  },
  iosCardEdge: {
    backgroundColor: colors.secondary,
    borderColor: "rgba(80, 37, 14, 0.24)",
    borderWidth: 1,
    zIndex: 3,
  },
  androidCardEdge: {
    backgroundColor: colors.secondary,
    borderColor: "rgba(80, 37, 14, 0.24)",
    borderWidth: 1,
    zIndex: 3,
  },
});
