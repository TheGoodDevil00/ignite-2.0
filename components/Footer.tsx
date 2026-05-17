"use client";

import { Phone, ShieldCheck } from "lucide-react";
import InstagramIcon from "./InstagramIcon";
import Image from "next/image";
import { navLinks } from "@/lib/mockData";
import mgocsmLogo from "@/mgocsm logo.png";
import igniteLogo from "@/Ignite2.0 logo.svg";

export function Footer() {
  return (
    <footer id="contact" className="bg-section">
      <div className="section-container py-14">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-4">
            <Image
              src={mgocsmLogo}
              alt="MGOCSM Logo"
              width={100}
              height={32}
              className="h-[32px] w-auto object-contain"
            />
            <Image
              src={igniteLogo}
              alt="IGNITE 2.0 shield"
              width={100}
              height={32}
              className="h-[32px] w-auto object-contain"
            />
          </div>
          <p className="mt-4 text-sm text-muted">Join our community</p>
        </div>

        <div className="mt-12 grid gap-8 border-t border-subtle pt-8 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="footer-title">Contact Us</p>
            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 text-sm text-muted">

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text/70 uppercase tracking-wider">Operations</span>
                <a href="tel:+918010065098" className="flex items-center gap-2 mt-1.5 hover:text-text transition-colors">
                  <Phone size={14} className="text-accent" />
                  <span>Aaron: +91 80100 65098</span>
                </a>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text/70 uppercase tracking-wider">App & Score</span>
                <a href="tel:+917507399206" className="flex items-center gap-2 mt-1.5 hover:text-text transition-colors">
                  <Phone size={14} className="text-accent" />
                  <span>Anisha: +91 75073 99206</span>
                </a>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text/70 uppercase tracking-wider">Disputes</span>
                <a href="tel:+917507681331" className="flex items-center gap-2 mt-1.5 hover:text-text transition-colors">
                  <Phone size={14} className="text-accent" />
                  <span>Nikhil: +91 75076 81331</span>
                </a>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text/70 uppercase tracking-wider">Food</span>
                <a href="tel:+917058035413" className="flex items-center gap-2 mt-1.5 hover:text-text transition-colors">
                  <Phone size={14} className="text-accent" />
                  <span>Greg: +91 70580 35413</span>
                </a>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text/70 uppercase tracking-wider">First Aid</span>
                <a href="tel:+917757040841" className="flex items-center gap-2 mt-1.5 hover:text-text transition-colors">
                  <Phone size={14} className="text-accent" />
                  <span>Rini: +91 77570 40841</span>
                </a>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text/70 uppercase tracking-wider">Equipment</span>
                <a href="tel:+918799939805" className="flex items-center gap-2 mt-1.5 hover:text-text transition-colors">
                  <Phone size={14} className="text-accent" />
                  <span>Ryan: +91 87999 39805</span>
                </a>
              </div>

              <div className="flex flex-col sm:col-span-2">
                <span className="text-[10px] font-bold text-text/70 uppercase tracking-wider">Review, Feedback & Others</span>
                <a href="tel:+917420851640" className="flex items-center gap-2 mt-1.5 hover:text-text transition-colors">
                  <Phone size={14} className="text-accent" />
                  <span>Bryan: +91 74208 51640</span>
                </a>
              </div>

            </div>
          </div>

          <div>
            <p className="footer-title">Explore</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <a className="footer-link" href={link.href} key={`${link.label}-${link.href}`}>
                  {link.label}
                </a>
              ))}
              <a
                className="footer-link flex items-center gap-1 font-semibold text-accent hover:text-accent/80 transition-colors"
                href="/admin"
                aria-label="Open admin dashboard"
              >
                <ShieldCheck size={14} className="shrink-0" />
                <span>Admin</span>
              </a>
            </div>
          </div>

          <div>
            <p className="footer-title">Social Media</p>
            <div className="mt-4 flex gap-3">
              <a className="social-button" href="https://www.instagram.com/mgocsm_dehuroad/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-accent py-3 text-xs font-semibold uppercase text-text">
        <div className="section-container flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p>IGNITE 2.0 MGOCSM. All rights reserved.</p>
          <a
            href="https://github.com/TheGoodDevil00"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline opacity-80 hover:opacity-100 transition-opacity"
          >
            Made by Hitesh
          </a>
        </div>
      </div>
    </footer>
  );
}
