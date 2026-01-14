import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageStyle,
} from "react-native";
import { cardBackImage } from "../decks/defaultDeck";
import { colors, radii, shadow, spacing } from "../theme";

type ShuffleSwirlProps = {
  visible: boolean;
  onDone?: () => void;
  size?: number;
  cardWidth?: number;
  anchor?: { x: number; y: number; w: number; h: number } | null;
};

const DEFAULT_SIZE = 260;
const DEFAULT_CARD_WIDTH = 140;
const CARD_COUNT = 10;
const CYCLES = 2;
const CYCLE_DURATION = 480;
const HOLD_BETWEEN = 0;
const TOS: number[][] = [
  [3, 8, 1, 6, 0, 9, 2, 5, 7, 4],
  [6, 1, 9, 2, 7, 0, 4, 8, 5, 3],
  [2, 5, 0, 8, 3, 7, 9, 1, 4, 6],
  [7, 0, 4, 1, 9, 3, 6, 2, 8, 5],
];

export default function ShuffleSwirl({
  visible,
  onDone,
  size = DEFAULT_SIZE,
  cardWidth = DEFAULT_CARD_WIDTH,
  anchor = null,
}: ShuffleSwirlProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const phase = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);

  const effectiveCardWidth = Math.min(cardWidth, 170);
  const effectiveSize = Math.min(size, 360);
  const cardHeight = effectiveCardWidth * 1.5;
  const slots = useMemo(() => {
    return Array.from({ length: CARD_COUNT }).map((_, index) => {
      const offsetFromCenter = index - (CARD_COUNT - 1) / 2;
      return {
        x: offsetFromCenter * effectiveCardWidth * 0.14,
        y: spacing.md + -Math.abs(offsetFromCenter) * 5,
        rot: 10 - (20 / 9) * index,
      };
    });
  }, [effectiveCardWidth]);

  useEffect(() => {
    if (!visible) {
      animationRef.current?.stop();
      phase.setValue(0);
      setCycleIndex(0);
      return;
    }

    const runCycle = (index: number) => {
      setCycleIndex(index);
      phase.setValue(0);
      const animation = Animated.sequence([
        Animated.timing(phase, {
          toValue: 1,
          duration: CYCLE_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration: CYCLE_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(HOLD_BETWEEN),
      ]);
      animationRef.current = animation;
      animation.start(({ finished }) => {
        if (!finished) {
          return;
        }
        if (index < CYCLES - 1) {
          runCycle(index + 1);
          return;
        }
        onDone?.();
      });
    };

    runCycle(0);

    return () => {
      animationRef.current?.stop();
    };
  }, [onDone, phase, visible]);

  const cardStyles = useMemo(() => {
    return Array.from({ length: CARD_COUNT }).map((_, index) => {
      const fromSlot = index;
      const toSlot = TOS[cycleIndex][index];
      const from = slots[fromSlot];
      const to = slots[toSlot];
      const phaseShift = (index - (CARD_COUNT - 1) / 2) * 0.02;
      const staggeredPhase = Animated.diffClamp(
        Animated.add(phase, phaseShift),
        0,
        1
      );
      const lift = 12 + (index % 3) * 2;
      const swoop = index % 2 === 0 ? 2 : -2;
      const midPhase = staggeredPhase.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0],
      });
      const depthBias = index % 2 === 0 ? 1 : -1;
      const depthScale = index % 2 === 0 ? -0.01 : 0.015;

      const translateX = staggeredPhase.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [from.x, to.x + swoop, from.x],
      });
      const translateY = staggeredPhase.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [from.y, to.y - lift, from.y],
      });
      const rotateZ = staggeredPhase.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [`${from.rot}deg`, `${to.rot}deg`, `${from.rot}deg`],
      });
      const scale = Animated.add(1, Animated.multiply(midPhase, depthScale));
      const stackedTranslateY = Animated.add(
        translateY,
        Animated.multiply(midPhase, depthBias)
      );

      return {
        opacity: staggeredPhase.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, index % 2 === 0 ? 0.97 : 0.99, 1],
        }),
        zIndex: (cycleIndex === CYCLES - 1 ? fromSlot : toSlot) + 1,
        transform: [
          { translateX },
          { translateY: stackedTranslateY },
          { rotateZ },
          { scale },
        ],
      } satisfies Animated.WithAnimatedObject<ImageStyle>;
    });
  }, [cycleIndex, phase, slots]);

  if (!visible) {
    return null;
  }

  const anchorCenterX = anchor ? anchor.x + anchor.w / 2 : windowWidth / 2;
  const anchorCenterY = anchor ? anchor.y + anchor.h / 2 : windowHeight / 2;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View
        style={[
          styles.stage,
          {
            width: effectiveSize,
            height: effectiveSize,
            left: anchorCenterX,
            top: anchorCenterY,
            transform: [
              { translateX: -effectiveSize / 2 },
              { translateY: -effectiveSize / 2 },
            ],
          },
        ]}
      >
        <View style={styles.glow} />
        {cardStyles.map((style, index) => {
          if (index % 2 !== 0) {
            return null;
          }
          return (
            <Animated.Image
              key={`shuffle-card-under-${index}`}
              source={cardBackImage}
              style={[
                styles.card,
                { width: effectiveCardWidth, height: cardHeight },
                style,
              ]}
              resizeMode="cover"
            />
          );
        })}
        {cardStyles.map((style, index) => {
          if (index % 2 === 0) {
            return null;
          }
          return (
            <Animated.Image
              key={`shuffle-card-over-${index}`}
              source={cardBackImage}
              style={[
                styles.card,
                { width: effectiveCardWidth, height: cardHeight },
                style,
              ]}
              resizeMode="cover"
            />
          );
        })}
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
    position: "absolute",
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
