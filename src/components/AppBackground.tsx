import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

export default function AppBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.vignette} />
      <View style={styles.mistMatcha} />
      <View style={styles.mistLavender} />
      <View style={styles.mistPeach} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  vignette: {
    position: "absolute",
    width: 540,
    height: 540,
    borderRadius: 270,
    backgroundColor: colors.surface,
    opacity: 0.25,
    top: "12%",
    alignSelf: "center",
    shadowColor: colors.surface,
    shadowOpacity: 0.35,
    shadowRadius: 70,
    shadowOffset: { width: 0, height: 24 },
    elevation: 8,
  },
  mistMatcha: {
    position: "absolute",
    width: 420,
    height: 320,
    borderRadius: 220,
    backgroundColor: colors.primary,
    opacity: 0.06,
    bottom: "-6%",
    left: "-10%",
    transform: [{ scaleX: 1.2 }, { scaleY: 0.9 }],
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  mistLavender: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 240,
    backgroundColor: colors.accentLavender,
    opacity: 0.06,
    top: "-4%",
    right: "-12%",
    transform: [{ scaleX: 1.1 }, { scaleY: 1.25 }],
    shadowColor: colors.accentLavender,
    shadowOpacity: 0.22,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  mistPeach: {
    position: "absolute",
    width: 300,
    height: 240,
    borderRadius: 200,
    backgroundColor: colors.accentPeach,
    opacity: 0.05,
    top: "38%",
    left: "-6%",
    transform: [{ scaleX: 1.25 }, { scaleY: 0.9 }],
    shadowColor: colors.accentPeach,
    shadowOpacity: 0.2,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
});
