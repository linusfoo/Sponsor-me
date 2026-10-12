// ─────────────────────────────────────────────────────────────
//  Edit this file to make the site yours.
//  Prices are whole numbers in Singapore dollars.
//  To mark a spot as taken, add a `sold` object to it (see "tri-chest").
// ─────────────────────────────────────────────────────────────
window.SPONSOR_CONFIG = {
  athlete: {
    name: "Bryce Chong",
    intro:
      "Singapore national triathlete and SEA Games medallist. Spin the kit, pick a spot, and your brand races with Team Singapore's triathlon squad.",
    bio: [
      "I'm a Singapore national triathlete and a Singapore Sports School alumnus. I race draft-legal sprint and standard-distance triathlon and aquathlon for Team Singapore, and non-drafting half-Ironman (70.3) races on the tri bike.",
      "I've won medals at three SEA Games: silver in the mixed relay in 2019, bronze in the men's aquathlon in 2023 (Singapore's first medal of those Games), and silver in the men's relay in 2025. I raced the mixed relay for Singapore at the Hangzhou 2022 Asian Games, and I've won MetaSprint Series and SMU Aquathlon titles at home.",
      "Every race gets a write-up on my socials and YouTube channel, and every sponsor is tagged in race-day photos, finish-line videos and the recap that follows.",
    ],
    // Path to your photo, e.g. "images/bryce.jpg". Leave empty to show a placeholder.
    photo: "",
    facts: [
      ["Representing", "Singapore"],
      ["SEA Games medals", "2 silver, 1 bronze"],
      ["Asian Games", "Hangzhou 2022"],
      ["Races", "Sprint to 70.3, aquathlon"],
      ["Born", "1997"],
    ],
  },

  season: "2027",
  currencySymbol: "S$",
  email: "hello@example.com",

  socials: [
    { label: "Instagram", url: "https://instagram.com/" },
    { label: "YouTube", url: "https://www.youtube.com/@brycechong_triathlon" },
    { label: "World Triathlon profile", url: "https://www.triathlon.org/athletes/profile/70060/sheng-cher-bryce-chong" },
  ],

  // Races a sponsor can choose for a single-race deal. Placeholders: replace with the real 2027 calendar.
  races: [
    { name: "MetaSprint Series, Singapore", date: "dates TBC" },
    { name: "SMU Aquathlon SwimRunSprint, Sentosa", date: "date TBC" },
    { name: "Asia Triathlon Cup race", date: "TBC" },
    { name: "Ironman 70.3 race (Southeast Asia)", date: "TBC" },
    { name: "Ironman 70.3 race (Southeast Asia)", date: "TBC" },
    { name: "Major Games (if selected)", date: "TBC" },
  ],

  // One entry per spot. `race` = price for one race, `season` = whole season (S$).
  // Spot ids match kit.js.
  spots: {
    // Trisuit
    "tri-chest":    { race: 350, season: 2400,
                      sold: { sponsor: "Kopi Lab", url: "https://example.com", logo: "" } },
    "tri-sleeve-r": { race: 120, season: 800 },
    "tri-sleeve-l": { race: 120, season: 800 },
    "tri-belly":    { race: 200, season: 1300 },
    "tri-thigh-r":  { race: 110, season: 700 },
    "tri-thigh-l":  { race: 110, season: 700 },
    "tri-namebar":  { race: 160, season: 1000 },
    "tri-back":     { race: 280, season: 1800 },
    "tri-seat":     { race: 190, season: 1200,
                      sold: { sponsor: "Lion Physio", url: "", logo: "" } },

    // Cycling kit
    "cyc-chest":    { race: 240, season: 1600 },
    "cyc-sleeve-r": { race: 90,  season: 600 },
    "cyc-sleeve-l": { race: 90,  season: 600 },
    "cyc-front":    { race: 150, season: 950 },
    "cyc-thigh-r":  { race: 80,  season: 520 },
    "cyc-thigh-l":  { race: 80,  season: 520 },
    "cyc-back":     { race: 210, season: 1400 },
    "cyc-pockets":  { race: 160, season: 1050 },
    "cyc-seat":     { race: 120, season: 800 },

    // Running kit
    "run-cap":   { race: 120, season: 800 },
    "run-chest": { race: 210, season: 1400 },
    "run-front": { race: 130, season: 850 },
    "run-leg-r": { race: 70,  season: 420 },
    "run-leg-l": { race: 70,  season: 420 },
    "run-back":  { race: 170, season: 1150 },
    "run-waist": { race: 90,  season: 600 },

    // Helmet & race belt
    "helm-side-r": { race: 140, season: 950 },
    "helm-side-l": { race: 140, season: 950 },
    "helm-tail":   { race: 100, season: 650 },
    "helm-belt":   { race: 60,  season: 350 },

    // Bike
    "bike-downtube": { race: 280, season: 2000,
                       sold: { sponsor: "Merlion Cycles", url: "https://example.com", logo: "" } },
    "bike-toptube":  { race: 110, season: 700 },
    "bike-disc":     { race: 320, season: 2200 },
    "bike-seattube": { race: 120, season: 780 },
  },
};
