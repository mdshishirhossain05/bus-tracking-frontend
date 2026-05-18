"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  MarkerF,
  useLoadScript,
  type Libraries,
} from "@react-google-maps/api";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/config/env";

interface StopLocationPickerMapProps {
  lat: number | null;
  lng: number | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  onPickLocation?: (payload: {
    lat: number;
    lng: number;
    suggestedStopName: string;
    fullAddress: string;
  }) => void;
}

type LatLngPoint = google.maps.LatLngLiteral;

const GOOGLE_MAP_LIBRARIES: Libraries = ["places"];

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

function normalizeCoord(value: number) {
  return Number(value.toFixed(7));
}

function buildCoordinateAddress(coords: { lat: number; lng: number }) {
  return `Coordinates: ${coords.lat.toFixed(7)}, ${coords.lng.toFixed(7)}`;
}

function normalizePlaceName(place: google.maps.places.PlaceResult) {
  const candidates = [
    place.name,
    place.formatted_address?.split(",")[0],
    place.vicinity,
  ]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

  return candidates[0] ?? "Selected Stop";
}

function normalizePlaceAddress(place: google.maps.places.PlaceResult) {
  return (
    place.formatted_address?.trim() ||
    place.vicinity?.trim() ||
    place.name?.trim() ||
    "Selected Google Maps place"
  );
}

