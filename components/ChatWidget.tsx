"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { m, useReducedMotion } from "framer-motion";
import { MotionProvider } from "./MotionProvider";
import { useChatWidget } from "./ChatWidgetContext";
import { useIdleInvitation } from "./useIdleInvitation";
import { AssistantNameText } from "./AssistantNameText";
import type { ProfileContact } from "../lib/content/types.ts";
import {
  chatTriggerWrapperClass,
  chatTriggerClass,
  chatTriggerBotImageClass,
  chatTooltipClass,
  chatIdleBubbleClass,
  chatIdleBubbleDismissClass,
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
  idleInvitation: string;
}

export function ChatWidget({
  starterQuestions,
  contact,
  tooltipLabel,
  greeting,
  idleInvitation,
}: ChatWidgetProps) {
  const { isOpen, openChat } = useChatWidget();
  const [hasOpened, setHasOpened] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(isOpen);
  const { visible: idleBubbleVisible, dismiss: dismissIdleBubble } =
    useIdleInvitation({ isOpen });
  // `null` (SSR / not-yet-resolved) is treated as "not reduced" — matches
  // HeroFramer's/ChatPanel's own convention.
  const prefersReducedMotion = useReducedMotion() === true;

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
      <div id="chat" className={chatTriggerWrapperClass}>
        {!isOpen && (
          <span
            className={chatTooltipClass}
            aria-hidden="true"
            data-testid="chat-tooltip"
          >
            🤖 {tooltipLabel}
          </span>
        )}
        {idleBubbleVisible && (
          <MotionProvider>
            <m.div
              className={chatIdleBubbleClass}
              data-testid="chat-idle-bubble"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span>
                <AssistantNameText text={idleInvitation} />
              </span>
              <button
                type="button"
                aria-label="Dismiss invitation"
                className={chatIdleBubbleDismissClass}
                onClick={dismissIdleBubble}
              >
                ✕
              </button>
            </m.div>
          </MotionProvider>
        )}
        <button
          ref={triggerRef}
          type="button"
          className={chatTriggerClass}
          aria-expanded={isOpen}
          aria-label="Ask about Jose"
          onClick={openChat}
        >
          <img
            src="/chat-bot-body-112.png"
            alt=""
            aria-hidden="true"
            className={chatTriggerBotImageClass}
          />
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
