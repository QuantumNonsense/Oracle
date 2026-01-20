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
import { colors, radii, shadow, spacing } from "../theme";

type ShuffleSwirlProps = {
  visible: boolean;
  onDone?: () => void;
  size?: number;
  cardWidth?: number;
  anchor?: { x: number; y: number; w: number; h: number } | null;
  baseY?: number;
};

const DEFAULT_SIZE = 260;
const DEFAULT_CARD_WIDTH = 140;
const CARD_COUNT = 8;
const COLLAPSE_DURATION = 550;
const HOLD_BEFORE_SHAKE = 40;
const SHAKE_DURATION = 1;
const HOLD_AFTER_SHAKE = 40;
const EXPAND_DURATION = 550;
const SHAKE_STEPS = 6;
const SWIRL_DURATION = 800;
const SWIRL_STEPS = 8;
const SWIRL_RESET_DURATION = 1;

export const SHUFFLE_TIMING = {
  COLLAPSE_DURATION,
  HOLD_BEFORE_SHAKE,
  SHAKE_DURATION,
  HOLD_AFTER_SHAKE,
  SWIRL_DURATION,
  SWIRL_RESET_DURATION,
  EXPAND_DURATION,
};

export default function ShuffleSwirl({
  visible,
  onDone,
  size = DEFAULT_SIZE,
  cardWidth = DEFAULT_CARD_WIDTH,
  anchor = null,
  baseY,
}: ShuffleSwirlProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const collapsePhase = useRef(new Animated.Value(0)).current;
  const shakePhase = useRef(new Animated.Value(0)).current;
  const swirlT = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const effectiveCardWidth = Math.min(cardWidth, 170);
  const effectiveSize = Math.min(size, 360);
  const cardHeight = effectiveCardWidth * 1.5;
  const fanBaseY = baseY ?? spacing.lg * 1.125;
  const swirlRadius = useMemo(
    () => Math.min(effectiveCardWidth * 0.28, 70),
    [effectiveCardWidth]
  );
  const slots = useMemo(() => {
    return Array.from({ length: CARD_COUNT }).map((_, index) => {
      const virtualIndex = index + 1;
      const offsetFromCenter = virtualIndex - 4.5;
      return {
        x: offsetFromCenter * effectiveCardWidth * 0.18,
        y: fanBaseY + -Math.abs(offsetFromCenter) * 6,
        rot: 12 - (24 / 9) * virtualIndex,
      };
    });
  }, [effectiveCardWidth, fanBaseY]);

  useEffect(() => {
    if (!visible) {
      animationRef.current?.stop();
      collapsePhase.setValue(0);
      shakePhase.setValue(0);
      swirlT.setValue(0);
      return;
    }

    collapsePhase.setValue(0);
    shakePhase.setValue(0);
    swirlT.setValue(0);

    const stepDuration = SHAKE_DURATION / (SHAKE_STEPS * 2);
    const shakeSteps = Array.from({ length: SHAKE_STEPS }).flatMap(() => [
      Animated.timing(shakePhase, {
        toValue: 1,
        duration: stepDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakePhase, {
        toValue: 0,
        duration: stepDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);

    const animation = Animated.sequence([
      Animated.timing(collapsePhase, {
        toValue: 1,
        duration: COLLAPSE_DURATION,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_BEFORE_SHAKE),
      Animated.sequence(shakeSteps),
      Animated.delay(HOLD_AFTER_SHAKE),
      Animated.timing(swirlT, {
        toValue: 1,
        duration: SWIRL_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(swirlT, {
        toValue: 0,
        duration: SWIRL_RESET_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(swirlT, {
        toValue: 1,
        duration: SWIRL_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(swirlT, {
        toValue: 0,
        duration: SWIRL_RESET_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(collapsePhase, {
        toValue: 0,
        duration: EXPAND_DURATION,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]);

    animationRef.current = animation;
    animation.start(({ finished }) => {
      if (finished) {
        onDone?.();
      }
    });

    return () => {
      animationRef.current?.stop();
    };
  }, [collapsePhase, onDone, shakePhase, swirlT, visible]);

  const cardStyles = useMemo(() => {
    const swirlIndices = [CARD_COUNT - 1, CARD_COUNT - 2, CARD_COUNT - 3];
    const swirlPhase = swirlT.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0],
    });
    const stepInput = Array.from({ length: SWIRL_STEPS + 1 }).map(
      (_, step) => step / SWIRL_STEPS
    );

    return Array.from({ length: CARD_COUNT }).map((_, index) => {
      const from = slots[index];
      const centerOffset = index - (CARD_COUNT - 1) / 2;
      const stackX = centerOffset * 0.6 - effectiveCardWidth / 2;
      const stackY = fanBaseY + (index % 2 === 0 ? -0.4 : 0.4);
      const stackRot = centerOffset * 0.6;
      const depthScale = index % 2 === 0 ? -0.008 : 0.01;
      const isSwirl = swirlIndices.includes(index);

      const translateX = collapsePhase.interpolate({
        inputRange: [0, 1],
        outputRange: [from.x - effectiveCardWidth / 2, stackX],
      });
      const translateY = collapsePhase.interpolate({
        inputRange: [0, 1],
        outputRange: [from.y, stackY],
      });
      const rotateZ = collapsePhase.interpolate({
        inputRange: [0, 1],
        outputRange: [`${from.rot}deg`, `${stackRot}deg`],
      });
      const scale = Animated.add(
        1,
        Animated.multiply(collapsePhase, depthScale)
      );
      const shakeX = Animated.multiply(
        collapsePhase,
        shakePhase.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, -3, 3, -2, 0],
        })
      );
      const shakeY = Animated.multiply(
        collapsePhase,
        shakePhase.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, 2, -2, 1, 0],
        })
      );
      const phaseOffset = swirlIndices.indexOf(index) * ((Math.PI * 2) / 3);
      const swirlXBase = isSwirl
        ? swirlT.interpolate({
            inputRange: stepInput,
            outputRange: stepInput.map(
              (step) => Math.cos(step * Math.PI * 2 + phaseOffset) * swirlRadius
            ),
          })
        : Animated.multiply(swirlT, 0);
      const swirlYBase = isSwirl
        ? swirlT.interpolate({
            inputRange: stepInput,
            outputRange: stepInput.map(
              (step) =>
                Math.sin(step * Math.PI * 2 + phaseOffset) * swirlRadius * 0.65
            ),
          })
        : Animated.multiply(swirlT, 0);
      const swirlX = Animated.multiply(swirlPhase, swirlXBase);
      const swirlY = Animated.multiply(swirlPhase, swirlYBase);
      const swirlRotate = isSwirl
        ? swirlT.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ["0deg", "6deg", "0deg"],
          })
        : "0deg";

      return {
        opacity: collapsePhase.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.995],
        }),
        zIndex: index + 1,
        transform: [
          {
            translateX: Animated.add(translateX, Animated.add(shakeX, swirlX)),
          },
          {
            translateY: Animated.add(translateY, Animated.add(shakeY, swirlY)),
          },
          { rotateZ },
          { rotate: swirlRotate },
          { scale },
        ],
      } satisfies Animated.WithAnimatedObject<ImageStyle>;
    });
  }, [collapsePhase, shakePhase, slots, swirlRadius, swirlT]);

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
  card: {
    position: "absolute",
    left: "50%",
    top: "50%",
    borderRadius: radii.lg,
    overflow: "hidden",
  },
});