function buildDhakaBiasBounds() {
  const lat = env.NEXT_PUBLIC_MAP_DEFAULT_LAT;
  const lng = env.NEXT_PUBLIC_MAP_DEFAULT_LNG;
  const latDelta = 0.35;
  const lngDelta = 0.45;

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

export function StopLocationPickerMap({
  lat,
  lng,
  onChange,
  onPickLocation,
}: StopLocationPickerMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [placesReady, setPlacesReady] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef =
    useRef<google.maps.places.Autocomplete | null>(null);

  const hasGoogleKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0;

  const center = useMemo<LatLngPoint>(() => {
    if (lat != null && lng != null) {
      return { lat, lng };
    }

    return {
      lat: env.NEXT_PUBLIC_MAP_DEFAULT_LAT,
      lng: env.NEXT_PUBLIC_MAP_DEFAULT_LNG,
    };
  }, [lat, lng]);

  const selectedPosition = useMemo<LatLngPoint | null>(() => {
    if (lat == null || lng == null) return null;
    return { lat, lng };
  }, [lat, lng]);

  const markerIcon = useMemo<google.maps.Symbol | undefined>(() => {
    if (!isLoaded || typeof google === "undefined") return undefined;

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: "#0f172a",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeOpacity: 1,
      strokeWeight: 3,
    };
  }, [isLoaded]);

  const handleCoordinateSelection = useCallback(
    (coords: {
      lat: number;
      lng: number;
      suggestedStopName?: string;
      fullAddress?: string;
    }) => {
      const normalized = {
        lat: normalizeCoord(coords.lat),
        lng: normalizeCoord(coords.lng),
      };

      onChange(normalized);

      onPickLocation?.({
        lat: normalized.lat,
        lng: normalized.lng,
        suggestedStopName: coords.suggestedStopName ?? "Selected Stop",
        fullAddress: coords.fullAddress ?? buildCoordinateAddress(normalized),
      });

      const map = mapRef.current;
      if (map) {
        map.panTo(normalized);
        if ((map.getZoom() ?? env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM) < 16) {
          map.setZoom(16);
        }
      }
    },
    [onChange, onPickLocation],
  );

  const handlePlaceSelected = useCallback(() => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const location = place.geometry?.location;

    if (!location) {
      setSearchError(
        "Google Maps could not resolve this place. Please choose a suggested result or click directly on the map.",
      );
      return;
    }

    const next = {
      lat: location.lat(),
      lng: location.lng(),
    };

    const suggestedStopName = normalizePlaceName(place);
    const fullAddress = normalizePlaceAddress(place);

    setSearchQuery(fullAddress);
    setSearchError(null);

    handleCoordinateSelection({
      ...next,
      suggestedStopName,
      fullAddress,
    });
  }, [handleCoordinateSelection]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!searchInputRef.current) return;
    if (autocompleteRef.current) return;
    if (!google.maps.places?.Autocomplete) {
      setPlacesReady(false);
      setSearchError(
        "Google Places is not available. Enable Places API for this API key.",
      );
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        fields: ["place_id", "name", "formatted_address", "geometry", "vicinity"],
        componentRestrictions: {
          country: "bd",
        },
        strictBounds: false,
      },
    );

    autocomplete.setBounds(buildDhakaBiasBounds());

    const listener = autocomplete.addListener(
      "place_changed",
      handlePlaceSelected,
    );

    autocompleteRef.current = autocomplete;
    setPlacesReady(true);

    return () => {
      listener.remove();
      autocompleteRef.current = null;
      setPlacesReady(false);
    };
  }, [handlePlaceSelected, isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPosition) return;

    map.panTo(selectedPosition);
    if ((map.getZoom() ?? env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM) < 16) {
      map.setZoom(16);
    }
  }, [selectedPosition]);

  async function handleUseMyLocation() {
    if (!("geolocation" in navigator)) {
      setSearchError("This device/browser does not support location access.");
      return;
    }

    try {
      setLocating(true);
      setSearchError(null);

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        },
      );

      const normalized = {
        lat: normalizeCoord(position.coords.latitude),
        lng: normalizeCoord(position.coords.longitude),
      };

      setSearchQuery(buildCoordinateAddress(normalized));

      handleCoordinateSelection({
        ...normalized,
        suggestedStopName: "My Current Location",
        fullAddress: buildCoordinateAddress(normalized),
      });
    } catch (error) {
      console.error("My location failed:", error);
      setSearchError(
        "Unable to get your current location. Check browser/device permission and try again.",
      );
    } finally {
      setLocating(false);
    }
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSearchError(null);
    searchInputRef.current?.focus();
  }

  if (!hasGoogleKey) {
    return (
      <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-300">
        Google Maps API key is missing. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to
        .env.local and Vercel Environment Variables.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-sm border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
        Google Maps failed to load. Check API key restrictions, Maps JavaScript
        API, Places API, and billing status.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-sm border border-slate-800 bg-slate-950 text-sm text-slate-500 sm:h-[420px]">
        Loading Google Maps...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style jsx global>{`
        .pac-container {
          z-index: 99999 !important;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
          overflow: hidden;
          margin-top: 8px;
          font-family: inherit;
        }

        .pac-item {
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px;
          line-height: 1.4;
        }

        .pac-item:hover {
          background: #f8fafc;
        }

        .pac-item-query {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
      `}</style>

      <div className="overflow-hidden rounded-sm border border-slate-800">
        <div className="relative h-[320px] w-full sm:h-[420px]">
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
            onClick={(event) => {
              const clickedLat = event.latLng?.lat();
              const clickedLng = event.latLng?.lng();

              if (clickedLat == null || clickedLng == null) return;

              const normalized = {
                lat: normalizeCoord(clickedLat),
                lng: normalizeCoord(clickedLng),
              };

              setSearchQuery(buildCoordinateAddress(normalized));

              handleCoordinateSelection({
                ...normalized,
                suggestedStopName: "Selected Stop",
                fullAddress: buildCoordinateAddress(normalized),
              });
            }}
          >
            {selectedPosition ? (
              <MarkerF
                position={selectedPosition}
                draggable
                icon={markerIcon}
                onDragEnd={(event) => {
                  const nextLat = event.latLng?.lat();
                  const nextLng = event.latLng?.lng();

                  if (nextLat == null || nextLng == null) return;

                  const normalized = {
                    lat: normalizeCoord(nextLat),
                    lng: normalizeCoord(nextLng),
                  };

                  setSearchQuery(buildCoordinateAddress(normalized));

                  handleCoordinateSelection({
                    ...normalized,
                    suggestedStopName: "Selected Stop",
                    fullAddress: buildCoordinateAddress(normalized),
                  });
                }}
              />
            ) : null}
          </GoogleMap>

          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 sm:left-4 sm:right-4 sm:top-4">
            <div className="pointer-events-auto">
              <div className="overflow-hidden rounded-[22px] bg-slate-900 shadow-[0_2px_12px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <input
                    ref={searchInputRef}
                    placeholder="Search places with Google Maps"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setSearchError(null);
                    }}
                    className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-[15px] font-medium text-slate-100 outline-none placeholder:text-slate-500"
                    autoComplete="off"
                    spellCheck={false}
                  />

                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="shrink-0 rounded-full p-1 text-slate-500 transition hover:bg-slate-800"
                      aria-label="Clear search"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  ) : null}

                  <div
                    className="shrink-0 rounded-full p-1 text-slate-500"
                    title={
                      placesReady
                        ? "Google Places search ready"
                        : "Waiting for Google Places"
                    }
                  >
                    <Search className="h-5 w-5" />
                  </div>
                </div>

                {searchError ? (
                  <div className="border-t border-slate-800 bg-slate-900 px-4 py-3 text-sm text-amber-300">
                    {searchError}
                  </div>
                ) : null}

                {!placesReady ? (
                  <div className="border-t border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-500">
                    Preparing Google Places search...
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-3 right-3 z-10 sm:bottom-4 sm:right-4">
            <div className="pointer-events-auto">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleUseMyLocation()}
                disabled={locating}
                className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 p-0 shadow-md hover:bg-slate-950"
                title="Use My Location"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {lat != null && lng != null ? (
              <span>
                Selected: {lat.toFixed(7)}, {lng.toFixed(7)}
              </span>
            ) : (
              <span>No location selected yet.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}