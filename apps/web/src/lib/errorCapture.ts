import { reportClientError } from "@/api/admin";
import { useAuthStore } from "@/store/useAuthStore";

const RECENT_ERRORS_TTL_MS = 60_000;
const recentErrors = new Map<string, number>();

function cleanupRecentErrors() {
  const now = Date.now();
  for (const [fingerprint, timestamp] of recentErrors) {
    if (now - timestamp > RECENT_ERRORS_TTL_MS) {
      recentErrors.delete(fingerprint);
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error && typeof error.stack === "string") {
    return error.stack.slice(0, 20_000);
  }
  return undefined;
}

function buildFingerprint(source: string, message: string): string {
  return `${source}::${message.slice(0, 200)}`;
}

function shouldSkipReport(source: string): boolean {
  if (typeof window === "undefined") return true;
  if (!useAuthStore.getState().isAuthenticated) return true;
  if (source.includes("/admin/error-logs/report")) return true;
  return false;
}

function shouldSkipByMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("canceled") ||
    msg.includes("aborted") ||
    msg.includes("network error") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("timeout")
  );
}

export function captureClientError(params: {
  source: string;
  error: unknown;
  title?: string;
  context?: Record<string, unknown>;
}) {
  if (shouldSkipReport(params.source)) return;

  cleanupRecentErrors();

  const message = getErrorMessage(params.error);
  if (shouldSkipByMessage(message)) return;

  const fingerprint = buildFingerprint(params.source, message);
  if (recentErrors.has(fingerprint)) return;
  recentErrors.set(fingerprint, Date.now());

  void reportClientError({
    title: params.title ?? "Client runtime error",
    message,
    stack: getErrorStack(params.error),
    source: params.source,
    context: params.context,
  }).catch(() => {
    // swallow reporting errors to avoid loops
  });
}
