"use client";

import { useEffect, useRef, useState } from "react";

export const MIN_DELAY_MS = 60_000;
export const MAX_DELAY_MS = 5 * 60_000;
export const SESSION_STORAGE_KEY = "chat-widget-interacted";

function randomDelayMs(): number {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function hasInteracted(): boolean {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
  } catch {
    // sessionStorage unavailable (e.g. privacy mode) — treat as
    // not-yet-interacted rather than throwing.
    return false;
  }
}

function markInteracted(): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
  } catch {
    // Unavailable storage just means the bubble keeps reappearing across
    // reloads in that session — no functional break, nothing to recover.
  }
}

export interface UseIdleInvitationOptions {
  isOpen: boolean;
}

export interface UseIdleInvitationResult {
  visible: boolean;
  dismiss: () => void;
}

// Schedules the idle invitation bubble on a randomised 1-5 minute cadence,
// repeating until the visitor opens the chat — chat-idle-invitation spec.
// Suppression persists for the rest of the browsing session via
// sessionStorage, a deliberate, documented departure from lib/session.ts's
// in-memory-only convention (chatbot-ui-restyle design.md Decision 5): a
// "bubble already seen" boolean carries no personal data and is never
// transmitted, so the privacy rationale behind that convention doesn't
// apply here — but the departure is real and intentional, not an
// oversight.
//
// Visibility handling matches AmbientSparkleLayer.tsx's established
// pattern (`document.visibilityState`, a `visibilitychange` listener)
// rather than `document.hidden`, for consistency with the one other
// continuously-scheduled surface already in this codebase. Pausing means
// the pending timer is cleared while hidden and a fresh one is scheduled
// on return — not exact remaining-time preservation, which would need
// extra bookkeeping this requirement doesn't call for.
export function useIdleInvitation({
  isOpen,
}: UseIdleInvitationOptions): UseIdleInvitationResult {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearPendingTimer() {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    if (isOpen) {
      markInteracted();
      setVisible(false);
      clearPendingTimer();
      return;
    }

    if (hasInteracted()) {
      return;
    }

    function schedule() {
      clearPendingTimer();
      timerRef.current = setTimeout(() => {
        setVisible(true);
        // Arms the next appearance immediately — the bubble keeps
        // reappearing on cadence regardless of whether this one is
        // dismissed early.
        schedule();
      }, randomDelayMs());
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        clearPendingTimer();
      } else {
        schedule();
      }
    }

    if (document.visibilityState !== "hidden") {
      schedule();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearPendingTimer();
    };
  }, [isOpen]);

  function dismiss() {
    setVisible(false);
  }

  return { visible, dismiss };
}
