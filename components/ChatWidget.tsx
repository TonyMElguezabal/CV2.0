"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useChatWidget } from "./ChatWidgetContext";
import type { ProfileContact } from "../lib/content/types.ts";
import {
  chatTriggerWrapperClass,
  chatTriggerClass,
  chatTooltipClass,
} from "./ChatWidgetStyles";

// The panel (framer-motion, streaming, citations) is the heaviest part of
// the chat surface — it's dynamically imported so it and its motion cost
// are absent from the initial page bundle. Loaded once, on first open, and
// kept mounted afterward so its own AnimatePresence can exit-animate future
// closes — see design.md Decision 2.
const ChatPanel = dynamic(
  () => import("./ChatPanel").then((mod) => mod.ChatPanel),
  { ssr: false },
);

export interface ChatWidgetProps {
  starterQuestions: string[];
  contact: ProfileContact;
  tooltipLabel: string;
  greeting: string;
}

export function ChatWidget({
  starterQuestions,
  contact,
  tooltipLabel,
  greeting,
}: ChatWidgetProps) {
  const { isOpen, openChat } = useChatWidget();
  const [hasOpened, setHasOpened] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen) {
      setHasOpened(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  return (
    <>
      <div className={chatTriggerWrapperClass}>
        {!isOpen && (
          <span
            className={chatTooltipClass}
            aria-hidden="true"
            data-testid="chat-tooltip"
          >
            🤖 {tooltipLabel}
          </span>
        )}
        <button
          ref={triggerRef}
          type="button"
          className={chatTriggerClass}
          aria-expanded={isOpen}
          onClick={openChat}
        >
          Ask about Jose
        </button>
      </div>
      {hasOpened && (
        <ChatPanel
          starterQuestions={starterQuestions}
          contact={contact}
          greeting={greeting}
        />
      )}
    </>
  );
}
