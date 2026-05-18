"use client";

import { useEffect, useRef, useState } from "react";

type UseAnimatedSpeedOptions = {
  targetSpeedKmh?: number | null;
  isStationary?: boolean;
  updatedAt?: string | null;
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function useAnimatedSpeed({
  targetSpeedKmh,
  isStationary = false,
  updatedAt,
}: UseAnimatedSpeedOptions) {
  const [displaySpeed, setDisplaySpeed] = useState<number | null>(
    targetSpeedKmh ?? null,
  );

  const animationFrameRef = useRef<number | null>(null);
  const currentSpeedRef = useRef<number>(targetSpeedKmh ?? 0);
  const targetSpeedRef = useRef<number>(targetSpeedKmh ?? 0);
  const lastFrameAtRef = useRef<number | null>(null);
  const lastUpdateKeyRef = useRef<string | null>(updatedAt ?? null);

  useEffect(() => {
    const nextTarget = Math.max(0, targetSpeedKmh ?? 0);
    targetSpeedRef.current = nextTarget;

    if (displaySpeed == null) {
      currentSpeedRef.current = nextTarget;
      setDisplaySpeed(round(nextTarget, 1));
    }

    if (updatedAt) {
      lastUpdateKeyRef.current = updatedAt;
    }
  }, [targetSpeedKmh, updatedAt, displaySpeed]);

  useEffect(() => {
    const accelerateRate = 8.5; // km/h per second
    const decelerateRate = 12; // km/h per second
    const hardBrakeRate = 20; // km/h per second
    const epsilon = 0.12;

    const tick = (now: number) => {
      if (lastFrameAtRef.current == null) {
        lastFrameAtRef.current = now;
      }

      const dt = Math.min((now - lastFrameAtRef.current) / 1000, 0.08);
      lastFrameAtRef.current = now;

      const current = currentSpeedRef.current;
      const target = targetSpeedRef.current;

      let next = current;

      if (isStationary) {
        next = Math.max(0, current - hardBrakeRate * dt);
      } else if (target > current) {
        next = Math.min(target, current + accelerateRate * dt);
      } else if (target < current) {
        const strongBrake = target < current * 0.5;
        const rate = strongBrake ? hardBrakeRate : decelerateRate;
        next = Math.max(target, current - rate * dt);
      }

      if (Math.abs(next - target) <= epsilon) {
        next = target;
      }

      if (next <= 0.15) {
        next = 0;
      }

      currentSpeedRef.current = next;
      setDisplaySpeed(round(next, 1));

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      lastFrameAtRef.current = null;
    };
  }, [isStationary]);

  return displaySpeed;
}
