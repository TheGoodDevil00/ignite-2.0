"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { navLinks } from "@/lib/mockData";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-subtle bg-nav backdrop-blur-xl">
      <nav className="section-container flex h-14 items-center justify-between">
        <a className="flex items-center gap-2" href="#home" aria-label="IGNITE 2.0 home">
          <Image src="/icons/logo.png" alt="" width={42} height={42} priority />
          <span className="hidden font-display text-2xl italic leading-none text-text xs:inline">
            IGNITE <span className="text-accent">2.0</span>
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a className="nav-link" href={link.href} key={`${link.label}-${link.href}`}>
              {link.label}
            </a>
          ))}
        </div>

        <a className="register-button hidden md:inline-flex" href="#register">
          Register
        </a>

        <button
          className="icon-button md:hidden"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
        >
          <Menu aria-hidden="true" size={22} />
        </button>
      </nav>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-primary px-4 py-4 md:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between">
              <Image src="/icons/logo.png" alt="IGNITE 2.0" width={50} height={50} />
              <button
                className="icon-button"
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden="true" size={22} />
              </button>
            </div>
            <div className="mt-12 flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  className="mobile-nav-link"
                  href={link.href}
                  key={`${link.label}-${link.href}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                className="register-button mt-3 justify-center"
                href="#register"
                onClick={() => setIsOpen(false)}
              >
                Register
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
