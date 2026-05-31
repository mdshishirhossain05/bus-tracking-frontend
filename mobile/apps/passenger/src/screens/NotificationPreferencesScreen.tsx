import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Text,
  Icon,
  IconButton,
  Skeleton,
  SkeletonGroup,
  EmptyState,
  StatusBadge,
  colors,
  radius,
  spacing,
  getNotificationPreferences,
  updateNotificationPreferences,
  listStopSubscriptions,
  toggleStopSubscription,
  deleteStopSubscription,
  type NotificationPreferences,
  type StopSubscription,
  type IconName,
} from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";

type QuietPreset = "off" | "night1" | "night2" | "custom";

const PRESETS: Record<
  QuietPreset,
  { label: string; start: number | null; end: number | null }
> = {
  off: { label: "Off", start: null, end: null },
  night1: { label: "10 PM — 7 AM", start: 22 * 60, end: 7 * 60 },
  night2: { label: "11 PM — 6 AM", start: 23 * 60, end: 6 * 60 },
  custom: { label: "Custom", start: null, end: null },
};

function presetFor(prefs: NotificationPreferences): QuietPreset {
  if (prefs.quietHoursStartMin == null || prefs.quietHoursEndMin == null) {
    return "off";
  }
  if (
    prefs.quietHoursStartMin === PRESETS.night1.start &&
    prefs.quietHoursEndMin === PRESETS.night1.end
  ) {
    return "night1";
  }
  if (
    prefs.quietHoursStartMin === PRESETS.night2.start &&
    prefs.quietHoursEndMin === PRESETS.night2.end
  ) {
    return "night2";
  }
  return "custom";
}

function formatMinute(value: number | null): string {
  if (value == null) return "—";
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name={icon} size={15} color={colors.mutedForeground} />
        <Text variant="caption" color={colors.mutedForeground} style={styles.cardTitle}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function PresetChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.preset, active && styles.presetActive]}
    >
      <Text
        variant="label"
        color={active ? colors.primaryForeground : colors.foreground}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function clampMinute(value: number): number {
  if (value < 0) return 1439 + (value % 1440);
  return value % 1440;
}

function HourStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text variant="caption" color={colors.faintForeground}>
        {label}
      </Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onChange(clampMinute(value - 30));
          }}
          style={styles.stepBtn}
          hitSlop={6}
        >
          <Icon name="remove" size={16} color={colors.foreground} />
        </Pressable>
        <Text variant="subtitle" color={colors.foreground} tabular>
          {formatMinute(value)}
        </Text>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onChange(clampMinute(value + 30));
          }}
          style={styles.stepBtn}
          hitSlop={6}
        >
          <Icon name="add" size={16} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

