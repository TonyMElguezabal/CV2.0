"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { MotionProvider } from "./MotionProvider";
import { useChatWidget } from "./ChatWidgetContext";
import { streamChat, ChatRequestError } from "../lib/chat/streamChat.ts";
import { ChatGreetingText } from "./ChatGreetingText";
import { track } from "../lib/analytics/track.ts";
import type { Citation } from "../lib/rag/generate.ts";
import type { ProfileContact } from "../lib/content/types.ts";
import {
  chatCitationLinkClass,
  chatCitationListClass,
  chatCloseButtonClass,
  chatContactLinkClass,
  chatContactLinksClass,
  chatFormClass,
  chatGreetingClass,
  chatInputClass,
  chatMessageAssistantClass,
  chatMessageListClass,
  chatMessageSystemClass,
  chatMessageVisitorClass,
  chatPanelClass,
  chatPanelHeaderClass,
  chatPanelTitleClass,
  chatStarterQuestionButtonClass,
  chatStarterQuestionsClass,
  chatSubmitButtonClass,
  chatThinkingDotsRowClass,
  chatThinkingDotClass,
  chatThinkingDotAnimatedClass,
  chatBotWrapClass,
  chatBotBodyImageClass,
  chatBotArmImageClass,
  BOT_SALUTE_DURATION_SECONDS,
  BOT_SALUTE_ROTATE_KEYFRAMES,
  BOT_SALUTE_TIMES,
  BOT_ARM_TRANSFORM_ORIGIN,
} from "./ChatWidgetStyles";

interface DisplayMessage {
  id: string;
  role: "visitor" | "assistant" | "system";
  text: string;
  citations?: Citation[];
  contact?: ProfileContact;
}

const MAX_QUESTION_LENGTH = 500;
const RATE_LIMIT_MESSAGE =
  "You've reached the usage limit for this chat. Please try again shortly, or reach out directly.";
const UNAVAILABLE_MESSAGE =
  "The AI assistant is temporarily unavailable. Please try again shortly, or reach out directly.";
const GENERIC_ERROR_MESSAGE = "Something went wrong — try again.";

const THINKING_DOT_DELAYS_MS = [0, 150, 300];

let messageIdCounter = 0;
function nextMessageId(): string {
  messageIdCounter += 1;
  return `chat-message-${messageIdCounter}`;
}

export interface ChatPanelProps {
  starterQuestions: string[];
  contact: ProfileContact;
  greeting: string;
}

