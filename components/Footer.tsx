"use client";

import { Camera, CirclePlay, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { navLinks, sponsors } from "@/lib/mockData";
import mgocsmLogo from "@/mgocsm logo.png";
import igniteLogo from "@/logo.svg";

export function Footer() {
  return (
    <footer id="contact" className="bg-section">
      <div className="section-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col items-center justify-center sm:items-start">
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
            <p className="mt-4 text-center text-sm text-muted sm:text-left">Join our community</p>
          </div>

          <div>
            <p className="footer-title">Our Sponsors</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {sponsors.map((sponsor) => (
                <div className="sponsor-tile" key={sponsor}>
                  {sponsor}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-subtle pt-8 md:grid-cols-3">
          <div>
            <p className="footer-title">Contact Us</p>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <p className="footer-line">
                <Phone aria-hidden="true" size={15} />
                +91 98765 43210
              </p>
              <p className="footer-line">
                <Mail aria-hidden="true" size={15} />
                ignite@football.com
              </p>
              <p className="footer-line">
                <MapPin aria-hidden="true" size={15} />
                Turf Dehu Road
              </p>
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
            </div>
          </div>

          <div>
            <p className="footer-title">Social</p>
            <div className="mt-4 flex gap-3">
              <a className="social-button" href="#" aria-label="Instagram">
                <Camera aria-hidden="true" size={18} />
              </a>
              <a className="social-button" href="#" aria-label="YouTube">
                <CirclePlay aria-hidden="true" size={18} />
              </a>
              <a className="social-button" href="mailto:ignite@football.com" aria-label="Email">
                <Mail aria-hidden="true" size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-accent py-3 text-center text-xs font-semibold uppercase text-text">
        IGNITE 2.0. All rights reserved.
      </div>
    </footer>
  );
}
