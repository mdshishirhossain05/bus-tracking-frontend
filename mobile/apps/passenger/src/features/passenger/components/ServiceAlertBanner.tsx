import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import {
  GlassSurface,
  Text,
  Icon,
  colors,
  spacing,
  radius,
  listActiveAlerts,
  type IconName,
  type ServiceAlert,
  type ServiceAlertSeverity,
} from "@ubts/shared";

const SEVERITY_STYLE: Record<
  ServiceAlertSeverity,
  { icon: IconName; tint: string }
> = {
  INFO: { icon: "information-circle", tint: colors.primary },
  WARNING: { icon: "warning", tint: colors.warning },
  CRITICAL: { icon: "alert-circle", tint: colors.danger },
};

const REFRESH_MS = 5 * 60 * 1000;

interface ServiceAlertBannerProps {
  routeId?: string | null;
}

export function ServiceAlertBanner({ routeId }: ServiceAlertBannerProps) {
  const [alerts, setAlerts] = useState<ServiceAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listActiveAlerts(routeId ?? undefined);
      setAlerts(data);
    } catch {
      // Alerts are non-critical; the rest of the app keeps working.
    }
  }, [routeId]);

  useEffect(() => {
    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const visible = alerts.filter((a) => !dismissedIds.has(a.id));
  if (visible.length === 0) return null;

  const top = visible[0];
  const style = SEVERITY_STYLE[top.severity];

  const dismiss = (id: string) => {
    void Haptics.selectionAsync();
    setDismissedIds((prev) => new Set(prev).add(id));
    if (visible.length === 1) setExpanded(false);
  };

  const toggleExpand = () => {
    if (visible.length === 1) return;
    void Haptics.selectionAsync();
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggleExpand}>
        <GlassSurface style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: `${style.tint}22` }]}>
            <Icon name={style.icon} size={18} color={style.tint} />
          </View>
          <View style={styles.flex}>
            <Text variant="label" color={colors.foreground} numberOfLines={1}>
              {top.title}
            </Text>
            <Text
              variant="caption"
              color={colors.mutedForeground}
              numberOfLines={expanded ? undefined : 1}
            >
              {top.body}
            </Text>
          </View>
          {visible.length > 1 ? (
            <View style={styles.countBadge}>
              <Text variant="caption" color={colors.foreground}>
                +{visible.length - 1}
              </Text>
            </View>
          ) : null}
          <Pressable onPress={() => dismiss(top.id)} hitSlop={10}>
            <Icon
              name="close"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        </GlassSurface>
      </Pressable>

      {expanded && visible.length > 1
        ? visible.slice(1).map((a) => {
            const s = SEVERITY_STYLE[a.severity];
            return (
              <GlassSurface key={a.id} style={styles.subCard}>
                <View style={[styles.iconWrap, { backgroundColor: `${s.tint}22` }]}>
                  <Icon name={s.icon} size={16} color={s.tint} />
                </View>
                <View style={styles.flex}>
                  <Text
                    variant="label"
                    color={colors.foreground}
                    numberOfLines={1}
                  >
                    {a.title}
                  </Text>
                  <Text
                    variant="caption"
                    color={colors.mutedForeground}
                    numberOfLines={2}
                  >
                    {a.body}
                  </Text>
                </View>
                <Pressable onPress={() => dismiss(a.id)} hitSlop={10}>
                  <Icon
                    name="close"
                    size={14}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </GlassSurface>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  subCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1, gap: 1 },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
});
