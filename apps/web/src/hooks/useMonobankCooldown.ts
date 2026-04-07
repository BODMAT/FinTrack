"use client";

import { useEffect, useMemo, useState } from "react";
import { useMonobankCooldownStore } from "@/store/monobankCooldown";

export function useMonobankCooldown() {
  const nextAllowedAt = useMonobankCooldownStore(
    (state) => state.nextAllowedAt,
  );
  const startCooldown = useMonobankCooldownStore(
    (state) => state.startCooldown,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const remainingSeconds = useMemo(() => {
    const diff = nextAllowedAt - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / 1000);
  }, [nextAllowedAt, now]);

  return {
    isCooldownActive: remainingSeconds > 0,
    remainingSeconds,
    startCooldown,
  };
}
