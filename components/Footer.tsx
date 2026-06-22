"use client";

/* eslint-disable @next/next/no-img-element */

import { Phone, ShieldCheck } from "lucide-react";
import InstagramIcon from "./InstagramIcon";
import {
  cmsDefaults,
  getCmsLinks,
  parseCmsJson,
  type CmsContact,
  type SiteConfig,
} from "@/lib/siteConfig";

export function Footer({ config }: { config: SiteConfig }) {
  const navLinks = getCmsLinks(config.nav_links, cmsDefaults.navLinks);
  const socialLinks = getCmsLinks(config.footer_social_links, cmsDefaults.socialLinks);
  const contacts = parseCmsJson<CmsContact[]>(
    config.footer_contacts,
    cmsDefaults.footerContacts
  );

  return (
    <footer id="contact" className="bg-section">
      <div className="section-container py-14">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-4">
            <img
              src={config.mgocsm_logo_url}
              alt={`${config.organizer_name} logo`}
              className="h-[32px] w-auto object-contain"
            />
            <img
              src={config.ignite_logo_url}
              alt={`${config.site_title} logo`}
              className="h-[32px] w-auto object-contain"
            />
          </div>
          <p className="mt-4 text-sm text-muted">{config.footer_tagline}</p>
        </div>

        <div className="mt-12 grid gap-8 border-t border-subtle pt-8 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="footer-title">Contact Us</p>
            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 text-sm text-muted">
              {contacts.map((contact, index) => (
                <div
                  className={`flex flex-col ${
                    contacts.length % 2 === 1 && index === contacts.length - 1
                      ? "sm:col-span-2"
                      : ""
                  }`}
                  key={`${contact.label}-${contact.phone}`}
                >
                  <span className="text-[10px] font-bold text-text/70 uppercase tracking-wider">
                    {contact.label}
                  </span>
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className="flex items-center gap-2 mt-1.5 hover:text-text transition-colors active-scale w-fit"
                  >
                    <Phone size={14} className="text-accent" />
                    <span>{contact.name}: {contact.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="footer-title">Explore</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <a className="footer-link active-scale" href={link.href} key={`${link.label}-${link.href}`}>
                  {link.label}
                </a>
              ))}
              <a
                className="footer-link flex items-center gap-1 font-semibold text-accent hover:text-accent/80 transition-colors active-scale w-fit"
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
              {socialLinks.map((link) => (
                <a className="social-button active-scale" href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label} key={`${link.label}-${link.href}`}>
                  {link.label.toLowerCase().includes("instagram") ? (
                    <InstagramIcon size={18} />
                  ) : (
                    <span className="text-xs font-black uppercase">{link.label.slice(0, 1)}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-accent py-3 text-xs font-semibold uppercase text-text">
        <div className="section-container flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p>{config.footer_copyright}</p>
          <a
            href={config.footer_credit_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline opacity-80 hover:opacity-100 transition-opacity"
          >
            {config.footer_credit_label}
          </a>
        </div>
      </div>
    </footer>
  );
}
