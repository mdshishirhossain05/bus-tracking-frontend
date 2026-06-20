import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const HYBRID_KEY = "ubts.map.hybrid";
const TRAFFIC_KEY = "ubts.map.traffic";
const DARK_KEY = "ubts.map.dark";

/**
 * Map view preferences that persist across launches.
 *
 * - hybrid: when true, MapView swaps to "hybrid" mapType (satellite
 *   imagery with road labels overlaid).
 * - traffic: toggles Google's traffic overlay (red/yellow/green road
 *   tint). Especially useful in Dhaka so passengers see jams forming
 *   before ETA reflects them.
 * - darkMap: opt-in dark Google Maps style. The default is the
 *   standard bright Google Maps look every passenger already knows
 *   from their phone; this toggle restores the older dark-only theme
 *   for riders who prefer it (or who use the app heavily at night).
 *   Ignored when hybrid is on — satellite imagery overrides custom
 *   styles in Google Maps.
 */
export function useMapPrefs() {
  const [hybrid, setHybridState] = useState(false);
  const [traffic, setTrafficState] = useState(false);
  const [darkMap, setDarkMapState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [h, t, d] = await Promise.all([
          SecureStore.getItemAsync(HYBRID_KEY),
          SecureStore.getItemAsync(TRAFFIC_KEY),
          SecureStore.getItemAsync(DARK_KEY),
        ]);
        setHybridState(h === "1");
        setTrafficState(t === "1");
        setDarkMapState(d === "1");
      } catch {
        // SecureStore failures are non-fatal — we just stay on defaults.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setHybrid = useCallback((value: boolean) => {
    setHybridState(value);
    void SecureStore.setItemAsync(HYBRID_KEY, value ? "1" : "0").catch(
      () => undefined,
    );
  }, []);

  const setTraffic = useCallback((value: boolean) => {
    setTrafficState(value);
    void SecureStore.setItemAsync(TRAFFIC_KEY, value ? "1" : "0").catch(
      () => undefined,
    );
  }, []);

  const setDarkMap = useCallback((value: boolean) => {
    setDarkMapState(value);
    void SecureStore.setItemAsync(DARK_KEY, value ? "1" : "0").catch(
      () => undefined,
    );
  }, []);

  return {
    hybrid,
    setHybrid,
    traffic,
    setTraffic,
    darkMap,
    setDarkMap,
    hydrated,
  };
}

