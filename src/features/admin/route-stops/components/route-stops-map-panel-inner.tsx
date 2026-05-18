"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  InfoWindowF,
  OverlayView,
  OverlayViewF,
  PolylineF,
  useLoadScript,
} from "@react-google-maps/api";
import { env } from "@/lib/config/env";
import type {
  AdminAssignedRouteStop,
  AdminStopLite,
  RouteGeometryPoint,
} from "../api/admin.route-stops.api";

type LatLngPoint = google.maps.LatLngLiteral;

type InfoWindowState =
  | {
      type: "assigned";
      id: string;
      position: LatLngPoint;
    }
  | {
      type: "available";
      id: string;
      position: LatLngPoint;
    }
  | null;

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

const mapOptions: google.maps.MapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
  zoomControl: true,
};

function toLatLng(point: RouteGeometryPoint): LatLngPoint {
  return {
    lat: point.lat,
    lng: point.lng,
  };
}

function OrderedMarker({
  label,
  onClick,
}: {
  label: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Assigned stop order ${label}`}
      className="flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-xs font-bold text-white shadow-[0_8px_18px_rgba(15,23,42,0.20)]"
    >
      {label}
    </button>
  );
}

function AvailableMarker({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Available stop"
      className="flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-blue-500/70 shadow-[0_6px_14px_rgba(37,99,235,0.25)]"
    />
  );
}

export function RouteStopsGoogleMap({
  assignedStops,
  unassignedStops,
  geometry,
}: {
  assignedStops: AdminAssignedRouteStop[];
  unassignedStops: AdminStopLite[];
  geometry: RouteGeometryPoint[];
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindow, setInfoWindow] = useState<InfoWindowState>(null);

  const hasGoogleKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0;

  const center = useMemo<LatLngPoint>(() => {
    const firstGeometry = geometry[0];
    if (firstGeometry) return toLatLng(firstGeometry);

    const firstAssigned = assignedStops[0];
    if (firstAssigned) {
      return {
        lat: firstAssigned.lat,
        lng: firstAssigned.lng,
      };
    }

    const firstAvailable = unassignedStops[0];
    if (firstAvailable) {
      return {
        lat: firstAvailable.lat,
        lng: firstAvailable.lng,
      };
    }

    return {
      lat: env.NEXT_PUBLIC_MAP_DEFAULT_LAT,
      lng: env.NEXT_PUBLIC_MAP_DEFAULT_LNG,
    };
  }, [assignedStops, geometry, unassignedStops]);

  const path = useMemo<LatLngPoint[]>(() => {
    if (geometry.length >= 2) {
      return geometry.map(toLatLng);
    }

    return assignedStops.map((stop) => ({
      lat: stop.lat,
      lng: stop.lng,
    }));
  }, [assignedStops, geometry]);

  const boundsPoints = useMemo<LatLngPoint[]>(() => {
    return [
      ...geometry.map(toLatLng),
      ...assignedStops.map((stop) => ({
        lat: stop.lat,
        lng: stop.lng,
      })),
      ...unassignedStops.map((stop) => ({
        lat: stop.lat,
        lng: stop.lng,
      })),
    ];
  }, [assignedStops, geometry, unassignedStops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (boundsPoints.length === 0) {
      map.setCenter({
        lat: env.NEXT_PUBLIC_MAP_DEFAULT_LAT,
        lng: env.NEXT_PUBLIC_MAP_DEFAULT_LNG,
      });
      map.setZoom(env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM);
      return;
    }

    if (boundsPoints.length === 1) {
      map.setCenter(boundsPoints[0]);
      map.setZoom(16);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    boundsPoints.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 48);
  }, [boundsPoints, isLoaded]);

  const activeAssignedStop =
    infoWindow?.type === "assigned"
      ? assignedStops.find((stop) => stop.stopId === infoWindow.id)
      : null;

  const activeAvailableStop =
    infoWindow?.type === "available"
      ? unassignedStops.find((stop) => stop.id === infoWindow.id)
      : null;

  if (!hasGoogleKey) {
    return (
      <div className="flex h-full items-center justify-center bg-amber-500/10 p-4 text-center text-sm text-amber-300">
        Google Maps API key is missing. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-red-500/10 p-4 text-center text-sm text-red-300">
        Google Maps failed to load. Check API key restrictions, Maps JavaScript
        API, and billing status.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-500">
        Loading Google Maps...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM}
      options={mapOptions}
      onLoad={(map) => {
        mapRef.current = map;
      }}
      onUnmount={() => {
        mapRef.current = null;
      }}
    >
      {path.length >= 2 ? (
        <PolylineF
          path={path}
          options={{
            strokeColor: "#2563eb",
            strokeOpacity: 0.85,
            strokeWeight: 4,
            geodesic: true,
          }}
        />
      ) : null}

      {unassignedStops.map((stop) => {
        const position = {
          lat: stop.lat,
          lng: stop.lng,
        };

        return (
          <OverlayViewF
            key={`available-${stop.id}`}
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <AvailableMarker
              onClick={() =>
                setInfoWindow({
                  type: "available",
                  id: stop.id,
                  position,
                })
              }
            />
          </OverlayViewF>
        );
      })}

      {assignedStops.map((stop, index) => {
        const position = {
          lat: stop.lat,
          lng: stop.lng,
        };

        return (
          <OverlayViewF
            key={`assigned-${stop.stopId}`}
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <OrderedMarker
              label={index + 1}
              onClick={() =>
                setInfoWindow({
                  type: "assigned",
                  id: stop.stopId,
                  position,
                })
              }
            />
          </OverlayViewF>
        );
      })}

      {infoWindow ? (
        <InfoWindowF
          position={infoWindow.position}
          onCloseClick={() => setInfoWindow(null)}
        >
          <div className="space-y-1 text-xs">
            {infoWindow.type === "assigned" && activeAssignedStop ? (
              <>
                <div className="font-medium text-slate-100">
                  {activeAssignedStop.stopName}
                </div>
                <div className="text-slate-400">
                  Order:{" "}
                  {assignedStops.findIndex(
                    (stop) => stop.stopId === activeAssignedStop.stopId,
                  ) + 1}
                </div>
                <div className="text-slate-400">
                  Distance:{" "}
                  {activeAssignedStop.distanceFromStartKm == null
                    ? "Calculated after save"
                    : `${activeAssignedStop.distanceFromStartKm} km`}
                </div>
              </>
            ) : null}

            {infoWindow.type === "available" && activeAvailableStop ? (
              <>
                <div className="font-medium text-slate-100">
                  {activeAvailableStop.stopName}
                </div>
                <div className="text-slate-400">Available stop</div>
              </>
            ) : null}
          </div>
        </InfoWindowF>
      ) : null}
    </GoogleMap>
  );
}