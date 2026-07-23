"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { track } from "../lib/analytics/track.ts";

interface ChatWidgetContextValue {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const ChatWidgetContext = createContext<ChatWidgetContextValue | undefined>(
  undefined,
);

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openChat = useCallback(() => {
    setIsOpen(true);
    track({ eventType: "chat_open", pagePath: window.location.pathname });
  }, []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const value = useMemo(
    () => ({ isOpen, openChat, closeChat }),
    [isOpen, openChat, closeChat],
  );

  return (
    <ChatWidgetContext.Provider value={value}>
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget(): ChatWidgetContextValue {
  const context = useContext(ChatWidgetContext);
  if (!context) {
    throw new Error("useChatWidget must be used within a ChatWidgetProvider");
  }
  return context;
}
