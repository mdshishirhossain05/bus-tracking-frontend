import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing, Icon, Text, useT } from "@ubts/shared";
import type { ConnectionStatus } from "@ubts/shared";

const STABLE_MS = 8000;
const FRESH_FETCH_MS = 30_000;

/**
 * Shows ONLY when:
 *   - The socket is in a negative state, AND
 *   - It's been more than 30s since ANY successful REST/socket update.
 *
 * The key fix: we no longer gate on liveState.updatedAt (which can stay
 * null forever if no GPS packets have arrived even though everything is
 * reachable). `lastFetchAt` is bumped on every successful poll, so as
 * long as REST is working, the banner stays hidden — exactly the user
 * experience we want.
 */
export function OfflineBanner({
  status,
  lastFetchAt,
}: {
  status: ConnectionStatus;
  lastFetchAt?: string | null;
}) {
  const t = useT();
  const [show, setShow] = useState(false);

  const socketDown =
    status === "disconnected" ||
    status === "error" ||
    status === "stale" ||
    status === "reconnecting";

  const fetchAgeMs = lastFetchAt
    ? Date.now() - new Date(lastFetchAt).getTime()
    : Number.POSITIVE_INFINITY;
  const reachable = fetchAgeMs < FRESH_FETCH_MS;

  // If REST is responding, suppress the banner regardless of socket state.
  const shouldShow = socketDown && !reachable;

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
