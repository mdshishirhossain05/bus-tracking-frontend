import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import * as Haptics from "expo-haptics";
import {
  Text,
  ScreenHeader,
  Icon,
  GlassSurface,
  colors,
  spacing,
  radius,
  env,
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
import {
  BusMarker,
  type BusMarkerStatus,
} from "../features/passenger/components/BusMarker";

const POLL_MS = 5000;

// When exactly one bus is live on the route we FOLLOW it like the home
// tracker (close-in, north-up) so the rider watches it move without
// panning. With several buses we keep the whole-route overview instead,
// so no single bus hijacks the camera and hides the others.
const FOLLOW_ZOOM = 16;

/** Great-circle distance in metres — used to find the polyline vertex
 *  nearest the followed bus so we can split travelled vs remaining. */
function metersBetween(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6378137;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Anything older than this fades the bus marker so a passenger reads
// it as "not actively reporting". Backend already hides anything older
// than 2 hours.
const STALE_AFTER_MS = 30 * 60 * 1000;

type ViewMode = "map" | "stops";

/** Map a route's live-bus row onto the bus-marker status callout. */
function busMarkerStatusFor(b: RouteLiveBus, ageMs: number | null): {
  status: BusMarkerStatus;
  stale: boolean;
} {
  const stale = ageMs != null && ageMs > STALE_AFTER_MS;
  // RUNNING with a next-stop + ETA → existing live callout.
  if (b.status === "RUNNING" && b.nextStopName) {
    return {
      stale,
      status: {
        nextStopName: b.nextStopName,
        etaMinutes: b.etaMinutes ?? null,
        distanceMeters: b.nextStopDistanceMeters ?? null,
        isYourStop: false,
        finalReached: b.finalStopReached ?? false,
        stationary: (b.speedKmh ?? 0) < 3,
      },
    };
  }
  // PRE_TRIP / PARKED / stale RUNNING → passive callout. Tone the
  // headline to the actual lifecycle state, with a "last seen" subline
  // when the fix is older than a couple of minutes.
  const headline =
    b.status === "PRE_TRIP"
      ? "Pre-trip"
      : b.status === "PARKED"
        ? "Parked"
        : stale
          ? "Last seen"
          : "Idle";
  const subline = (() => {
    if (ageMs == null) return null;
    const mins = Math.round(ageMs / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} hr ago`;
  })();
  return {
    stale,
    status: {
      nextStopName: null,
      etaMinutes: null,
      distanceMeters: null,
      isYourStop: false,
      finalReached: false,
      stationary: true,
      passiveHeadline: headline,
      passiveSubline: subline,
    },
  };
}

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
  // Follow-camera engaged by default; a user pan/zoom drops it and shows
  // the recenter pill (same UX as the home Live map).
  const [following, setFollowing] = useState(true);

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

  // Camera behaviour, mirroring the home Live map:
  //   • Exactly ONE live bus + following → keep the camera centred on it,
  //     north-up at FOLLOW_ZOOM, so the rider watches it travel without
  //     touching the screen. Re-centres on every new fix.
  //   • Several buses, or no bus, or the user has panned away → frame the
  //     whole route polyline + every bus together (the overview).
  const singleBus =
    liveBuses.length === 1 &&
    liveBuses[0].latitude != null &&
    liveBuses[0].longitude != null
      ? liveBuses[0]
      : null;

  // Navigation-style PROGRESS split of the route line — only when a single
  // bus is being tracked (same reasoning as the follow camera). Find the
  // polyline vertex nearest the bus; everything before it is "travelled"
  // (faded grey), everything after is "remaining" (bright blue + dashed
  // direction overlay). Mirrors the home Live map. With several buses we
  // fall back to one plain line so no single bus owns the split.
  const polyCoords = useMemo(
    () =>
      presentation?.polyline.map(([latitude, longitude]) => ({
        latitude,
        longitude,
      })) ?? [],
    [presentation],
  );

  const busIndex = useMemo(() => {
    if (!singleBus || polyCoords.length < 2) return -1;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < polyCoords.length; i++) {
      const d = metersBetween(
        singleBus.latitude as number,
        singleBus.longitude as number,
        polyCoords[i].latitude,
        polyCoords[i].longitude,
      );
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    // Off-route (>600 m from every vertex) → don't split.
    return bestD <= 600 ? best : -1;
  }, [singleBus, polyCoords]);

  const useSplit = busIndex >= 0 && polyCoords.length > 1;
  const traveledLine = useSplit ? polyCoords.slice(0, busIndex + 1) : [];
  const remainingLine = useSplit ? polyCoords.slice(busIndex) : polyCoords;

  useEffect(() => {
    if (!presentation || !mapRef.current) return;

    if (following && singleBus) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: singleBus.latitude as number,
            longitude: singleBus.longitude as number,
          },
          pitch: 0,
          heading: 0,
          zoom: FOLLOW_ZOOM,
        },
        { duration: 800 },
      );
      return;
    }

    // Overview: fit the route + all buses.
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
  }, [presentation, liveBuses, following, singleBus]);
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
            // Use the standard bright Google Maps look here too — same as
            // the home Live page — so the rider gets the SAME map UI
            // they already know on both screens. Place names + POI labels
            // visible by default so riders can orient themselves on the
            // route (areas, landmarks). Tighter initial zoom (0.015 vs
            // the old 0.06) so the route and the bus are immediately
            // legible without pinching in.
            showsBuildings
            showsIndoors={false}
            showsPointsOfInterests
            initialRegion={{
              latitude: env.map.defaultLat,
              longitude: env.map.defaultLng,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            // A user pan/zoom drops follow-mode so they can explore freely;
            // the recenter pill re-engages it. Only relevant when a single
            // bus is being followed.
            onPanDrag={() => {
              if (following && singleBus) setFollowing(false);
            }}
            onRegionChangeComplete={(_region, details) => {
              if (details?.isGesture && following && singleBus) {
                setFollowing(false);
              }
            }}
          >
            {/* Plain line when NOT splitting (multiple buses / no bus). */}
            {!useSplit && polyCoords.length > 1 ? (
              <Polyline
                coordinates={polyCoords}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            ) : null}

            {/* Travelled portion behind the tracked bus — faded. */}
            {useSplit && traveledLine.length > 1 ? (
              <Polyline
                coordinates={traveledLine}
                strokeColor="rgba(100, 116, 139, 0.45)"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            ) : null}

            {/* Remaining portion ahead — bright brand line + white dashed
                direction overlay, exactly like the home Live map. */}
            {useSplit && remainingLine.length > 1 ? (
              <>
                <Polyline
                  coordinates={remainingLine}
                  strokeColor={colors.primary}
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                />
                <Polyline
                  coordinates={remainingLine}
                  strokeColor="rgba(255, 255, 255, 0.9)"
                  strokeWidth={2.5}
                  lineCap="butt"
                  lineJoin="round"
                  lineDashPattern={[10, 14]}
                />
              </>
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
            {liveBuses.map((b) => {
              const ageMs = b.updatedAt
                ? Date.now() - new Date(b.updatedAt).getTime()
                : null;
              const { status, stale } = busMarkerStatusFor(b, ageMs);
              return (
                <BusMarker
                  key={b.tripId}
                  latitude={b.latitude as number}
                  longitude={b.longitude as number}
                  heading={b.heading ?? null}
                  speedKmh={b.speedKmh ?? null}
                  label={b.busLabel ?? "Bus"}
                  stale={stale}
                  status={status}
                />
              );
            })}
          </MapView>

          {/* Recenter pill — only while a single bus is being tracked and
              the rider has panned away. Tapping re-engages follow mode and
              snaps back to the bus. Hidden otherwise (overview / no bus). */}
          {singleBus && !following ? (
            <Pressable
              style={styles.recenterFab}
              accessibilityLabel="Re-center on bus"
              onPress={() => {
                void Haptics.selectionAsync();
                setFollowing(true);
                mapRef.current?.animateCamera(
                  {
                    center: {
                      latitude: singleBus.latitude as number,
                      longitude: singleBus.longitude as number,
                    },
                    pitch: 0,
                    heading: 0,
                    zoom: FOLLOW_ZOOM,
                  },
                  { duration: 500 },
                );
              }}
            >
              <GlassSurface rounded="pill" style={styles.recenterInner}>
                <Icon name="locate" size={22} color={colors.primary} />
              </GlassSurface>
            </Pressable>
          ) : null}
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
  recenterFab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
  },
  recenterInner: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
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
