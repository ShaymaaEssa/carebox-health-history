import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";

import { friendlyError } from "./errors";

type Options = {
  /** Fallback copy when the failure isn't a known category. */
  fallback?: string;
  /** Offer a retry affordance in the toast. */
  retry?: (() => void) | undefined;
};

/**
 * Reports a failed backend action: friendly toast, retry affordance for
 * connection problems, and a redirect to sign-in when the session expired.
 * Returns the friendly message so callers can also render it inline.
 */
export function useActionError() {
  const navigate = useNavigate();

  return useCallback(
    (error: unknown, options: Options = {}) => {
      const { message, kind } = friendlyError(error, options.fallback);

      if (kind === "session") {
        toast.error(message);
        navigate({ to: "/auth", search: { reason: "expired" }, replace: true });
        return message;
      }

      if (kind === "network" && options.retry) {
        toast.error(message, { action: { label: "Retry", onClick: options.retry } });
        return message;
      }

      toast.error(message);
      return message;
    },
    [navigate],
  );
}
