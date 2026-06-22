"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  cmsDefaults,
  getCmsLinks,
  type SiteConfig,
} from "@/lib/siteConfig";

export function Navbar({ config }: { config: SiteConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = useMemo(
    () => getCmsLinks(config.nav_links, cmsDefaults.navLinks),
    [config.nav_links]
  );
  const filloutLink = config.fillout_link.trim();

  // Disable scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-subtle bg-nav backdrop-blur-xl">
        <nav className="section-container flex h-14 items-center justify-between gap-2 px-2 sm:px-6">
          <a className="flex shrink-0 items-center gap-2 sm:gap-3 active-scale" href="#home" aria-label={`${config.site_title} home`}>
            <img src={config.mgocsm_logo_url} alt={`${config.organizer_name} logo`} className="h-[24px] w-auto object-contain sm:h-[32px]" />
            <img src={config.ignite_logo_url} alt={`${config.site_title} logo`} className="h-[24px] w-auto object-contain sm:h-[32px]" />
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-6 px-1">
            {navLinks.map((link) => (
              <a className="nav-link whitespace-nowrap text-[11px] active-scale" href={link.href} key={`${link.label}-${link.href}`}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {filloutLink ? (
              <a className="register-button px-3 py-1.5 text-[10px] sm:px-5 sm:py-2 sm:text-xs active-scale" href={filloutLink} target="_blank" rel="noopener noreferrer">
                {config.register_button_label}
              </a>
            ) : null}
            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-subtle bg-card text-text transition hover:border-accent hover:text-accent md:hidden active-scale"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-x-0 top-14 bottom-0 z-40 flex flex-col justify-between bg-nav/95 backdrop-blur-2xl px-6 py-8 border-t border-subtle md:hidden cursor-pointer"
          >
            <div className="flex flex-col gap-5 mt-4">
              {navLinks.map((link, index) => (
                <motion.a
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="border-b border-subtle/50 pb-3 text-lg font-semibold uppercase tracking-wider text-text transition hover:text-accent active-scale"
                >
                  {link.label}
                </motion.a>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: navLinks.length * 0.04 + 0.1 }}
              className="flex flex-col gap-4 border-t border-subtle pt-6 mb-4"
            >
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-widest text-muted">{config.organizer_name}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
