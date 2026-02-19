/**
 * Wind Energy Simulator — requestAnimationFrame loop for smooth 60fps updates.
 * Returns current time and a running flag; physics values are passed from parent.
 */

import { useRef, useEffect, useState } from "react";

export function useAnimationFrame(isRunning: boolean): number {
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!isRunning) return;

    const tick = (now: number) => {
      if (startRef.current === 0) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      setTime(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      startRef.current = 0;
    };
  }, [isRunning]);

  return time;
}
