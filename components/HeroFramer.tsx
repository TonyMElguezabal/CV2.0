"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  heroWrapperClass,
  heroNameClass,
  heroPositioningClass,
  spacerSectionClass,
} from "./HeroShellStyles";

export interface HeroProps {
  name: string;
  positioning: string;
}

export function HeroFramer({ name, positioning }: HeroProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <>
      <motion.div
        ref={wrapperRef}
        className={heroWrapperClass}
        style={{ opacity, y }}
      >
        <motion.h1
          className={heroNameClass}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {name}
        </motion.h1>
        <motion.p
          className={heroPositioningClass}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          {positioning}
        </motion.p>
      </motion.div>
      <div className={spacerSectionClass}>
        Scroll to explore (Framer Motion candidate)
      </div>
    </>
  );
}
