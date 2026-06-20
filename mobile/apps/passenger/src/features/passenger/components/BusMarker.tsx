import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated as RNAnimated, Easing as RNEasing, StyleSheet, Text, View } from "react-native";
import { AnimatedRegion, MarkerAnimated } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, localizeNumber, useI18n } from "@ubts/shared";

/**
 * Compact live status rendered in a callout attached to the bus marker.
 * Everything the rider needs — next stop, ETA, speed — travels WITH the
 * bus on the map, so the status reads as "this bus's state" rather than a
 * detached HUD. When the bus's next stop is the rider's chosen stop we
 * switch to a highlighted "Your stop" treatment.
 */
export interface BusMarkerStatus {
  nextStopName: string | null;
  etaMinutes: number | null;
  distanceMeters: number | null;
  /** True when the next stop is the rider's chosen destination stop. */
  isYourStop: boolean;
  /** Final stop reached — show "Arrived" instead of an ETA. */
  finalReached: boolean;
  /** Bus is stopped/idling. */
  stationary: boolean;
  /**
   * When the bus has no live ETA (parked between runs, pre-trip, or
   * last-seen-stale), set these instead of `nextStopName` to render a
   * compact "passive" callout (e.g. headline "Parked", subline
   * "Last seen 12 min ago").
   */
  passiveHeadline?: string | null;
  passiveSubline?: string | null;
}

interface BusMarkerProps {
  latitude: number;
  longitude: number;
  heading?: number | null;
  /** Current ground speed in km/h; used to scale glide duration. */
  speedKmh?: number | null;
  /** Short identifier shown in the callout header (e.g. "BUS-1042"). */
  label?: string | null;
  /** Dimmed when the feed has gone stale, so a frozen bus reads as "stale". */
  stale?: boolean;
  /** Live status shown in the callout above the bus. Null hides the callout. */
  status?: BusMarkerStatus | null;
}

// Glide scales with the bus's reported ground speed so a fast bus
// catches up quickly (snappy ~1s glide) and a stopped/idling bus moves
// gently (~2.5s) instead of churning at a fixed metronome. Same trick
// Google Maps / Uber use to keep motion feeling natural.
const GLIDE_MIN_MS = 900;
const GLIDE_MAX_MS = 2500;
const GLIDE_FALLBACK_MS = 1500;
const ROTATE_MS = 600;

function glideDurationForSpeed(speed: number | null | undefined): number {
  if (speed == null || !Number.isFinite(speed)) return GLIDE_FALLBACK_MS;
  // 5 km/h or less → max duration (slow/dwelling). 40+ km/h → min
  // duration (highway pace). Linear between the two.
  const clamped = Math.max(5, Math.min(40, speed));
  const t = (clamped - 5) / 35; // 0..1
  return GLIDE_MAX_MS - t * (GLIDE_MAX_MS - GLIDE_MIN_MS);
}

/**
 * Google-Maps-grade directional bus marker.
 *
 *   1. Position glides between GPS fixes via AnimatedRegion (~1.5s) so the
 *      bus visibly moves across the map instead of teleporting between
 *      fixes.
 *   2. Heading is interpolated separately via an Animated.Value (~600ms,
 *      shortest-arc) so the marker SMOOTHLY rotates to its new direction
 *      instead of snapping — same feel as Google Maps Navigation when
 *      the road turns.
 *   3. Visual: a chunky white-bordered circle with a brand-coloured bus
 *      glyph in the middle and a LARGE forward-pointing chevron sitting
 *      on top. Because `flat=true` is set, the whole marker rotates with
 *      the map's coordinate space — and because the camera (in LiveMap)
 *      stays north-up, that rotation is what the rider sees as
 *      "direction the bus is going". The chevron is the dominant cue.
 *   4. A live STATUS CALLOUT (next stop · ETA · speed) hangs above the bus
 *      and glides with it, so the rider reads the bus's state right on the
 *      vehicle. It is a non-flat marker so the text stays upright.
 *   5. `tracksViewChanges` is held TRUE during the glide and toggled off
 *      ~400 ms after it settles — otherwise Google Maps caches the
 *      marker's bitmap and motion looks frozen on Android. It is also
 *      pulsed whenever the callout text changes so the new ETA renders.
 */
