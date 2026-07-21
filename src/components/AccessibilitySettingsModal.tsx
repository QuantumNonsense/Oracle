import { useCallback } from "react";
import {
  AccessibilityInfo,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAccessibility } from "../accessibility/AccessibilityProvider";
import type { ColorVisionMode } from "../accessibility/preferences";
import { radii, spacing } from "../theme";
import Text from "./AccessibleText";

const modeOptions: Array<{ value: ColorVisionMode; label: string }> = [
  { value: "default", label: "Default" },
  { value: "redGreen", label: "Red-Green Support" },
  { value: "blueYellow", label: "Blue-Yellow Support" },
  { value: "highContrast", label: "High Contrast" },
];

type Props = { visible: boolean; onClose: () => void };

export default function AccessibilitySettingsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const previewCardWidth = Math.min(
    300,
    Math.max(220, windowWidth - spacing.lg * 4),
  );
  const {
    preferences,
    colors,
    bodyTextStyle,
    headingTextStyle,
    setColorVisionMode,
    setDyslexiaFriendlyText,
    setLargerText,
  } = useAccessibility();

  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const selectMode = (value: ColorVisionMode, label: string) => {
    setColorVisionMode(value);
    announce(`${label} mode selected`);
  };

  const switchColors = {
    false: colors.disabled,
    true: colors.selected,
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        style={[
          styles.backdrop,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.title,
                  { color: colors.textPrimary },
                  headingTextStyle,
                ]}
              >
                Accessibility
              </Text>
              <Text style={[{ color: colors.textSecondary }, bodyTextStyle]}>
                Adjust presentation while keeping your cards and readings unchanged.
              </Text>
            </View>
            <Pressable
              accessibilityHint="Returns to the main Settings menu"
              accessibilityLabel="Close Accessibility settings"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { borderColor: colors.border, backgroundColor: colors.surface },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.closeText, { color: colors.textPrimary }]}>×</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[{ color: colors.textPrimary }, headingTextStyle]}
            >
              Color Vision Mode
            </Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }, bodyTextStyle]}>
              Changes interface colors and contrast. Card artwork is not altered.
            </Text>
            <View accessibilityRole="radiogroup" style={styles.options}>
              {modeOptions.map((option) => {
                const selected = preferences.colorVisionMode === option.value;
                return (
                  <Pressable
                    accessibilityHint="Applies this color presentation immediately"
                    accessibilityLabel={`${option.label} mode`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, selected }}
                    key={option.value}
                    onPress={() => selectMode(option.value, option.label)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: selected
                          ? colors.surfaceElevated
                          : colors.surface,
                        borderColor: selected ? colors.selected : colors.border,
                        borderWidth: selected ? 3 : 1,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      accessibilityElementsHidden
                      style={[
                        styles.radio,
                        { borderColor: selected ? colors.selected : colors.border },
                      ]}
                    >
                      {selected ? (
                        <Text style={[styles.check, { color: colors.selected }]}>✓</Text>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: colors.textPrimary },
                        bodyTextStyle,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selected ? (
                      <Text style={[styles.selectedLabel, { color: colors.selected }]}>Selected</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <SettingSwitch
              bodyTextStyle={bodyTextStyle}
              colors={colors}
              label="Dyslexia-Friendly Text"
              hint="Uses Atkinson Hyperlegible with more comfortable spacing"
              onChange={(enabled) => {
                setDyslexiaFriendlyText(enabled);
                announce(`Dyslexia-Friendly Text ${enabled ? "on" : "off"}`);
              }}
              switchColors={switchColors}
              value={preferences.dyslexiaFriendlyText}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingSwitch
              bodyTextStyle={bodyTextStyle}
              colors={colors}
              label="Larger Text"
              hint="Increases functional and body text while preserving hierarchy"
              onChange={(enabled) => {
                setLargerText(enabled);
                announce(`Larger Text ${enabled ? "on" : "off"}`);
              }}
              switchColors={switchColors}
              value={preferences.largerText}
            />
          </View>

          <View
            style={[
              styles.preview,
              { borderColor: colors.border },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[
                { color: colors.textSecondary },
                bodyTextStyle,
                styles.previewLabel,
              ]}
            >
              Card Description Preview
            </Text>
            <ImageBackground
              source={require("../../assets/cards/MycelialDescription.png")}
              resizeMode="stretch"
              style={[
                styles.previewCard,
                {
                  width: previewCardWidth,
                  height: previewCardWidth * (1071 / 771),
                },
              ]}
              imageStyle={styles.previewCardImage}
            >
              <Text
                accessibilityRole="header"
                style={[
                  { color: "#2B0A00" },
                  headingTextStyle,
                  styles.previewTitle,
                ]}
              >
                Many Ways of Knowing
              </Text>
              <View
                style={[
                  styles.previewDivider,
                  { backgroundColor: "rgba(43, 10, 0, 0.28)" },
                ]}
              />
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.previewScroll}
                contentContainerStyle={styles.previewScrollContent}
              >
                <Text
                  style={[
                    { color: "#2B0A00" },
                    headingTextStyle,
                    styles.previewHeading,
                  ]}
                >
                  Meaning
                </Text>
                <Text
                  style={[
                    { color: "#2B0A00" },
                    bodyTextStyle,
                    styles.previewBody,
                  ]}
                >
                  Accessibility makes room for the many ways people perceive,
                  understand, and move through the world. Different abilities
                  bring distinct wisdom, creativity, and beauty.
                </Text>
                <Text
                  style={[
                    { color: "#2B0A00" },
                    headingTextStyle,
                    styles.previewSectionHeading,
                  ]}
                >
                  Reflection
                </Text>
                <Text
                  style={[
                    { color: "#2B0A00" },
                    bodyTextStyle,
                    styles.previewBody,
                  ]}
                >
                  What helps you experience the world most fully?
                </Text>
              </ScrollView>
            </ImageBackground>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function SettingSwitch({
  label,
  hint,
  value,
  onChange,
  colors,
  bodyTextStyle,
  switchColors,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  colors: ReturnType<typeof useAccessibility>["colors"];
  bodyTextStyle: ReturnType<typeof useAccessibility>["bodyTextStyle"];
  switchColors: { false: string; true: string };
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={[styles.switchLabel, { color: colors.textPrimary }, bodyTextStyle]}>
          {label}
        </Text>
        <Text style={[styles.switchHint, { color: colors.textSecondary }, bodyTextStyle]}>
          {hint}
        </Text>
      </View>
      <Switch
        accessibilityHint={hint}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        ios_backgroundColor={switchColors.false}
        onValueChange={onChange}
        thumbColor={Platform.OS === "android" ? colors.textPrimary : undefined}
        trackColor={switchColors}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 620,
    padding: spacing.lg,
    width: "100%",
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  title: { fontSize: 28 },
  closeButton: {
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  closeText: { fontSize: 30, lineHeight: 32 },
  section: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.md },
  helpText: { marginTop: spacing.xs },
  options: { gap: spacing.sm, marginTop: spacing.md },
  option: {
    alignItems: "center",
    borderRadius: radii.md,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  radio: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  check: { fontSize: 17, fontWeight: "800" },
  optionLabel: { flex: 1, marginLeft: spacing.sm },
  selectedLabel: { fontSize: 13, fontWeight: "700", marginLeft: spacing.xs },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 64,
    paddingVertical: spacing.xs,
  },
  switchCopy: { flex: 1, paddingRight: spacing.md },
  switchLabel: { fontWeight: "700" },
  switchHint: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, opacity: 0.55 },
  preview: {
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  previewLabel: {
    alignSelf: "center",
    fontWeight: "700",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  previewCard: {
    alignSelf: "center",
    borderRadius: 22,
    overflow: "hidden",
    paddingHorizontal: 30,
    paddingTop: 38,
    paddingBottom: 34,
  },
  previewCardImage: { borderRadius: 22 },
  previewTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  previewDivider: {
    alignSelf: "center",
    height: 1,
    marginVertical: spacing.md,
    opacity: 0.7,
    width: "72%",
  },
  previewHeading: { fontWeight: "700", textAlign: "center" },
  previewSectionHeading: {
    fontWeight: "700",
    marginTop: spacing.lg,
    textAlign: "center",
  },
  previewScroll: { flex: 1 },
  previewScrollContent: { paddingBottom: spacing.md },
  previewBody: {
    flexShrink: 1,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  pressed: { opacity: 0.78 },
});
