import type { ActiveTrip, LiveBusLocation, TripEta } from "@/types/trip";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNullableNumber(value: unknown) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

export function normalizeActiveTrip(input: any): ActiveTrip {
  return {
    tripId: asString(input?.tripId ?? input?.id),
    routeId: asString(input?.routeId ?? input?.route?.id),
    routeName: asNullableString(input?.routeName ?? input?.route?.routeName),
    busId: asNullableString(input?.busId ?? input?.bus?.id),
    busLabel: asNullableString(input?.busLabel ?? input?.bus?.busCode),
    driverId: asNullableString(input?.driverId ?? input?.driver?.id),
    driverName: asNullableString(
      input?.driverName ?? input?.driver?.fullName ?? input?.fullName,
    ),
    status: asString(input?.status, "UNKNOWN"),
    startedAt: asString(input?.startedAt ?? input?.startTime),
    endedAt: asNullableString(input?.endedAt ?? input?.endTime),
    isStale: typeof input?.isStale === "boolean" ? input.isStale : undefined,
    live: input?.live ?? null,
    eta: input?.eta ?? null,
  };
}

export function normalizeLiveBusLocation(input: any): LiveBusLocation | null {
  if (!input) return null;

  const source = input?.live ?? input;
  const latitude = asNullableNumber(source?.latitude ?? source?.lat);
  const longitude = asNullableNumber(source?.longitude ?? source?.lng);

  if (latitude == null || longitude == null) {
    return null;
  }

  const displaySpeed =
    asNullableNumber(source?.displaySpeedKmh) ??
    asNullableNumber(source?.speed ?? source?.speedKmh);

  return {
    tripId: asString(input?.tripId ?? input?.trip?.id),
    routeId: asString(input?.routeId ?? input?.route?.id),
    busId: asNullableString(input?.busId ?? input?.bus?.id),
    driverId: asNullableString(input?.driverId ?? input?.driver?.id),
    latitude,
    longitude,
    speed: displaySpeed,
    filteredSpeedKmh: asNullableNumber(
      source?.filteredSpeedKmh ?? source?.speedKmh,
    ),
    rawSpeedKmh: asNullableNumber(source?.rawSpeedKmh),
    averageSpeedKmh: asNullableNumber(
      source?.averageSpeedKmh ?? source?.rollingAverageSpeedKmh,
    ),
    displaySpeedKmh: displaySpeed,
    heading: asNullableNumber(source?.heading),
    accuracyM: asNullableNumber(source?.accuracyM),
    isStationary:
      typeof source?.isStationary === "boolean"
        ? source.isStationary
        : undefined,
    distanceDeltaMeters: asNullableNumber(source?.distanceDeltaMeters),
    elapsedSeconds: asNullableNumber(source?.elapsedSeconds),
    source: asNullableString(source?.source),
    updatedAt: asString(source?.updatedAt ?? source?.recordedAt),
  };
}

export function normalizeTripEta(input: any): TripEta | null {
  if (!input) return null;

  const source = input?.eta ?? input;
  const nextStopName =
    asNullableString(source?.nextStopName) ??
    asNullableString(source?.nextStop?.stopName);

  return {
    tripId: asString(input?.tripId ?? input?.trip?.id),
    etaMinutes: asNullableNumber(source?.etaMinutes),
    nextStopName,
    nextStopDistanceMeters:
      asNullableNumber(source?.nextStopDistanceMeters) ??
      asNullableNumber(source?.nextStop?.distanceMeters),
    nearestStopName:
      asNullableString(source?.nearestStopName) ??
      asNullableString(source?.nearestStop?.stopName),
    nearestStopDistanceMeters:
      asNullableNumber(source?.nearestStopDistanceMeters) ??
      asNullableNumber(source?.nearestStop?.distanceMeters),
    usedSpeedKmh: asNullableNumber(source?.usedSpeedKmh),
    rollingAverageSpeedKmh: asNullableNumber(source?.rollingAverageSpeedKmh),
    confidence:
      source?.confidence === "HIGH" ||
      source?.confidence === "MEDIUM" ||
      source?.confidence === "LOW"
        ? source.confidence
        : null,
    finalStopReached:
      typeof source?.finalStopReached === "boolean"
        ? source.finalStopReached
        : false,
    updatedAt: asNullableString(
      source?.updatedAt ?? input?.updatedAt ?? input?.recordedAt,
    ),
    eta: input?.eta ?? source?.eta ?? null,
  };
}
