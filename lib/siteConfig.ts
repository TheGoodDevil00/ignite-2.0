export const siteConfigDefaults = {
  site_locked: "true",
  unlock_date: "2026-05-15T18:00:00+05:30",
  event_date_display: "26th July",
  announcement_banner: "",
  prize_pool: "Rs 4500",
  fillout_link: "",
  leaderboard_visible: "false",
};

export type SiteConfig = typeof siteConfigDefaults & Record<string, string>;
