import { Fragment } from "react";
import { ASSISTANT_NAME_STYLED, ASSISTANT_NAME_SPOKEN } from "./assistantName";

export interface AssistantNameTextProps {
  text: string;
}

// Splits `text` around every occurrence of the assistant's styled name
// and wraps each occurrence in the aria-hidden/sr-only pair so assistive
// technology announces "Maria" rather than "Mar dot I A" — see
// assistantName.ts and chatbot-ui-restyle design.md Decision 3. Used for
// standalone strings (e.g. the idle bubble); the greeting's typing
// animation (Task Group 8) needs its own construction, since it already
// carries a single sr-only full-string layer of its own and derives that
// layer's text via toSpokenForm() directly rather than nesting this
// component inside a per-character animation.
export function AssistantNameText({ text }: AssistantNameTextProps) {
  const parts = text.split(ASSISTANT_NAME_STYLED);

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 && (
            <>
              <span aria-hidden="true">{ASSISTANT_NAME_STYLED}</span>
              <span className="sr-only">{ASSISTANT_NAME_SPOKEN}</span>
            </>
          )}
        </Fragment>
      ))}
    </>
  );
}
