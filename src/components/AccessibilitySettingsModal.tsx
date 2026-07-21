import { useCallback } from "react";
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAccessibility } from "../accessibility/AccessibilityProvider";
import type { ColorVisionMode } from "../accessibility/preferences";
import { radii, spacing } from "../theme";

const modeOptions: Array<{ value: ColorVisionMode; label: string }> = [
  { value: "default", label: "Default" },
  { value: "redGreen", label: "Red-Green Support" },
  { value: "blueYellow", label: "Blue-Yellow Support" },
  { value: "highContrast", label: "High Contrast" },
];

type Props = { visible: boolean; onClose: () => void };

export default function AccessibilitySettingsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
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
            accessible
            accessibilityLabel="Accessibility Preview. Growth takes many forms. Choose the presentation that feels clearest and most comfortable to you. Selected example. Confirmed."
            style={[
              styles.preview,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[{ color: colors.textPrimary }, headingTextStyle]}
            >
              Accessibility Preview
            </Text>
            <Text style={[styles.previewBody, { color: colors.textSecondary }, bodyTextStyle]}>
              Growth takes many forms. Choose the presentation that feels clearest and most comfortable to you.
            </Text>
            <View style={styles.previewIndicators}>
              <View
                style={[
                  styles.previewPill,
                  { borderColor: colors.selected, backgroundColor: colors.surface },
                ]}
              >
                <Text style={[styles.indicatorText, { color: colors.textPrimary }]}>✓ Selected</Text>
              </View>
              <View
                style={[
                  styles.previewPill,
                  { borderColor: colors.success, backgroundColor: colors.surface },
                ]}
              >
                <Text style={[styles.indicatorText, { color: colors.textPrimary }]}>✓ Confirmed</Text>
              </View>
            </View>
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
  preview: { borderRadius: radii.lg, borderWidth: 2, padding: spacing.md },
  previewBody: { marginTop: spacing.sm },
  previewIndicators: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  previewPill: { borderRadius: 999, borderWidth: 2, paddingHorizontal: 12, paddingVertical: 8 },
  indicatorText: { fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.78 },
});
