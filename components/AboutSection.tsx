"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import {
  cmsDefaults,
  getCmsStringArray,
  parseCmsJson,
  type CmsTestimonial,
  type SiteConfig,
} from "@/lib/siteConfig";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Testimonial = CmsTestimonial;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function filenameToAlt(filename: string): string {
  return filename
    .split("/")
    .pop()!
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function imageSrc(value: string) {
  if (value.startsWith("http") || value.startsWith("/")) return value;
  return `/events/${value}`;
}

/* ------------------------------------------------------------------ */
/*  Image Carousel (CSS scroll-snap, no extra deps)                    */
/* ------------------------------------------------------------------ */
function EventCarousel({ images }: { images: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = images.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* scroll to a specific slide */
  const goTo = useCallback(
    (idx: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = ((idx % total) + total) % total;
      setActive(next);
      const slideWidth = track.clientWidth;
      track.scrollTo({ left: slideWidth * next, behavior: "smooth" });
    },
    [total]
  );

  /* sync active index on manual scroll / swipe */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollLeft = track.scrollLeft;
        const width = track.clientWidth;
        const idx = Math.round(scrollLeft / width);
        setActive(idx);
        ticking = false;
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  /* autoplay */
  useEffect(() => {
    if (paused || total <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => goTo(active + 1), 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, active, total, goTo]);

  if (total === 0) return null;

  return (
    <div
      className="about-carousel"
      role="region"
      aria-label="Past event images"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* slide track */}
      <div ref={trackRef} className="about-carousel-track">
        {images.map((file, i) => (
          <div
            key={file}
            className="about-carousel-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${total}`}
          >
            <img
              src={imageSrc(file)}
              alt={filenameToAlt(file)}
              className="absolute inset-0 h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* arrows */}
      <button
        className="about-carousel-arrow about-carousel-arrow--left"
        onClick={() => goTo(active - 1)}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <button
        className="about-carousel-arrow about-carousel-arrow--right"
        onClick={() => goTo(active + 1)}
        aria-label="Next slide"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>

      {/* dots */}
      <div className="about-carousel-dots" role="tablist" aria-label="Slides">
        {images.map((file, i) => (
          <button
            key={file}
            role="tab"
            aria-selected={i === active}
            aria-label={`Go to slide ${i + 1}`}
            className={`about-carousel-dot${i === active ? " about-carousel-dot--active" : ""}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      {/* live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Showing slide {active + 1} of {total}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial pulled-quote                                           */
/* ------------------------------------------------------------------ */
function TestimonialQuote({
  testimonial,
  align,
}: {
  testimonial: Testimonial;
  align: "left" | "right";
}) {
  return (
    <motion.blockquote
      initial={{ opacity: 0, x: align === "left" ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`about-testimonial ${align === "right" ? "about-testimonial--right" : ""}`}
    >
      <Quote
        size={28}
        className="about-testimonial-icon"
        aria-hidden="true"
      />
      <p className="about-testimonial-body">{testimonial.body}</p>
      <cite className="about-testimonial-cite">— {testimonial.name}</cite>
    </motion.blockquote>
  );
}

/* ------------------------------------------------------------------ */
/*  Main AboutSection component                                        */
/* ------------------------------------------------------------------ */
export function AboutSection({ config }: { config: SiteConfig }) {
  const imageFiles = getCmsStringArray(config.about_images, cmsDefaults.aboutImages);
  const aboutText = config.about_text;
  const testimonials = parseCmsJson<CmsTestimonial[]>(
    config.about_testimonials,
    cmsDefaults.testimonials
  );
  const paragraphs = aboutText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  /* Split about copy: first paragraph is the hero lead, rest is secondary */
  const leadParagraph = paragraphs[0] ?? "";
  const restParagraphs = paragraphs.slice(1);

  /* Pick a hero bleed image (first image) and carousel images */
  const heroImage = imageFiles[0] ?? null;
  const carouselImages = imageFiles.slice(1);

  return (
    <section id="about" className="about-section">
      {/* ─── Hero row: large lead text + bleed image ─── */}
      <div className="about-hero-row">
        {/* Text column */}
        <motion.div
          className="about-hero-text"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="about-heading">{config.about_heading}</h2>
          <p className="about-lead">{leadParagraph}</p>
        </motion.div>

        {/* Bleed image column */}
        {heroImage && (
          <motion.div
            className="about-hero-image"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          >
            <img
              src={imageSrc(heroImage)}
              alt={filenameToAlt(heroImage)}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            {/* overlay gradient for text readability */}
            <div className="about-hero-image-overlay" />
          </motion.div>
        )}
      </div>

      {/* ─── First testimonial — woven between hero and carousel ─── */}
      {testimonials[0] && (
        <TestimonialQuote testimonial={testimonials[0]} align="left" />
      )}

      {/* ─── Carousel + secondary text ─── */}
      <div className="about-mid-row">
        <div className="about-carousel-wrapper">
          <EventCarousel images={carouselImages} />
        </div>

        <div className="about-mid-text">
          {restParagraphs.map((p, i) => (
            <p key={i} className="about-body-paragraph">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* ─── Second testimonial — anchored to opposite edge ─── */}
      {testimonials[1] && (
        <TestimonialQuote testimonial={testimonials[1]} align="right" />
      )}
    </section>
  );
}