export function ChatPanel({ starterQuestions, contact, greeting }: ChatPanelProps) {
  const { isOpen, closeChat } = useChatWidget();
  // `null` (SSR / not-yet-resolved) is treated as "not reduced" — matches
  // HeroFramer's convention.
  const prefersReducedMotion = useReducedMotion() === true;
  const panelInitial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 };
  const panelAnimate = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const panelExit = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 };
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeChat();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeChat]);

  async function submit(question: string) {
    const trimmed = question.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!trimmed || isAwaitingResponse) {
      return;
    }

    setIsAwaitingResponse(true);
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: "visitor", text: trimmed },
    ]);
    setInputValue("");

    const assistantId = nextMessageId();

    // Count-only, per the PRD §F8 privacy rule — no question text is ever
    // passed to track().
    track({
      eventType: "question_asked",
      pagePath: window.location.pathname,
    });

    try {
      for await (const event of streamChat(trimmed)) {
        if (event.type === "token") {
          setMessages((prev) => {
            const exists = prev.some((message) => message.id === assistantId);
            if (!exists) {
              setIsAwaitingResponse(false);
              return [
                ...prev,
                { id: assistantId, role: "assistant", text: event.value },
              ];
            }
            return prev.map((message) =>
              message.id === assistantId
                ? { ...message, text: message.text + event.value }
                : message,
            );
          });
        } else if (event.type === "citations") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? { ...message, citations: event.value }
                : message,
            ),
          );
        }
      }
    } catch (error) {
      if (error instanceof ChatRequestError && error.status === 429) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            role: "system",
            text: RATE_LIMIT_MESSAGE,
            contact,
          },
        ]);
      } else if (error instanceof ChatRequestError && error.status === 503) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            role: "system",
            text: UNAVAILABLE_MESSAGE,
            contact,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            role: "system",
            text: GENERIC_ERROR_MESSAGE,
          },
        ]);
      }
    } finally {
      setIsAwaitingResponse(false);
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(inputValue);
  }

  return (
    <MotionProvider>
      <AnimatePresence>
        {isOpen && (
          <m.div
            role="region"
            aria-label="Ask about Jose"
            className={chatPanelClass}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={{ duration: 0.15 }}
          >
            <div className={chatPanelHeaderClass}>
              <span className={chatPanelTitleClass}>Ask about Jose</span>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close chat"
                className={chatCloseButtonClass}
                onClick={closeChat}
              >
                ✕
              </button>
            </div>

            <div className={chatMessageListClass} aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "visitor"
                      ? chatMessageVisitorClass
                      : message.role === "assistant"
                        ? chatMessageAssistantClass
                        : chatMessageSystemClass
                  }
                >
                  <p style={{ margin: 0 }}>{message.text}</p>
                  {message.citations && message.citations.length > 0 && (
                    <ul className={chatCitationListClass}>
                      {message.citations.map((citation) => (
                        <li key={citation.anchor}>
                          <a
                            href={citation.anchor}
                            className={chatCitationLinkClass}
                          >
                            {citation.anchor}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {message.contact && (
                    <div className={chatContactLinksClass}>
                      <a
                        href={`mailto:${message.contact.email}`}
                        className={chatContactLinkClass}
                      >
                        Email
                      </a>
                      <a
                        href={message.contact.scheduling}
                        className={chatContactLinkClass}
                      >
                        Schedule a call
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {isAwaitingResponse && (
                <div
                  className={chatMessageAssistantClass}
                  data-testid="chat-thinking-indicator"
                >
                  <span className={chatThinkingDotsRowClass} aria-hidden="true">
                    {THINKING_DOT_DELAYS_MS.map((delay) => (
                      <span
                        key={delay}
                        className={
                          prefersReducedMotion
                            ? chatThinkingDotClass
                            : chatThinkingDotAnimatedClass
                        }
                        style={
                          prefersReducedMotion
                            ? undefined
                            : { animationDelay: `${delay}ms` }
                        }
                      />
                    ))}
                  </span>
                  <span className="sr-only" role="status">
                    Thinking…
                  </span>
                </div>
              )}
            </div>

            {messages.length === 0 && (
              <>
                <div className={chatBotWrapClass} aria-hidden="true">
                  <img
                    src="/chat-bot-body-240.png"
                    alt=""
                    aria-hidden="true"
                    data-testid="chat-bot-body"
                    className={chatBotBodyImageClass}
                  />
                  <m.img
                    src="/chat-bot-arm-240.png"
                    alt=""
                    aria-hidden="true"
                    data-testid="chat-bot-arm"
                    className={chatBotArmImageClass}
                    style={{ transformOrigin: BOT_ARM_TRANSFORM_ORIGIN }}
                    data-salute={prefersReducedMotion ? "off" : "on"}
                    initial={{ rotate: 0 }}
                    animate={
                      prefersReducedMotion
                        ? { rotate: 0 }
                        : { rotate: BOT_SALUTE_ROTATE_KEYFRAMES }
                    }
                    transition={
                      prefersReducedMotion
                        ? undefined
                        : {
                            duration: BOT_SALUTE_DURATION_SECONDS,
                            times: BOT_SALUTE_TIMES,
                            ease: "easeInOut",
                            repeat: Infinity,
                          }
                    }
                  />
                </div>
                <p className={chatGreetingClass} data-testid="chat-greeting">
                  <ChatGreetingText
                    text={greeting}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                </p>
              </>
            )}

            {messages.length === 0 && starterQuestions.length > 0 && (
              <div className={chatStarterQuestionsClass}>
                {starterQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className={chatStarterQuestionButtonClass}
                    onClick={() => void submit(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <form className={chatFormClass} onSubmit={handleFormSubmit}>
              <input
                type="text"
                aria-label="Ask a question"
                className={chatInputClass}
                maxLength={MAX_QUESTION_LENGTH}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask a question…"
              />
              <button
                type="submit"
                className={chatSubmitButtonClass}
                disabled={isAwaitingResponse}
              >
                Send
              </button>
            </form>
          </m.div>
        )}
      </AnimatePresence>
    </MotionProvider>
  );
}
