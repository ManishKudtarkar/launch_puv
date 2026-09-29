"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

/**
 * Reusable scroll-up reveal wrapper. Fades and slides content up as it enters
 * the viewport. Animation runs once per element and respects the theme by
 * adding no visual styling of its own beyond an optional passthrough className.
 */
export function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
