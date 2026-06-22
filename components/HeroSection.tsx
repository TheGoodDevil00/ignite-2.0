"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cmsDefaults, getCmsLinks, type SiteConfig } from "@/lib/siteConfig";

export function HeroSection({ config }: { config: SiteConfig }) {
  const buttonLinks = useMemo(
    () => getCmsLinks(config.hero_buttons, cmsDefaults.heroButtons),
    [config.hero_buttons]
  );
  const filloutLink = config.fillout_link.trim();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <section id="home" className="section-container hero-section">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <motion.div
          variants={itemVariants}
          className="mb-4 flex flex-col items-center justify-center gap-5 sm:mb-6 sm:gap-6"
        >
          <img
            src={config.mgocsm_logo_url}
            alt={`${config.organizer_name} logo`}
            className="h-auto w-[120px] object-contain sm:w-[160px] md:w-[200px]"
          />
          <img
            src={config.ignite_logo_url}
            alt={`${config.site_title} logo`}
            className="h-auto w-[240px] object-contain sm:w-[320px] md:w-[400px]"
          />
        </motion.div>
        <motion.p variants={itemVariants} className="hero-tagline text-balance">
          <span>{config.hero_tagline} </span>
          <span className="text-accent">{config.hero_tagline_accent}</span>
        </motion.p>
        <motion.p variants={itemVariants} className="hero-subtitle text-balance">
          {config.hero_subtitle}
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-8 flex w-full max-w-[320px] flex-wrap justify-center gap-1.5 sm:max-w-xl sm:gap-4"
        >
          {filloutLink ? (
            <a className="glass-button active-scale touch-target-40" href={filloutLink} target="_blank" rel="noopener noreferrer">
              {config.register_button_label}
            </a>
          ) : null}
          {buttonLinks.map((button) => (
            <a className="glass-button active-scale touch-target-40" href={button.href} key={button.label}>
              {button.label}
            </a>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
