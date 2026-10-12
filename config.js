// ─────────────────────────────────────────────────────────────
//  Edit this file to make the site yours.
//  Prices are whole numbers in Singapore dollars.
//  To mark a spot as taken, add a `sold` object to it (see "tri-chest").
// ─────────────────────────────────────────────────────────────
window.SPONSOR_CONFIG = {
  athlete: {
    name: "Ethan Lim",
    intro:
      "Singapore age-group triathlete racing sprint to 70.3 across Southeast Asia. Spin the kit, pick a spot, and your logo races with me.",
    bio: [
      "I train in Singapore's heat and humidity: swims at East Coast, rides out to Changi, runs along the Park Connector at 5am before the sun gets serious.",
      "In 2027 I'm racing six events across Singapore, Malaysia and Indonesia. Every race gets a write-up on Instagram and Strava, and every sponsor is tagged in race-day photos, finish-line videos and the recap that follows.",
    ],
    // Path to your photo, e.g. "images/me.jpg". Leave empty to show a placeholder.
    photo: "",
    facts: [
      ["Home base", "Singapore"],
      ["Racing since", "2020"],
      ["Best 70.3", "5:02:41"],
      ["Instagram", "6.2k followers"],
      ["Strava", "1.8k followers"],
    ],
  },

  season: "2027",
  currencySymbol: "S$",
  email: "hello@example.com",

  socials: [
    { label: "Instagram", url: "https://instagram.com/" },
    { label: "Strava", url: "https://strava.com/" },
    { label: "TikTok", url: "https://tiktok.com/" },
  ],

  // Races a sponsor can choose for a single-race deal. Placeholder dates: check and edit.
  races: [
    { name: "MetaSprint Duathlon, Singapore", date: "Feb" },
    { name: "Ironman 70.3 Desaru Coast", date: "Mar" },
    { name: "Singapore International Triathlon", date: "May" },
    { name: "Ironman 70.3 Bintan", date: "Aug" },
    { name: "MetaSprint Triathlon, Singapore", date: "Sep" },
    { name: "Ironman 70.3 Langkawi", date: "Nov" },
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
