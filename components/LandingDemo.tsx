"use client";

import { useEffect, useState } from "react";
import { MicIcon, CheckIcon } from "./icons";
import styles from "@/app/landing.module.css";

/**
 * The landing page's "explain it in 10 seconds" loop: a spoken description on
 * one side, and the generated outputs (shop, QR, catalogue, card, link)
 * ticking in one by one, forever. Honors prefers-reduced-motion by showing
 * the finished state statically.
 */
export function LandingDemo({
  youSpeak,
  transcript,
  steps,
}: {
  youSpeak: string;
  transcript: string;
  steps: string[];
}) {
  // How many output rows are currently revealed.
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Show the finished state; rAF keeps the state change out of the effect
      // body itself (no cascading render).
      const raf = requestAnimationFrame(() => setCount(steps.length));
      return () => cancelAnimationFrame(raf);
    }
    let tick = 0;
    const id = setInterval(() => {
      tick += 1;
      // Reveal one step per tick, hold the finished state for 3 ticks, reset.
      const cycle = steps.length + 3;
      const phase = tick % cycle;
      setCount(phase === 0 ? 0 : Math.min(phase, steps.length));
    }, 850);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className={styles.demoCard}>
      <div className={styles.demoInput}>
        <span className={styles.demoMic} aria-hidden>
          <MicIcon size={20} />
        </span>
        <div>
          <span className={styles.demoLabel}>{youSpeak}</span>
          <p className={styles.demoTranscript}>{transcript}</p>
        </div>
      </div>

      <div className={styles.demoArrow} aria-hidden>
        ↓
      </div>

      <ul className={styles.demoSteps}>
        {steps.map((step, i) => (
          <li
            key={step}
            className={`${styles.demoStep} ${i < count ? styles.demoStepOn : ""}`}
          >
            <span className={styles.demoCheck} aria-hidden>
              <CheckIcon size={12} />
            </span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}
