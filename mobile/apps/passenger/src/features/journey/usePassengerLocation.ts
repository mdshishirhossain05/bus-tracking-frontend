import { useEffect, useState } from "react";
import * as Location from "expo-location";

export interface Coords {
  latitude: number;
  longitude: number;
}

/** One-shot foreground location, used to auto-pick the nearest stop. */
export function usePassengerLocation(): { coords: Coords | null; ready: boolean } {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let granted =
          (await Location.getForegroundPermissionsAsync()).status === "granted";
        if (!granted) {
          granted =
            (await Location.requestForegroundPermissionsAsync()).status ===
            "granted";
        }
        if (granted) {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (active) {
            setCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        }
      } catch {
        // Location is optional — the passenger can pick a stop manually.
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { coords, ready };
}
