"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A polite live region that only speaks once `message` has stopped changing
 * for `delay` ms, and never on first render. Several quick servings taps
 * produce one announcement of the final total instead of one per tap.
 */
export function DelayedAnnouncement({ message, delay = 900 }: { message: string; delay?: number }) {
  const [spoken, setSpoken] = useState("");
  const initial = useRef(message);

  useEffect(() => {
    if (message === initial.current) return;
    const timer = window.setTimeout(() => {
      initial.current = message;
      setSpoken(message);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [message, delay]);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {spoken}
    </p>
  );
}
