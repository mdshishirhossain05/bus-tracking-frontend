import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  GlassSurface,
  Icon,
  Text,
  colors,
  radius,
  spacing,
  useT,
} from "@ubts/shared";

interface LayersFABProps {
  hybrid: boolean;
  onHybridChange: (value: boolean) => void;
  traffic: boolean;
  onTrafficChange: (value: boolean) => void;
  darkMap: boolean;
  onDarkMapChange: (value: boolean) => void;
}

/**
 * Floating button that opens a bottom sheet with three map view toggles:
 *   - hybrid view (satellite imagery + labels)
 *   - Google's live traffic overlay
 *   - dark Google Maps style (default is the standard bright look)
 *
 * All preferences come from useMapPrefs so they persist across launches.
 * The FAB itself tints to primary when any layer is active so passengers
 * can see at a glance that they have a non-default map setup on.
 */
export function LayersFAB({
  hybrid,
  onHybridChange,
  traffic,
  onTrafficChange,
  darkMap,
  onDarkMapChange,
}: LayersFABProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const onToggleHybrid = (value: boolean) => {
    void Haptics.selectionAsync();
    onHybridChange(value);
  };
  const onToggleTraffic = (value: boolean) => {
    void Haptics.selectionAsync();
    onTrafficChange(value);
  };
  const onToggleDarkMap = (value: boolean) => {
    void Haptics.selectionAsync();
    onDarkMapChange(value);
  };

  const anyActive = hybrid || traffic || darkMap;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("map.layers.title")}
      >
        <GlassSurface rounded="pill" style={styles.fab}>
          <Icon
            name="layers-outline"
            size={20}
            color={anyActive ? colors.primary : colors.foreground}
          />
        </GlassSurface>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <SafeAreaView style={styles.sheetWrap} edges={["bottom"]}>
            <Pressable onPress={() => undefined}>
              <View style={styles.sheet}>
                <Text variant="subtitle" color={colors.foreground}>
                  {t("map.layers.title")}
                </Text>

                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text variant="label" color={colors.foreground}>
                      {t("map.layers.hybrid")}
                    </Text>
                    <Text variant="caption" color={colors.mutedForeground}>
                      {t("map.layers.hybridHelp")}
                    </Text>
                  </View>
                  <Switch
                    value={hybrid}
                    onValueChange={onToggleHybrid}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor={colors.foreground}
                    accessibilityLabel={t("map.layers.hybrid")}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text variant="label" color={colors.foreground}>
                      {t("map.layers.traffic")}
                    </Text>
                    <Text variant="caption" color={colors.mutedForeground}>
                      {t("map.layers.trafficHelp")}
                    </Text>
                  </View>
                  <Switch
                    value={traffic}
                    onValueChange={onToggleTraffic}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor={colors.foreground}
                    accessibilityLabel={t("map.layers.traffic")}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text variant="label" color={colors.foreground}>
                      {t("map.layers.dark")}
                    </Text>
                    <Text variant="caption" color={colors.mutedForeground}>
                      {t("map.layers.darkHelp")}
                    </Text>
                  </View>
                  <Switch
                    value={darkMap}
                    onValueChange={onToggleDarkMap}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor={colors.foreground}
                    accessibilityLabel={t("map.layers.dark")}
                    disabled={hybrid}
                  />
                </View>
              </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheetWrap: { width: "100%" },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowText: { flex: 1, gap: 2 },
});
