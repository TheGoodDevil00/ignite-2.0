export type FixtureStatus = "upcoming" | "live" | "completed";

export type Fixture = {
  id: number;
  teamA: string;
  teamB: string;
  time: string;
  status: FixtureStatus;
  score: string;
};

export type LeaderboardRow = {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
};

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Live", href: "#fixtures" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const infoTiles = [
  {
    label: "Date",
    value: "26th July",
    image: "/images/calendar.png",
  },
  {
    label: "Location",
    value: "Nawu Sports Club, Mamurdi",
    image: "/images/location.png",
  },
  {
    label: "Prize Pool",
    value: "₹4500",
    image: "/images/trophy.png",
  },
];

export const registrationFields = [
  "Team Name",
  "Team Captain Name",
  "Contact Number",
  "Email Address",
  "Player 1 Name",
  "Player 2 Name",
  "Player 3 Name",
  "Player 4 Name",
  "Player 5 Name (Optional)",
];

export const fixtures: Fixture[] = [
  {
    id: 1,
    teamA: "Thunder FC",
    teamB: "Blaze United",
    time: "25 May, 5:00 PM",
    status: "upcoming",
    score: "-",
  },
  {
    id: 2,
    teamA: "Red Warriors",
    teamB: "NorthStars",
    time: "25 May, 6:00 PM",
    status: "live",
    score: "1 - 0",
  },
  {
    id: 3,
    teamA: "Royal Strikers",
    teamB: "Night Falcons",
    time: "26 May, 4:30 PM",
    status: "upcoming",
    score: "-",
  },
  {
    id: 4,
    teamA: "Blue Hawks",
    teamB: "Fire Titans",
    time: "26 May, 6:30 PM",
    status: "completed",
    score: "2 - 3",
  },
  {
    id: 5,
    teamA: "Goal Diggers",
    teamB: "The Rulers",
    time: "27 May, 5:00 PM",
    status: "upcoming",
    score: "-",
  },
  {
    id: 6,
    teamA: "The Barons",
    teamB: "West Rovers",
    time: "27 May, 7:00 PM",
    status: "upcoming",
    score: "-",
  },
];

export const leaderboard: LeaderboardRow[] = [
  { rank: 1, team: "Thunder FC", played: 3, won: 3, drawn: 0, lost: 0, points: 9 },
  { rank: 2, team: "Dream Partners", played: 3, won: 2, drawn: 1, lost: 0, points: 7 },
  { rank: 3, team: "Blaze United", played: 3, won: 2, drawn: 0, lost: 1, points: 6 },
  { rank: 4, team: "NorthStars", played: 3, won: 1, drawn: 1, lost: 1, points: 4 },
  { rank: 5, team: "Red Warriors", played: 3, won: 1, drawn: 0, lost: 2, points: 3 },
  { rank: 6, team: "Goal Diggers", played: 3, won: 0, drawn: 1, lost: 2, points: 1 },
];

export const sponsors = ["Red Bull", "Monster", "Decathlon"];
