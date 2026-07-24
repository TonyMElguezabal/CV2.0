import { terminalClass } from "./HeroShellStyles";

export interface TerminalProps {
  lines: string[];
}

export function Terminal({ lines }: TerminalProps) {
  return (
    <div className={terminalClass}>
      {lines.map((line, index) => (
        // Lines are decorative flavor text, not distinct identifiable
        // records — index keys are stable since `lines` never reorders.
        <p key={index} style={{ margin: 0 }}>
          {line}
        </p>
      ))}
    </div>
  );
}
