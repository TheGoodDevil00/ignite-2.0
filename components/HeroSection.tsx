"use client";

import { motion } from "framer-motion";

const buttonLinks = [
  { label: "Register", href: "#register" },
  { label: "View Fixtures", href: "#fixtures" },
  { label: "Live Score", href: "#fixtures" },
];

export function HeroSection() {
  return (
    <section id="home" className="section-container hero-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <h1 className="brand-heading hero-title">
          <span>IGNITE</span>
          <span className="text-accent"> 2.0</span>
        </h1>
        <p className="hero-tagline">
          <span>PLAY. COMPETE. </span>
          <span className="text-accent">WIN!!!</span>
        </p>
        <p className="hero-subtitle">The most awaited football event is back!</p>

        <div className="mt-8 grid w-full max-w-[360px] grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:max-w-xl sm:gap-4">
          {buttonLinks.map((button) => (
            <a className="glass-button" href={button.href} key={button.label}>
              {button.label}
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