export function BusMarker({
  latitude,
  longitude,
  heading,
  speedKmh = null,
  label = null,
  stale = false,
  status = null,
}: BusMarkerProps) {
  const { t, locale } = useI18n();
  const glideMs = glideDurationForSpeed(speedKmh);
  // ── Position: AnimatedRegion glide ───────────────────────────────
  const coordinate = useMemo(
    () =>
      new AnimatedRegion({
        latitude,
        longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [tracking, setTracking] = useState(true);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTracking(true);
    coordinate
      .timing({
        latitude,
        longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration: glideMs,
        useNativeDriver: false,
      } as never)
      .start();

    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setTracking(false), glideMs + 400);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [latitude, longitude, coordinate, glideMs]);

  // ── Heading: smooth, shortest-arc rotation ───────────────────────
  // The raw heading from the server can jump (e.g. 350° → 10°). Naively
  // animating that goes the long way round. Track the last applied
  // heading and step the AnimatedValue along the SHORTER arc, so the
  // bus appears to make a small ±20° turn instead of a 340° spin.
  const targetHeading =
    heading != null && heading >= 0 && heading <= 360 ? heading : 0;
  const rotationAnim = useRef(new RNAnimated.Value(targetHeading)).current;
  const lastHeading = useRef<number>(targetHeading);

  useEffect(() => {
    const prev = lastHeading.current;
    let next = targetHeading;
    const diff = ((next - prev + 540) % 360) - 180; // signed, [-180, 180)
    // Drive the AnimatedValue past 360 in either direction if needed.
    const adjusted = prev + diff;
    RNAnimated.timing(rotationAnim, {
      toValue: adjusted,
      duration: ROTATE_MS,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start(() => {
      lastHeading.current = ((adjusted % 360) + 360) % 360;
      // Snap the AnimatedValue back into [0, 360) range without
      // re-animating, so future deltas are computed from a clean base.
      rotationAnim.setValue(lastHeading.current);
    });
  }, [targetHeading, rotationAnim]);

  // ── Pulse halo ───────────────────────────────────────────────────
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.4 }],
    opacity: stale ? 0 : 0.45 * (1 - pulse.value),
  }));

  // ── Callout content + bitmap refresh ─────────────────────────────
  // Build the human-readable status strings up front so we can key the
  // tracksViewChanges pulse on the rendered text. Without this, an ETA
  // change that arrives WITHOUT a position change would not repaint the
  // cached marker bitmap on Android — the callout would show a stale ETA.
  const distanceLabel = useMemo(() => {
    const d = status?.distanceMeters;
    if (d == null || d < 0) return null;
    return d >= 1000
      ? `${localizeNumber((d / 1000).toFixed(1), locale)} ${t("common.km")}`
      : `${localizeNumber(Math.round(d), locale)} ${t("common.m")}`;
  }, [status?.distanceMeters, locale, t]);

  const etaLabel = useMemo(() => {
    if (!status) return null;
    if (status.finalReached) return t("tripSheet.arrived");
    if (status.etaMinutes != null && status.etaMinutes >= 0) {
      return `${localizeNumber(status.etaMinutes, locale)} ${t("common.min")}`;
    }
    return null;
  }, [status, locale, t]);

  const speedLabel = useMemo(() => {
    if (status?.stationary) return t("hud.stopped");
    if (speedKmh != null && speedKmh >= 0) {
      return `${localizeNumber(Math.round(speedKmh), locale)} ${t("common.kmh")}`;
    }
    return null;
  }, [status?.stationary, speedKmh, locale, t]);

  // A key that changes whenever any visible callout text changes.
  const contentKey = `${label ?? ""}|${status?.nextStopName ?? ""}|${
    status?.isYourStop ? "Y" : "N"
  }|${etaLabel ?? ""}|${distanceLabel ?? ""}|${speedLabel ?? ""}|${
    status?.passiveHeadline ?? ""
  }|${status?.passiveSubline ?? ""}`;
  const calloutPulse = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Pulse the callout marker's bitmap so new text paints even if the
    // bus didn't move on this update tick.
    setTracking(true);
    if (calloutPulse.current) clearTimeout(calloutPulse.current);
    calloutPulse.current = setTimeout(() => setTracking(false), 500);
    return () => {
      if (calloutPulse.current) clearTimeout(calloutPulse.current);
    };
  }, [contentKey]);

  const showLiveCallout = !!status && !!status.nextStopName;
  const showPassiveCallout =
    !!status && !status.nextStopName && !!status.passiveHeadline;
  const showCallout = showLiveCallout || showPassiveCallout;

  return (
    <>
      {/* BUS BODY MARKER — flat (rotates with map heading via the
          `rotation` prop) so the chevron always points "forward". */}
      <MarkerAnimated
        coordinate={coordinate as unknown as { latitude: number; longitude: number }}
        anchor={{ x: 0.5, y: 0.5 }}
        flat
        // RNAnimated.Value is accepted by Marker's `rotation` prop at
        // runtime; the type signature is plain number so we cast.
        rotation={rotationAnim as unknown as number}
        tracksViewChanges={tracking}
        zIndex={60}
      >
        <View style={styles.container}>
          <Animated.View style={[styles.pulse, pulseStyle]} />

          {/* FORWARD CHEVRON — the dominant direction cue, sits ahead
              of the bus body and points in the heading direction once
              the whole marker rotates. Bigger + brand-coloured + white
              stroke so it pops against any basemap. */}
          <View
            style={[
              styles.chevronStroke,
              stale && styles.chevronStrokeStale,
            ]}
          />
          <View
            style={[
              styles.chevronFill,
              stale && styles.chevronFillStale,
            ]}
          />

          {/* BUS BODY — circular badge with the bus icon. The "this is
              a bus, not just a moving dot" cue. */}
          <View style={[styles.body, stale && styles.bodyStale]}>
            <Ionicons name="bus" size={22} color="white" />
          </View>
        </View>
      </MarkerAnimated>

      {/* STATUS CALLOUT MARKER — non-flat (stays screen-upright regardless
          of map / bus rotation) so the text is always readable. Shares the
          same animated coordinate so it glides with the bus body. Anchored
          at its bottom so the card floats just above the bus marker. */}
      {showCallout && status ? (
        <MarkerAnimated
          coordinate={coordinate as unknown as { latitude: number; longitude: number }}
          anchor={{ x: 0.5, y: 1 }}
          centerOffset={{ x: 0, y: -(SIZE / 2) - 10 }}
          tracksViewChanges={tracking}
          zIndex={70}
        >
          <View style={styles.calloutWrap}>
            <View
              style={[
                styles.callout,
                status.isYourStop && styles.calloutYourStop,
                stale && styles.calloutStale,
              ]}
            >
              {label ? (
                <View style={styles.calloutHeaderRow}>
                  <Ionicons name="bus" size={11} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.calloutLabel} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              ) : null}

              {showLiveCallout ? (
                <>
                  <Text style={styles.calloutStopLabel} numberOfLines={1}>
                    {status.isYourStop
                      ? t("busCallout.yourStop")
                      : t("busCallout.nextStop")}
                  </Text>
                  <Text style={styles.calloutStopName} numberOfLines={1}>
                    {status.nextStopName}
                  </Text>

                  <View style={styles.calloutMetaRow}>
                    {etaLabel ? (
                      <View style={styles.calloutMetaItem}>
                        <Ionicons name="time-outline" size={12} color="#ffffff" />
                        <Text style={styles.calloutMetaText}>{etaLabel}</Text>
                      </View>
                    ) : null}
                    {speedLabel ? (
                      <View style={styles.calloutMetaItem}>
                        <Ionicons
                          name={status.stationary ? "pause" : "speedometer-outline"}
                          size={12}
                          color="#ffffff"
                        />
                        <Text style={styles.calloutMetaText}>{speedLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.calloutStopName} numberOfLines={1}>
                    {status.passiveHeadline}
                  </Text>
                  {status.passiveSubline ? (
                    <Text style={styles.calloutStopLabel} numberOfLines={1}>
                      {status.passiveSubline}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
            {/* Little downward tail pointing at the bus. */}
            <View
              style={[
                styles.calloutTail,
                status.isYourStop && styles.calloutTailYourStop,
                stale && styles.calloutTailStale,
              ]}
            />
          </View>
        </MarkerAnimated>
      ) : null}
    </>
  );
}

const SIZE = 48;
const CONTAINER = SIZE * 3;
const CHEVRON_W = 30;
const CHEVRON_H = 24;
const CHEVRON_GAP = 8; // gap between bus body and chevron base
const CHEVRON_STROKE = 3; // white outline thickness for the chevron

const bodyTop = (CONTAINER - SIZE) / 2;
const chevronFillTop = bodyTop - CHEVRON_GAP - CHEVRON_H;
const chevronStrokeTop = chevronFillTop - CHEVRON_STROKE;

const CALLOUT_BG = "rgba(15, 23, 42, 0.94)";
const CALLOUT_YOURSTOP_BG = colors.primary;

const styles = StyleSheet.create({
  container: {
    width: CONTAINER,
    height: CONTAINER,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: SIZE * 1.1,
    height: SIZE * 1.1,
    borderRadius: SIZE,
    backgroundColor: colors.primary,
  },
  // Bus body — round badge with brand fill, white border, deep shadow.
  body: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 10,
  },
  bodyStale: {
    backgroundColor: colors.faintForeground,
    borderColor: colors.muted,
  },
  // Forward chevron — large filled triangle pointing UP in marker
  // local space. Because `flat=true` rotates the whole marker, this
  // visually points "forward" relative to the bus's heading.
  //
  // We draw it as TWO stacked triangles: a slightly larger white
  // "stroke" triangle behind and a primary-coloured fill triangle
  // in front, giving the chevron a crisp outline on any basemap.
  chevronStroke: {
    position: "absolute",
    top: chevronStrokeTop,
    width: 0,
    height: 0,
    borderLeftWidth: CHEVRON_W / 2 + CHEVRON_STROKE,
    borderRightWidth: CHEVRON_W / 2 + CHEVRON_STROKE,
    borderBottomWidth: CHEVRON_H + CHEVRON_STROKE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#ffffff",
  },
  chevronStrokeStale: {
    borderBottomColor: colors.muted,
  },
  chevronFill: {
    position: "absolute",
    top: chevronFillTop,
    width: 0,
    height: 0,
    borderLeftWidth: CHEVRON_W / 2,
    borderRightWidth: CHEVRON_W / 2,
    borderBottomWidth: CHEVRON_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.primary,
  },
  chevronFillStale: {
    borderBottomColor: colors.faintForeground,
  },
  // Status callout — floats above the bus, screen-upright.
  calloutWrap: {
    alignItems: "center",
    maxWidth: 240,
  },
  callout: {
    minWidth: 150,
    maxWidth: 240,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: CALLOUT_BG,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 7,
    elevation: 8,
  },
  calloutYourStop: {
    backgroundColor: CALLOUT_YOURSTOP_BG,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  calloutStale: {
    backgroundColor: "rgba(100, 116, 139, 0.92)",
  },
  calloutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  calloutLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.4,
  },
  calloutStopLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  calloutStopName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 1,
  },
  calloutMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 5,
  },
  calloutMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  calloutMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  calloutTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: CALLOUT_BG,
    marginTop: -1,
  },
  calloutTailYourStop: {
    borderTopColor: CALLOUT_YOURSTOP_BG,
  },
  calloutTailStale: {
    borderTopColor: "rgba(100, 116, 139, 0.92)",
  },
});
