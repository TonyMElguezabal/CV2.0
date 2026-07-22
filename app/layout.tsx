import type { Metadata } from "next";
import "./globals.css";
import { getFaq, getProfile } from "@/lib/content/read.ts";
import { ChatWidgetProvider } from "@/components/ChatWidgetContext";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "CareerDNA — Jose Muñoz",
  description: "Interactive professional profile.",
};

const STARTER_QUESTION_COUNT = 5;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const starterQuestions = getFaq()
    .slice(0, STARTER_QUESTION_COUNT)
    .map((entry) => entry.question);
  const { contact } = getProfile();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ChatWidgetProvider>
          {children}
          <ChatWidget starterQuestions={starterQuestions} contact={contact} />
        </ChatWidgetProvider>
      </body>
    </html>
  );
}
