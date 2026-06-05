import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing, Icon, Text, useT } from "@ubts/shared";
import type { ConnectionStatus } from "@ubts/shared";

const STABLE_MS = 6000;
const FRESH_DATA_MS = 45_000;

/**
 * Shows when the socket is disconnected/errored AND no live data has
 * arrived recently. The socket flapping is normal in mobile networks —
 * we only surface "offline" when the user actually loses ground truth.
 */
export function OfflineBanner({
  status,
  lastLiveUpdatedAt,
}: {
  status: ConnectionStatus;
  lastLiveUpdatedAt?: string | null;
}) {
  const t = useT();
  const [show, setShow] = useState(false);

  const socketDown =
    status === "disconnected" ||
    status === "error" ||
    status === "stale" ||
    status === "reconnecting";

  const dataAgeMs = lastLiveUpdatedAt
    ? Date.now() - new Date(lastLiveUpdatedAt).getTime()
    : Number.POSITIVE_INFINITY;
  const dataFresh = dataAgeMs < FRESH_DATA_MS;

  // If we have fresh live data, the socket-level status is misleading —
  // polling or initial fetch is keeping the UI accurate.
  const shouldShow = socketDown && !dataFresh;

  useEffect(() => {
    if (!shouldShow) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), STABLE_MS);
    return () => clearTimeout(id);
  }, [shouldShow]);

  if (!show) return null;

  const title =
    status === "stale"
      ? t("offline.signalLost")
      : status === "reconnecting"
        ? t("offline.reconnecting")
        : t("offline.title");
  const subtitle =
    status === "stale" || status === "reconnecting"
      ? null
      : t("offline.subtitle");

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon name="cloud-offline-outline" size={18} color={colors.warning} />
      </View>
      <View style={styles.body}>
        <Text variant="label" color={colors.foreground}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={colors.mutedForeground}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
});