export function NotificationPreferencesScreen() {
  const { goBack } = useNav();
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [subs, setSubs] = useState<StopSubscription[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        getNotificationPreferences(),
        listStopSubscriptions(),
      ]);
      setPrefs(p);
      setSubs(s);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Couldn't load notification settings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePrefs = useCallback(
    async (next: Partial<NotificationPreferences>) => {
      if (!prefs) return;
      const merged = { ...prefs, ...next };
      setPrefs(merged);
      setSavingPrefs(true);
      try {
        const updated = await updateNotificationPreferences(next);
        setPrefs(updated);
        void Haptics.selectionAsync();
      } catch (e: any) {
        setError(
          e?.response?.data?.message ?? "Couldn't save those preferences.",
        );
        // Restore prior state on failure.
        await load();
      } finally {
        setSavingPrefs(false);
      }
    },
    [load, prefs],
  );

  const applyPreset = useCallback(
    async (key: QuietPreset) => {
      const p = PRESETS[key];
      if (key === "custom") {
        // Seed custom with sensible defaults if user is coming from "Off".
        if (prefs?.quietHoursStartMin == null) {
          await savePrefs({
            quietHoursStartMin: 22 * 60,
            quietHoursEndMin: 7 * 60,
          });
        }
        return;
      }
      await savePrefs({
        quietHoursStartMin: p.start,
        quietHoursEndMin: p.end,
      });
    },
    [prefs, savePrefs],
  );

  const onToggleSub = useCallback(
    async (sub: StopSubscription, enabled: boolean) => {
      setSubs((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, enabled } : s)),
      );
      try {
        await toggleStopSubscription(sub.routeId, sub.stopId, enabled);
        void Haptics.selectionAsync();
      } catch {
        setError("Couldn't update that alert. Try again.");
        await load();
      }
    },
    [load],
  );

  const onDeleteSub = useCallback(
    async (sub: StopSubscription) => {
      setSubs((prev) => prev.filter((s) => s.id !== sub.id));
      try {
        await deleteStopSubscription(sub.routeId, sub.stopId);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        setError("Couldn't remove that alert. Try again.");
        await load();
      }
    },
    [load],
  );

  const currentPreset = prefs ? presetFor(prefs) : "off";
  const inCustomMode = currentPreset === "custom";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <IconButton name="chevron-back" onPress={goBack} />
        <Text variant="subtitle" color={colors.foreground}>
          Notifications
        </Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <SkeletonGroup gap={16}>
            <Skeleton width="100%" height={92} rounded="lg" />
            <Skeleton width="100%" height={180} rounded="lg" />
            <Skeleton width="100%" height={120} rounded="lg" />
          </SkeletonGroup>
        ) : (
          <>
            <Section icon="notifications-outline" title="GENERAL">
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text variant="label" color={colors.foreground}>
                    Push notifications
                  </Text>
                  <Text variant="caption" color={colors.mutedForeground}>
                    Master switch — turn off to silence every alert.
                  </Text>
                </View>
                <Switch
                  value={prefs?.notificationsEnabled ?? true}
                  disabled={savingPrefs || !prefs}
                  onValueChange={(value) =>
                    void savePrefs({ notificationsEnabled: value })
                  }
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={colors.foreground}
                />
              </View>
            </Section>

            <Section icon="moon-outline" title="QUIET HOURS">
              <View style={styles.presetGrid}>
                {(Object.keys(PRESETS) as QuietPreset[]).map((key) => (
                  <PresetChip
                    key={key}
                    label={PRESETS[key].label}
                    active={currentPreset === key}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      void applyPreset(key);
                    }}
                  />
                ))}
              </View>

              {inCustomMode && prefs ? (
                <View style={styles.steppers}>
                  <HourStepper
                    label="From"
                    value={prefs.quietHoursStartMin ?? 22 * 60}
                    onChange={(value) =>
                      void savePrefs({ quietHoursStartMin: value })
                    }
                  />
                  <HourStepper
                    label="Until"
                    value={prefs.quietHoursEndMin ?? 7 * 60}
                    onChange={(value) =>
                      void savePrefs({ quietHoursEndMin: value })
                    }
                  />
                </View>
              ) : null}

              <Text
                variant="caption"
                color={colors.mutedForeground}
                style={styles.helpText}
              >
                During quiet hours, you'll get no pushes — alerts still pile
                up in the in-app feed.
              </Text>
            </Section>

            <Section icon="alarm-outline" title="STOP ALERTS">
              {subs.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <EmptyState
                    icon="bus-outline"
                    title="No stop alerts yet"
                    subtitle="Open a route and tap the bell next to a stop to get a heads-up before the bus arrives."
                  />
                </View>
              ) : (
                subs.map((sub, i) => (
                  <View
                    key={sub.id}
                    style={[
                      styles.subRow,
                      i === subs.length - 1 && styles.subRowLast,
                    ]}
                  >
                    <View style={styles.flex}>
                      <Text variant="label" color={colors.foreground}>
                        {sub.stopName}
                      </Text>
                      <View style={styles.subMeta}>
                        <Text
                          variant="caption"
                          color={colors.mutedForeground}
                        >
                          {sub.routeName}
                        </Text>
                        <StatusBadge
                          tone={sub.enabled ? "live" : "muted"}
                          label={`${sub.leadTimeMinutes}m before`}
                          withDot={sub.enabled}
                        />
                      </View>
                    </View>
                    <Switch
                      value={sub.enabled}
                      onValueChange={(value) => void onToggleSub(sub, value)}
                      trackColor={{ false: colors.muted, true: colors.primary }}
                      thumbColor={colors.foreground}
                    />
                    <Pressable
                      onPress={() => void onDeleteSub(sub)}
                      hitSlop={8}
                      style={styles.deleteBtn}
                    >
                      <Icon
                        name="trash-outline"
                        size={18}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                ))
              )}
            </Section>

            {error ? (
              <Text variant="caption" color={colors.danger} style={styles.center}>
                {error}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  spacer: { width: 44 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  cardTitle: { letterSpacing: 1.2 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.muted,
    borderRadius: radius.pill,
  },
  presetActive: { backgroundColor: colors.primary },
  steppers: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stepper: { flex: 1, gap: spacing.xs },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: { marginTop: spacing.xs },
  emptyWrap: { paddingVertical: spacing.lg },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  subRowLast: { borderBottomWidth: 0 },
  subMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
});
