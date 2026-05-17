begin;

insert into public.site_config (key, value)
values
  ('site_title', 'IGNITE 2.0'),
  ('site_description', 'A mobile-first football tournament experience for IGNITE 2.0.'),
  ('organizer_name', 'MGOCSM Dehuroad'),
  ('mgocsm_logo_url', '/branding/mgocsm-logo.png'),
  ('ignite_logo_url', '/branding/ignite-logo.svg'),
  ('nav_links', $json$[
  { "label": "Home", "href": "#home" },
  { "label": "Live", "href": "#fixtures" },
  { "label": "Leaderboard", "href": "#leaderboard" },
  { "label": "About", "href": "#about" },
  { "label": "Contact", "href": "#contact" }
]$json$),
  ('register_button_label', 'Register Now'),
  ('hero_tagline', 'PLAY. COMPETE.'),
  ('hero_tagline_accent', 'WIN!!!'),
  ('hero_subtitle', 'The most awaited football event is back!'),
  ('hero_buttons', $json$[
  { "label": "View Fixtures", "href": "#fixtures" },
  { "label": "Live Score", "href": "#fixtures" }
]$json$),
  ('event_date_label', 'Date'),
  ('location_label', 'Location'),
  ('location_display', 'Nawu Sports Club, Mamurdi'),
  ('location_link', 'https://maps.app.goo.gl/rpeErqpzykEgey5c8'),
  ('prize_pool_label', 'Prize Pool'),
  ('fixtures_visible', 'true'),
  ('sponsors_visible', 'true'),
  ('about_visible', 'true'),
  ('sponsors', $json$[
  "Red Bull",
  "Monster Energy",
  "Decathlon",
  "Nike",
  "Adidas",
  "Puma",
  "Gatorade",
  "Under Armour",
  "Cosco",
  "Nivia",
  "Yonex",
  "Powerade",
  "Oakley",
  "Castrol"
]$json$),
  ('countdown_date_label', '26TH JULY'),
  ('countdown_kicker', 'Something big is coming!!!'),
  ('countdown_title', 'IGNITE 2.0'),
  ('countdown_label', 'Unlocks In'),
  ('countdown_manual_unlock_visible', 'true'),
  ('countdown_manual_unlock_label', 'Unlock Site Now'),
  ('countdown_admin_label', 'Admin Dashboard'),
  ('about_heading', 'About Ignite 2.0'),
  ('about_text', $text$MGOCSM Dehuroad has always believed in the power of faith, fellowship, and sportsmanship to bring youth together. IGNITE is not just a football tournament but a celebration of unity, passion, and the vibrant spirit of our MGOCSM youth.

As seen in the image from our previous sports meet, MGOCSM Dehuroad has a rich tradition of organizing dynamic events that promote healthy competition, team bonding, and Christian fellowship. This legacy continues with IGNITE 2.0 2026, where parishes across the region come together to showcase their talent and love for the game.

With each kick, cheer, and goal, IGNITE aims to light the fire of friendship, faith, and fair play in every participant. Our mission is simple: to foster youth engagement through sports while building lasting connections that go beyond the field.

Join us as we carry forward the energy, enthusiasm, and excellence of past events into a bigger, brighter future.$text$),
  ('about_images', $json$[
  "/events/1.jpeg",
  "/events/2.jpeg",
  "/events/3.jpeg",
  "/events/4.jpeg",
  "/events/5.jpeg",
  "/events/6.jpeg",
  "/events/7.jpeg",
  "/events/8.jpeg",
  "/events/9.jpeg",
  "/events/10.jpeg",
  "/events/11.jpeg"
]$json$),
  ('about_testimonials', $json$[
  {
    "name": "Jeril Jose from Chinchwad Parish",
    "body": "Heartfelt congratulations to MGOCSM Dehuroad for organizing such a well-executed and memorable tournament. Your efforts, planning, and commitment truly shone through every aspect of the event."
  },
  {
    "name": "Siju from Khadki Parish",
    "body": "We really appreciate the effort MGOCSM Dehuroad put into organizing this tournament. From time management to website updates, everything was seamless and top notch."
  }
]$json$),
  ('footer_tagline', 'Join our community'),
  ('footer_contacts', $json$[
  { "label": "Operations", "name": "Aaron", "phone": "+91 80100 65098" },
  { "label": "App & Score", "name": "Anisha", "phone": "+91 75073 99206" },
  { "label": "Disputes", "name": "Nikhil", "phone": "+91 75076 81331" },
  { "label": "Food", "name": "Greg", "phone": "+91 70580 35413" },
  { "label": "First Aid", "name": "Rini", "phone": "+91 77570 40841" },
  { "label": "Equipment", "name": "Ryan", "phone": "+91 87999 39805" },
  { "label": "Review, Feedback & Others", "name": "Bryan", "phone": "+91 74208 51640" }
]$json$),
  ('footer_social_links', $json$[
  { "label": "Instagram", "href": "https://www.instagram.com/mgocsm_dehuroad/" }
]$json$),
  ('footer_copyright', 'IGNITE 2.0 MGOCSM. All rights reserved.'),
  ('footer_credit_label', 'Made by Hitesh'),
  ('footer_credit_url', 'https://github.com/TheGoodDevil00')
on conflict (key) do nothing;

commit;
