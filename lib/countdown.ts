"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const emptyCountdown: CountdownParts = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

function getTimeLeft(targetMs: number): CountdownParts {
  const distance = Math.max(targetMs - Date.now(), 0);
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function useCountdown(targetDate: string, onComplete?: () => void) {
  const targetMs = useMemo(() => new Date(targetDate).getTime(), [targetDate]);
  const [timeLeft, setTimeLeft] = useState<CountdownParts>(() =>
    Number.isFinite(targetMs) ? getTimeLeft(targetMs) : emptyCountdown,
  );
  const [tick, setTick] = useState(0);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (!Number.isFinite(targetMs)) {
      return;
    }

    const update = () => {
      const next = getTimeLeft(targetMs);
      const isComplete = Object.values(next).every((value) => value === 0);

      setTimeLeft(next);
      setTick((current) => current + 1);

      if (isComplete && !hasCompleted.current) {
        hasCompleted.current = true;
        onComplete?.();
      }
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [onComplete, targetMs]);

  return {
    timeLeft,
    tick,
    isComplete: Object.values(timeLeft).every((value) => value === 0),
  };
}
