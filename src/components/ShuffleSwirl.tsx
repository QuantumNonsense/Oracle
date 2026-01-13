import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageStyle,
} from "react-native";
import { cardBackImage } from "../decks/defaultDeck";
import { colors, radii, shadow } from "../theme";

type ShuffleSwirlProps = {
  visible: boolean;
  onDone?: () => void;
  size?: number;
  cardWidth?: number;
};

const DEFAULT_SIZE = 260;
const DEFAULT_CARD_WIDTH = 140;
const DEFAULT_DURATION = 900;
const STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];

const buildOrbit = (radiusX: number, radiusY: number, offset: number) =>
  STEPS.map((step) => {
    const angle = (step + offset) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
      rot: Math.sin(angle) * 14,
    };
  });

export default function ShuffleSwirl({
  visible,
  onDone,
  size = DEFAULT_SIZE,
  cardWidth = DEFAULT_CARD_WIDTH,
}: ShuffleSwirlProps) {
  const { height: windowHeight } = useWindowDimensions();
  const phase = useRef(new Animated.Value(0)).current;
  const scalePulse = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const cardHeight = cardWidth * 1.5;
  const radiusX = size * 0.18;
  const radiusY = size * 0.12;

  const orbits = useMemo(
    () => [
      buildOrbit(radiusX, radiusY, 0),
      buildOrbit(radiusX, radiusY, 1 / 3),
      buildOrbit(radiusX, radiusY, 2 / 3),
    ],
    [radiusX, radiusY]
  );

  const scale = useMemo(
    () =>
      scalePulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.98, 1.03],
      }),
    [scalePulse]
  );

  useEffect(() => {
    if (!visible) {
      animationRef.current?.stop();
      phase.setValue(0);
      scalePulse.setValue(0);
      return;
    }

    phase.setValue(0);
    scalePulse.setValue(0);

    const animation = Animated.parallel([
      Animated.timing(phase, {
        toValue: 1,
        duration: DEFAULT_DURATION,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scalePulse, {
          toValue: 1,
          duration: DEFAULT_DURATION * 0.5,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scalePulse, {
          toValue: 0,
          duration: DEFAULT_DURATION * 0.5,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animationRef.current = animation;
    animation.start(({ finished }) => {
      if (finished) {
        onDone?.();
      }
    });

    return () => {
      animation.stop();
    };
  }, [onDone, phase, scalePulse, visible]);

  const cardStyles = useMemo(
    () =>
      orbits.map((orbit) => {
        const translateX = phase.interpolate({
          inputRange: STEPS,
          outputRange: orbit.map((point) => point.x),
        });
        const translateY = phase.interpolate({
          inputRange: STEPS,
          outputRange: orbit.map((point) => point.y),
        });
        const rotateZ = phase.interpolate({
          inputRange: STEPS,
          outputRange: orbit.map((point) => `${point.rot}deg`),
        });

        return {
          transform: [
            { translateX },
            { translateY },
            { rotateZ },
            { scale },
          ],
        } satisfies Animated.WithAnimatedObject<ImageStyle>;
      }),
    [orbits, phase, scale]
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View
        style={[
          styles.stage,
          { width: size, height: size, transform: [{ translateY: -windowHeight * 0.12 }] },
        ]}
      >
        <View style={styles.glow} />
        {cardStyles.map((style, index) => (
          <Animated.Image
            key={`shuffle-card-${index}`}
            source={cardBackImage}
            style={[
              styles.card,
              { width: cardWidth, height: cardHeight, zIndex: index + 1 },
              style,
            ]}
            resizeMode="cover"
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 120,
    backgroundColor: colors.accentLavender,
    opacity: 0.2,
    ...shadow.soft,
  },
  card: {
    position: "absolute",
    borderRadius: radii.lg,
    overflow: "hidden",
  },
});
