import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing, Icon, Text, useT } from "@ubts/shared";
import type { ConnectionStatus } from "@ubts/shared";

const STABLE_MS = 4000;

/**
 * Shows a prominent banner when the socket is disconnected/errored/stale
 * for more than STABLE_MS. We delay rendering on purpose so a brief blip
 * (driving through a tunnel, app waking up) doesn't flash the banner.
 */
export function OfflineBanner({ status }: { status: ConnectionStatus }) {
  const t = useT();
  const [show, setShow] = useState(false);

  const offline =
    status === "disconnected" ||
    status === "error" ||
    status === "stale" ||
    status === "reconnecting";

  useEffect(() => {
    if (!offline) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), STABLE_MS);
    return () => clearTimeout(id);
  }, [offline]);

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
