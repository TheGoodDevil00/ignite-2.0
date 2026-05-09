"use client";

import { Camera, CirclePlay, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { navLinks, sponsors } from "@/lib/mockData";
import { siteConfigDefaults } from "@/lib/siteConfig";
import { createClient } from "@/lib/supabase/client";

export function Footer() {
  const [whatsappLink, setWhatsappLink] = useState(siteConfigDefaults.whatsapp_link);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadWhatsappLink() {
      const { data } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "whatsapp_link")
        .maybeSingle();

      if (!cancelled && data?.value) {
        setWhatsappLink(data.value);
      }
    }

    loadWhatsappLink();

    const channel = supabase
      .channel("public-footer-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_config", filter: "key=eq.whatsapp_link" },
        () => loadWhatsappLink()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <footer id="contact" className="bg-section">
      <div className="section-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/icons/logo.png" alt="" width={52} height={52} />
              <div>
                <p className="font-display text-4xl italic leading-none">
                  IGNITE <span className="text-accent">2.0</span>
                </p>
                <p className="mt-1 text-sm text-muted">Join our community</p>
              </div>
            </div>
            <a className="whatsapp-button mt-6 inline-flex items-center gap-2" href={whatsappLink}>
              <MessageCircle aria-hidden="true" size={18} />
              Join WhatsApp Group
            </a>
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
