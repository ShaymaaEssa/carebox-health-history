/**
 * Maps backend / network failures to friendly, user-safe messages.
 * Raw Postgres or Supabase error strings must never reach the UI.
 */

export const ATTACHMENT_LIMIT_MESSAGE =
  "You've reached the 4-attachment limit for this prescription.";

export type FriendlyError = {
  message: string;
  /** "session" means the user must sign in again. */
  kind: "generic" | "network" | "session" | "limit";
};

type LooseError = {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  name?: unknown;
  error_description?: unknown;
};

function readError(error: unknown): LooseError {
  if (typeof error === "string") return { message: error };
  if (error && typeof error === "object") return error as LooseError;
  return {};
}

export function friendlyError(error: unknown, fallback?: string): FriendlyError {
  const e = readError(error);
  const raw = typeof e.message === "string" ? e.message : "";
  const lower = raw.toLowerCase();
  const code = typeof e.code === "string" ? e.code : "";
  const status = typeof e.status === "number" ? e.status : undefined;

  if (lower.includes("attachment limit reached") || lower.includes("attachment limit")) {
    return { message: ATTACHMENT_LIMIT_MESSAGE, kind: "limit" };
  }

  // Expired / missing session.
  if (
    status === 401 ||
    code === "PGRST301" ||
    code === "42501" ||
    lower.includes("jwt expired") ||
    lower.includes("invalid claim") ||
    lower.includes("refresh token") ||
    lower.includes("not authenticated") ||
    lower.includes("session missing")
  ) {
    return {
      message: "Your session expired. Please sign in again to continue.",
      kind: "session",
    };
  }

  // Network / timeout.
  if (
    e.name === "AbortError" ||
    e.name === "TypeError" ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("timeout") ||
    lower.includes("fetch failed")
  ) {
    return {
      message: "Couldn't connect — check your connection and try again.",
      kind: "network",
    };
  }

  // Constraint / FK / not-null / unique violations and other Postgres noise.
  if (/^2[23]\d{3}$/.test(code) || lower.includes("violates") || lower.includes("constraint")) {
    return { message: "Something went wrong saving this — please try again.", kind: "generic" };
  }

  return {
    message: fallback ?? "Something went wrong — please try again.",
    kind: "generic",
  };
}

export function friendlyMessage(error: unknown, fallback?: string) {
  return friendlyError(error, fallback).message;
}
