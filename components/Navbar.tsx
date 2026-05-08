"use client";

import Image from "next/image";
import { navLinks } from "@/lib/mockData";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-subtle bg-nav backdrop-blur-xl">
      <nav className="section-container flex h-14 items-center justify-between gap-2 px-2 sm:px-6">
        <a className="flex shrink-0 items-center gap-1" href="#home" aria-label="IGNITE 2.0 home">
          <Image src="/icons/logo.png" alt="" width={32} height={32} priority className="sm:h-[42px] sm:w-[42px]" />
        </a>

        <div className="flex flex-1 items-center justify-start gap-3 overflow-x-auto no-scrollbar px-1 sm:justify-center sm:gap-6">
          {navLinks.map((link) => (
            <a className="nav-link whitespace-nowrap text-[9px] sm:text-[11px]" href={link.href} key={`${link.label}-${link.href}`}>
              {link.label}
            </a>
          ))}
        </div>

        <a className="register-button shrink-0 px-3 py-1.5 text-[10px] sm:px-5 sm:py-2 sm:text-xs" href="#register">
          Register
        </a>
      </nav>
    </header>
  );
}
