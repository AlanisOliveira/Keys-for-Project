"use client";

import { useMemo, useState } from "react";

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

export function useRateLimit() {
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  const locked = useMemo(() => {
    return typeof lockUntil === "number" && Date.now() < lockUntil;
  }, [lockUntil]);

  function registerFailure() {
    setAttempts((current) => {
      const next = current + 1;
      if (next >= MAX_ATTEMPTS) {
        setLockUntil(Date.now() + LOCK_WINDOW_MS);
      }
      return next;
    });
  }

  function reset() {
    setAttempts(0);
    setLockUntil(null);
  }

  return {
    attempts,
    locked,
    lockUntil,
    maxAttempts: MAX_ATTEMPTS,
    lockWindowMs: LOCK_WINDOW_MS,
    remainingAttempts: Math.max(MAX_ATTEMPTS - attempts, 0),
    registerFailure,
    reset,
  };
}
