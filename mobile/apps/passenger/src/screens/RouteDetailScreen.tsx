import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapStyleElement,
} from "react-native-maps";
import * as Haptics from "expo-haptics";
import {
  Text,
  ScreenHeader,
  Icon,
  colors,
  spacing,
  radius,
  env,
  MAP_STYLE_DARK,
} from "@ubts/shared";
import type { RoutePresentation, RouteLiveBus, RouteStop } from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";
import { getRoutePresentation } from "../features/passenger/api/passenger.api";
import { getRouteLiveBuses } from "../features/passenger/api/favorites.api";
import {
  orderStops,
  nearestStopId,
  pickBestBus,
  type JourneyStatus,
} from "../features/journey/journey";
import { usePassengerLocation } from "../features/journey/usePassengerLocation";
import { SourceChip } from "../components/SourceChip";
import { StopTimeline } from "../components/StopTimeline";

const POLL_MS = 5000;

type ViewMode = "map" | "stops";

interface Props {
  routeId: string;
  routeName: string;
}

function StopProgress({
  stops,
  busIndex,
  myIndex,
}: {
  stops: RouteStop[];
  busIndex: number | null;
  myIndex: number;
}) {
  const n = stops.length;
  if (n < 2 || myIndex < 0) return null;
  const frac = (i: number) => Math.max(0, Math.min(1, i / (n - 1)));
  const myF = frac(myIndex);
  const busF = busIndex != null && busIndex >= 0 ? frac(busIndex) : null;
  return (
    <View style={styles.progress}>
      <View style={styles.progressTrack} />
      {busF != null ? (
        <View style={[styles.progressFill, { width: `${busF * 100}%` }]} />
      ) : null}
      <View style={[styles.progNode, { left: `${myF * 100}%` }]}>
        <View style={styles.youDot} />
      </View>
      {busF != null ? (
        <View style={[styles.progBus, { left: `${busF * 100}%` }]}>
          <Icon name="bus" size={11} color={colors.primaryForeground} />
        </View>
      ) : null}
    </View>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <View style={styles.toggle}>
      {(["map", "stops"] as const).map((v) => {
        const active = v === value;
        const color = active ? colors.primaryForeground : colors.mutedForeground;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[styles.toggleBtn, active && styles.toggleActive]}
          >
            <Icon name={v === "map" ? "map-outline" : "list-outline"} size={15} color={color} />
            <Text variant="label" color={color}>
              {v === "map" ? "Map" : "Stops"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RouteDetailScreen({ routeId, routeName }: Props) {
  const { goBack } = useNav();
  const mapRef = useRef<MapView | null>(null);
  const [presentation, setPresentation] = useState<RoutePresentation | null>(null);
  const [buses, setBuses] = useState<RouteLiveBus[]>([]);
  const [myStopId, setMyStopId] = useState<string | null>(null);
  const [autoSet, setAutoSet] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("map");

  const { coords, ready } = usePassengerLocation();

  useEffect(() => {
    let active = true;
    void getRoutePresentation(routeId)
      .then((p) => {
        if (active) setPresentation(p);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [routeId]);

  const refreshBuses = useCallback(async () => {
    try {
      setBuses(await getRouteLiveBuses(routeId));
    } catch {
      // keep last-known buses on a transient failure
    }
  }, [routeId]);

  useEffect(() => {
    void refreshBuses();
    const interval = setInterval(() => void refreshBuses(), POLL_MS);
    return () => clearInterval(interval);
  }, [refreshBuses]);

  const stops = useMemo(
    () => (presentation ? orderStops(presentation.stops) : []),
    [presentation],
  );

  useEffect(() => {
    if (autoSet || !stops.length || !ready) return;
    const picked = coords
      ? nearestStopId(stops, coords.latitude, coords.longitude)
      : stops[0].id;
    setMyStopId(picked);
    setAutoSet(true);
  }, [stops, coords, ready, autoSet]);

  const myStop = stops.find((s) => s.id === myStopId) ?? null;
  const myIndex = myStopId ? stops.findIndex((s) => s.id === myStopId) : -1;
  const liveBuses = buses.filter((b) => b.latitude != null && b.longitude != null);

  // Fit the camera so the route polyline AND every live bus on the
  // route are framed together. Re-fits whenever buses appear or move
  // significantly — passengers always see the whole journey shape and
  // every active vehicle on it.
  useEffect(() => {
    if (!presentation || !mapRef.current) return;
    const coords: { latitude: number; longitude: number }[] = [];
    coords.push(
      ...presentation.polyline.map(([latitude, longitude]) => ({
        latitude,
        longitude,
      })),
    );
    for (const bus of liveBuses) {
      if (bus.latitude != null && bus.longitude != null) {
        coords.push({
          latitude: bus.latitude as number,
          longitude: bus.longitude as number,
        });
      }
    }
    if (coords.length < 2) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 70, bottom: 100, left: 70 },
      animated: true,
    });
  }, [presentation, liveBuses]);
  const best = useMemo(
    () => pickBestBus(stops, buses, myStopId),
    [stops, buses, myStopId],
  );
  const journey: JourneyStatus | null = best?.journey ?? null;

  // Gentle cue the first time the soonest bus flips to "arriving now".
  const prevState = useRef<string | null>(null);
  useEffect(() => {
    const st = journey?.state ?? null;
    if (st && st !== prevState.current && st === "approaching") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevState.current = st;
  }, [journey?.state]);

  const headerSubtitle = !myStop
    ? "Finding your stop…"
    : journey
      ? journey.headline
      : liveBuses.length > 0
        ? `${liveBuses.length} bus${liveBuses.length > 1 ? "es" : ""} live`
        : "No buses running";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={routeName} subtitle={headerSubtitle} onBack={goBack} />

      <View style={styles.hero}>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.stopRow, pressed && styles.pressed]}
        >
          <Icon name="location" size={16} color={colors.primary} />
          <View style={styles.flex}>
            <Text variant="caption" color={colors.faintForeground}>
              YOUR STOP
            </Text>
            <Text variant="label" color={colors.foreground} numberOfLines={1}>
              {myStop?.name ?? "Choose a stop"}
            </Text>
          </View>
          <Icon name="chevron-down" size={18} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.statusBlock}>
          {!myStop ? (
            <Text variant="body" color={colors.mutedForeground}>
              Locating you on this route…
            </Text>
          ) : journey ? (
            <JourneyStatusView journey={journey} />
          ) : liveBuses.length > 0 ? (
            <>
              <Text variant="title" color={colors.success}>
                {liveBuses.length} bus{liveBuses.length > 1 ? "es" : ""} live
              </Text>
              <Text variant="body" color={colors.mutedForeground}>
                Locating along the route — exact ETA appears shortly.
              </Text>
            </>
          ) : (
            <>
              <Text variant="title" color={colors.foreground}>
                No bus running yet
              </Text>
              <Text variant="body" color={colors.mutedForeground}>
                We'll show its progress the moment a driver departs.
              </Text>
            </>
          )}
        </View>

        {best ? <SourceChip bus={best.bus} /> : null}

        {journey && journey.busIndex != null ? (
          <StopProgress stops={stops} busIndex={journey.busIndex} myIndex={myIndex} />
        ) : null}
      </View>

      <View style={styles.toggleWrap}>
        <ViewToggle value={view} onChange={setView} />
      </View>

      {view === "map" ? (
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            customMapStyle={MAP_STYLE_DARK as unknown as MapStyleElement[]}
            initialRegion={{
              latitude: env.map.defaultLat,
              longitude: env.map.defaultLng,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
          >
            {presentation && presentation.polyline.length > 1 ? (
              <Polyline
                coordinates={presentation.polyline.map(([latitude, longitude]) => ({
                  latitude,
                  longitude,
                }))}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            ) : null}
            {presentation?.origin ? (
              <Marker
                coordinate={{
                  latitude: presentation.origin.latitude,
                  longitude: presentation.origin.longitude,
                }}
                title={presentation.origin.name}
                pinColor={colors.success}
              />
            ) : null}
            {presentation?.destination ? (
              <Marker
                coordinate={{
                  latitude: presentation.destination.latitude,
                  longitude: presentation.destination.longitude,
                }}
                title={presentation.destination.name}
                pinColor={colors.danger}
              />
            ) : null}
            {myStop ? (
              <Marker
                coordinate={{ latitude: myStop.latitude, longitude: myStop.longitude }}
                title={`Your stop · ${myStop.name}`}
                pinColor={colors.warning}
              />
            ) : null}
            {liveBuses.map((b) => (
              <Marker
                key={b.tripId}
                coordinate={{
                  latitude: b.latitude as number,
                  longitude: b.longitude as number,
                }}
                title={b.busLabel ?? "Bus"}
                description={b.nextStopName ? `Heading to ${b.nextStopName}` : "Live"}
                pinColor={colors.primary}
              />
            ))}
          </MapView>
        </View>
      ) : (
        <StopTimeline
          stops={stops}
          busIndex={journey?.busIndex ?? null}
          myIndex={myIndex}
          etaMin={journey?.etaMin ?? null}
        />
      )}

      {pickerOpen ? (
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} />
          <View style={styles.pickerCard}>
            <View style={styles.grabber} />
            <Text variant="caption" color={colors.faintForeground} style={styles.pickerTitle}>
              CHOOSE YOUR STOP
            </Text>
            <ScrollView style={styles.pickerList}>
              {stops.map((s) => {
                const selected = s.id === myStopId;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setMyStopId(s.id);
                      setAutoSet(true);
                      setPickerOpen(false);
                    }}
                    style={({ pressed }) => [styles.pickerRow, pressed && styles.pressed]}
                  >
                    <Icon
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={selected ? colors.primary : colors.faintForeground}
                    />
                    <Text
                      variant="body"
                      color={selected ? colors.foreground : colors.mutedForeground}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function JourneyStatusView({ journey }: { journey: JourneyStatus }) {
  if (journey.state === "before" && journey.etaMin != null) {
    return (
      <>
        <View style={styles.etaRow}>
          <Text variant="display" color={colors.primary} tabular>
            {journey.etaMin}
          </Text>
          <Text variant="subtitle" color={colors.mutedForeground} style={styles.etaUnit}>
            min to your stop
          </Text>
        </View>
        <Text variant="body" color={colors.foreground}>
          {journey.detail}
        </Text>
      </>
    );
  }

  const tone =
    journey.state === "approaching"
      ? colors.success
      : journey.state === "passed"
        ? colors.warning
        : colors.foreground;

  return (
    <>
      <Text variant="title" color={tone}>
        {journey.headline}
      </Text>
      <Text variant="body" color={colors.mutedForeground}>
        {journey.detail}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  hero: {
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  statusBlock: { gap: spacing.xs },
  etaRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  etaUnit: { marginBottom: 8 },
  progress: { height: 28, justifyContent: "center", marginTop: spacing.xs },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.muted },
  progressFill: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  progNode: {
    position: "absolute",
    transform: [{ translateX: -7 }],
    alignItems: "center",
    justifyContent: "center",
  },
  youDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.warning,
    borderWidth: 2,
    borderColor: colors.background,
  },
  progBus: {
    position: "absolute",
    transform: [{ translateX: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  toggleWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  toggleActive: { backgroundColor: colors.primary },
  mapWrap: { flex: 1, overflow: "hidden" },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  pickerCard: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: "60%",
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  pickerTitle: {
    letterSpacing: 1.2,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pickerList: { paddingHorizontal: spacing.lg },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
