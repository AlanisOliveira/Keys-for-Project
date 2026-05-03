"use client";

import { useEffect, useRef, useState } from "react";

const CLEAR_DELAY_MS = 30_000;

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function clearClipboard() {
    try {
      await navigator.clipboard.writeText("");
    } catch {
      // Best effort only.
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(async () => {
      await clearClipboard();
      setCopied(false);
    }, CLEAR_DELAY_MS);
  }

  return { copied, copy, clearClipboard, clearDelayMs: CLEAR_DELAY_MS };
}
