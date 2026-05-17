# 🔥 IGNITE 2.0

![Ignite 2.0 Logo](Ignite2.0%20logo.svg)

> **The ultimate mobile-first experience for MGOCSM's premier football tournament.**

Ignite 2.0 is a high-performance web application built to bring the thrill of the pitch to the digital world. Featuring real-time scores, dynamic leaderboards, and a premium "Dark Stadium" aesthetic, it serves as the central hub for players and fans alike.

---

## 🚀 Features

- **⏳ Real-time Countdown**: A immersive, full-screen lock page with live countdown to kick-off.
- **⚽ Live Match Hub**: Real-time fixture updates and live score tracking.
- **🏆 Dynamic Leaderboard**: Instant standings updates powered by Supabase Realtime.
- **📣 Announcement System**: Top-tier banner for critical event alerts.
- **📱 Mobile-First Design**: Optimized for a premium experience on any device.
- **✨ Premium UI/UX**: Glassmorphism, smooth Framer Motion animations, and a cohesive "Bebas Neue" typography system.

---

## 🧩 Deep Dive: Components & Features

### 1. Match Hub & Live Fixtures (`FixturesSection`)
The `FixturesSection` is the heartbeat of the site, providing a real-time window into the tournament's progress.
- **Real-time Synchronization**: Uses Supabase `postgres_changes` to listen for updates on `matches`, `teams`, and `match_scores` tables. Any goal scored on the field reflects instantly on the UI without a page refresh.
- **Intelligent Filtering**: Users can toggle between *All Matches*, *Upcoming*, *Live*, and *Completed*.
- **Dashboard Layout**: Features three specialized columns:
    - **Live Now**: Highlights ongoing matches with animated status indicators.
    - **Recent Results**: Shows the outcome of the latest matches.
    - **Up Next**: Displays the very next scheduled encounters.
- **Bye Logic**: Automatically detects and displays "Bye" rounds when a team doesn't have an opponent, ensuring the schedule remains clear.

### 2. Live Standings & Leaderboard (`LeaderboardSection`)
The `LeaderboardSection` goes beyond a simple table; it's a dynamic standings engine calculated on-the-fly.
- **Dynamic Calculation**: Standings are calculated in real-time by processing all completed match results from the database.
- **Standard League Ranking**: Implements professional tie-breaking rules:
    1. **Points**: 3 for a Win, 1 for a Draw, 0 for a Loss.
    2. **Goal Difference**: (Goals For - Goals Against).
    3. **Goals For**: Total goals scored.
    4. **Head-to-Head / Alphabetical**: Final fallback sorting.
- **Mobile-First UX**: Features "Sticky Columns" for Team Names and Ranks, allowing users to scroll through detailed statistics while maintaining context.

### 3. Lockdown & Countdown (`CountdownScreen`)
The `CountdownScreen` serves as the entry gate to the tournament experience, creating "hype" before the event starts.
- **State-based Unlocking**: The entire site is locked behind this screen until the `unlock_date` is reached or a manual unlock is triggered via `site_config`.
- **Remote Configuration**: Managed via the Supabase `site_config` table, allowing admins to update the "Register Now" link or announcement banners instantly.
- **High-Fidelity Visuals**: Combines SVG animations and Framer Motion transitions with a dark stadium theme to build excitement.

### 4. Interactive Event Journey (`AboutSection`)
The `AboutSection` tells the story of Ignite through a rich, woven editorial layout.
- **Headless Content**: Fetches event copy, images, and testimonials from a dedicated API, making content updates seamless.
- **Custom Scroll Carousel**: A lightweight, high-performance carousel using CSS scroll-snap for native mobile feel, enhanced with Framer Motion entrance effects.
- **Woven Testimonials**: Staggered quote blocks that animate into view as the user scrolls, adding social proof to the tournament experience.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database**: [Supabase](https://supabase.com/) (Realtime, Postgres)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)

---

## 🎨 Design System

Ignite 2.0 follows a strict "Dark Stadium" design language:

| Token | Usage |
|-------|-------|
| `#050810` | Primary Background |
| `#E8001D` | Accent Red (CTAs, Highlights) |
| `Glassmorphism` | Frosted cards and navigation (`backdrop-blur: 12px`) |
| `Bebas Neue` | Bold, uppercase display typography |

---

## ⚙️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/TheGoodDevil00/ignite-2.0.git
cd ignite-2.0
npm install
```

### 2. Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_UNLOCKED=false
NEXT_PUBLIC_UNLOCK_DATE=2024-05-25T17:00:00Z
```

### 3. Run Development
```bash
npm run dev
```

### 4. Admin and Scorer Accounts
The login screen accepts the usernames `admin` and `scorer`, mapped to `admin@ignite.local` and `scorer@ignite.local`.

Set passwords in `.env.local`, then provision/update the Supabase Auth users:
```env
ADMIN_PASSWORD=change-me
SCORER_PASSWORD=change-me-too
```

```bash
npm run auth:users
```

Scorer accounts are limited to the Fixtures and Scores tabs.

---

## 📂 Project Structure

- `/app`: Next.js App Router pages and layouts.
- `/components`: Reusable UI components (Hero, Navbar, Leaderboard, etc.).
- `/lib`: Utility functions, Supabase client, and site configuration.
- `/styles`: Global CSS and Tailwind configurations.
- `/supabase`: SQL migrations and database schema definitions.

---
*Built with ❤️ by TheGoodDevil00.*
