import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  // Read event images from public/events
  const eventsDir = path.join(process.cwd(), "public", "events");
  let imageFiles: string[] = [];
  try {
    imageFiles = fs
      .readdirSync(eventsDir)
      .filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
      .sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
  } catch {
    /* directory missing — graceful fallback */
  }

  // Read about text
  const aboutPath = path.join(process.cwd(), "past events", "text", "about.txt");
  let aboutText = "";
  try {
    aboutText = fs.readFileSync(aboutPath, "utf-8").trim();
  } catch {
    /* file missing */
  }

  // Read and parse testimonials
  const testimonialsPath = path.join(process.cwd(), "past events", "text", "testimonials.txt");
  let testimonials: { name: string; body: string }[] = [];
  try {
    const raw = fs.readFileSync(testimonialsPath, "utf-8").trim();
    // Split on numbered entries: "1. ...", "2. ..."
    const entries = raw.split(/^\d+\.\s*/m).filter((s) => s.trim());
    testimonials = entries.map((entry) => {
      const cleaned = entry.replace(/\r\n/g, "\n").trim();
      // Delimiter is " -By " or " - By "
      const byMatch = cleaned.match(/\s*-\s*[Bb]y\s+/);
      if (byMatch && byMatch.index !== undefined) {
        const body = cleaned.slice(0, byMatch.index).trim();
        const name = cleaned.slice(byMatch.index + byMatch[0].length).trim();
        return { name, body };
      }
      return { name: "", body: cleaned };
    });
  } catch {
    /* file missing */
  }

  return NextResponse.json({ imageFiles, aboutText, testimonials });
}
