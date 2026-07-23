"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChatWidget } from "./ChatWidgetContext";
import { streamChat, ChatRequestError } from "../lib/chat/streamChat.ts";
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
  chatTriggerClass,
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

let messageIdCounter = 0;
function nextMessageId(): string {
  messageIdCounter += 1;
  return `chat-message-${messageIdCounter}`;
}

export interface ChatWidgetProps {
  starterQuestions: string[];
  contact: ProfileContact;
}

export function ChatWidget({ starterQuestions, contact }: ChatWidgetProps) {
  const { isOpen, openChat, closeChat } = useChatWidget();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  function handleClose() {
    closeChat();
    triggerRef.current?.focus();
  }

  async function submit(question: string) {
    const trimmed = question.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!trimmed) {
      return;
    }

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
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(inputValue);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={chatTriggerClass}
        aria-expanded={isOpen}
        onClick={openChat}
      >
        Ask about Jose
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="region"
            aria-label="Ask about Jose"
            className={chatPanelClass}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.15 }}
          >
            <div className={chatPanelHeaderClass}>
              <span className={chatPanelTitleClass}>Ask about Jose</span>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close chat"
                className={chatCloseButtonClass}
                onClick={handleClose}
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
            </div>

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
              <button type="submit" className={chatSubmitButtonClass}>
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
