import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Subscribes to the OS's "reduce motion" accessibility setting so
 * animations can flatten themselves for users who need it.
 *
 * Returns the current value (false until the first OS query resolves).
 * Re-renders whenever the setting changes.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => {
      if (active) setReduce(Boolean(v));
    });
    const sub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      (v) => setReduce(Boolean(v)),
    );
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);

  return reduce;
}
