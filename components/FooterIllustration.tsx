"use client";

import { m, useReducedMotion } from "framer-motion";
import { MotionProvider } from "./MotionProvider";
import {
  FOOTER_ELBOW_TRANSFORM_ORIGIN,
  FOOTER_WAG_DURATION_SECONDS,
  FOOTER_WAG_ROTATE_KEYFRAMES,
  FOOTER_WAG_TIMES,
  footerGlowClass,
  footerIllustrationClass,
  footerIllustrationSvgClass,
} from "./SiteFooterStyles";

// Transcribed from the owner's vector-concept artifact
// (docs/design/jos-191-disruptive-footer/README.md has full provenance):
// the body image is the existing chat-widget render (public/maria-footer-body-469x564.png,
// byte-identical to docs/design/jos-121-chatbot-ui/bot-source/bot-body-469x564.png),
// clipped to drop its baked-in arm stub; every hand, the face, and both
// limbs are hand-authored vector shapes layered on top.
const CANVAS_WIDTH = 469;
const CANVAS_HEIGHT = 564;
const BODY_SRC = "/maria-footer-body-469x564.png";
const VISOR_CYAN = "#5ee6f0";
const SHELL = { fill: "url(#footerHandShell)", stroke: "#a7adb7", strokeWidth: 1 };
const CURL = { fill: "url(#footerHandShell)", stroke: "#9aa0aa", strokeWidth: 1.1 };

// Motion props for the forearm group. Reduced motion means no animate prop, so the
// forearm sits at rest. Returned as a plain object so it can be tested directly.
export function footerWagMotionProps(prefersReducedMotion: boolean) {
  return {
    animate: prefersReducedMotion
      ? undefined
      : { rotate: FOOTER_WAG_ROTATE_KEYFRAMES },
    transition: {
      duration: FOOTER_WAG_DURATION_SECONDS,
      times: FOOTER_WAG_TIMES,
      repeat: Infinity,
    },
  };
}

// Binary floating point can turn e.g. 48 * 0.3 into 14.399999999999999 —
// round derived SVG attribute values so the rendered markup stays clean.
const round2 = (n: number) => Math.round(n * 100) / 100;

// A shaded limb: a base stroke plus an offset shade and a highlight stroke,
// each a separate <line> (a userSpace gradient on a <line> stroke didn't
// render in Chrome when this was prototyped).
function Limb({
  x1,
  y1,
  x2,
  y2,
  width,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cdd1d8" strokeWidth={width} strokeLinecap="round" />
      <line
        x1={round2(x1 + width * 0.25)}
        y1={y1}
        x2={round2(x2 + width * 0.25)}
        y2={y2}
        stroke="#a3a8b2"
        strokeWidth={round2(width * 0.3)}
        strokeLinecap="round"
        opacity={0.55}
      />
      <line
        x1={round2(x1 - width * 0.2)}
        y1={y1}
        x2={round2(x2 - width * 0.2)}
        y2={y2}
        stroke="#f4f6f9"
        strokeWidth={round2(width * 0.32)}
        strokeLinecap="round"
        opacity={0.65}
      />
    </>
  );
}

function PointingHand() {
  return (
    <g>
      <rect x={-29} y={-122} width={19} height={74} rx={9.5} {...SHELL} />
      <path d="M-25 -99 q5.5 2.6 11 0 M-25 -79 q5.5 2.6 11 0" stroke="#a0a6b0" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <rect x={-25.5} y={-118} width={4} height={34} rx={2} fill="#fff" opacity={0.75} />
      <rect x={-27} y={-10} width={54} height={18} rx={9} {...SHELL} />
      <rect x={-31} y={-66} width={62} height={60} rx={22} {...SHELL} />
      <rect x={-12} y={-62} width={42} height={15} rx={7.5} {...CURL} />
      <rect x={-12} y={-48} width={42} height={15} rx={7.5} {...CURL} />
      <rect x={-12} y={-34} width={40} height={14} rx={7} {...CURL} />
      <rect x={-30} y={-27} width={40} height={15} rx={7.5} transform="rotate(-14 -10 -20)" {...CURL} />
      <ellipse cx={-16} cy={-52} rx={9} ry={5} fill="#fff" opacity={0.55} />
    </g>
  );
}

