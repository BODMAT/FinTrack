"use client";

import { useEffect } from "react";
import { captureClientError } from "@/lib/errorCapture";

export function GlobalErrorCapture() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      captureClientError({
        source: "window.error",
        title: "Unhandled runtime error",
        error: event.error ?? event.message,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureClientError({
        source: "window.unhandledrejection",
        title: "Unhandled promise rejection",
        error: event.reason,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