function RestingHand() {
  return (
    <g>
      <rect x={-27} y={-8} width={54} height={18} rx={9} {...SHELL} />
      <rect x={-29} y={6} width={58} height={52} rx={21} {...SHELL} />
      <rect x={-18} y={16} width={40} height={13} rx={6.5} {...CURL} />
      <rect x={-18} y={29} width={40} height={13} rx={6.5} {...CURL} />
      <rect x={-16} y={42} width={36} height={12} rx={6} {...CURL} />
      <rect x={-33} y={10} width={15} height={36} rx={7.5} transform="rotate(8 -25 28)" {...CURL} />
      <ellipse cx={-4} cy={14} rx={10} ry={4.5} fill="#fff" opacity={0.5} />
    </g>
  );
}

// A fresh visor fill, covering the body render's original smile, stern
// brows, narrowed eyes, and an open "come on" mouth.
function ComeOnFace() {
  return (
    <g>
      <rect x={93} y={77} width={284} height={168} rx={48} fill="url(#footerVisor)" />
      <g fill={VISOR_CYAN} stroke={VISOR_CYAN} filter="url(#footerGlow)">
        <path d="M133 129 L192 147" strokeWidth={10} strokeLinecap="round" fill="none" />
        <path d="M337 129 L278 147" strokeWidth={10} strokeLinecap="round" fill="none" />
        <path d="M140 155 L190 166 Q188 183 165 183 Q142 183 140 163 Z" strokeWidth={0} />
        <path d="M330 155 L280 166 Q282 183 305 183 Q328 183 330 163 Z" strokeWidth={0} />
        <ellipse cx={235} cy={214} rx={23} ry={16} strokeWidth={0} />
      </g>
      <ellipse cx={235} cy={218} rx={15} ry={8.5} fill="#0d1920" />
      <path d="M118 94 Q150 84 196 86" stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.12} />
    </g>
  );
}

export function FooterIllustration() {
  const prefersReducedMotion = useReducedMotion() === true;
  const wag = footerWagMotionProps(prefersReducedMotion);

  return (
    <MotionProvider>
      <div aria-hidden="true" className={footerIllustrationClass}>
        <div aria-hidden="true" className={footerGlowClass} />
        <svg
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          className={footerIllustrationSvgClass}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="footerHandShell" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#f8f9fb" />
              <stop offset=".55" stopColor="#dfe2e8" />
              <stop offset="1" stopColor="#b1b6c0" />
            </linearGradient>
            <radialGradient id="footerVisor" cx=".5" cy=".45" r=".65">
              <stop offset="0" stopColor="#1f4256" />
              <stop offset=".6" stopColor="#16303f" />
              <stop offset="1" stopColor="#0d1920" />
            </radialGradient>
            <filter id="footerSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1b2230" floodOpacity=".35" />
            </filter>
            <filter id="footerGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Trims the render's baked-in arm stub so the vector hand replaces it cleanly. */}
            <clipPath id="footerBodyClip">
              <polygon points="0,0 469,0 469,564 85,564 85,470 0,470" />
            </clipPath>
          </defs>

          <image
            data-layer="body"
            href={BODY_SRC}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            clipPath="url(#footerBodyClip)"
          />
          <ComeOnFace />
          <g transform="translate(424 490) rotate(-12) scale(1.12)" filter="url(#footerSoftShadow)">
            <RestingHand />
          </g>
          <Limb x1={128} y1={318} x2={66} y2={420} width={56} />

          <m.g
            data-layer="forearm"
            style={{ transformOrigin: FOOTER_ELBOW_TRANSFORM_ORIGIN }}
            animate={wag.animate}
            transition={wag.transition}
          >
            <Limb x1={66} y1={420} x2={70} y2={345} width={48} />
            <g transform="translate(70 345) scale(1.3)" filter="url(#footerSoftShadow)">
              <PointingHand />
            </g>
          </m.g>
        </svg>
      </div>
    </MotionProvider>
  );
}
