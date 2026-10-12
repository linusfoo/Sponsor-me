// ─────────────────────────────────────────────────────────────
//  Edit this file to make the site yours.
//  Prices are whole numbers in the currency below.
//  To mark a spot as taken, add a `sold` object to it (see "tri-chest").
// ─────────────────────────────────────────────────────────────
window.SPONSOR_CONFIG = {
  athlete: {
    name: "Sam Carter",
    intro:
      "I race 70.3 and full-distance triathlon. Pick a spot on my race kit, choose one race or the whole season, and your logo goes where the cameras point.",
    bio: [
      "I'm an age-group triathlete based in Boulder, Colorado. I started racing in 2019 after a stubborn knee injury pushed me off the running track and into the pool.",
      "In 2027 I'm chasing a Kona slot. Every race gets a full write-up on Instagram and Strava, and every sponsor is tagged in race-day photos, finish-line videos and the recap that follows.",
    ],
    // Path to your photo, e.g. "images/me.jpg". Leave empty to show a placeholder.
    photo: "",
    facts: [
      ["Home base", "Boulder, Colorado"],
      ["Racing since", "2019"],
      ["Best 70.3", "4:38:12"],
      ["Instagram", "8.4k followers"],
      ["Strava", "2.1k followers"],
    ],
  },

  season: "2027",
  currency: "USD",
  email: "hello@example.com",

  socials: [
    { label: "Instagram", url: "https://instagram.com/" },
    { label: "Strava", url: "https://strava.com/" },
    { label: "YouTube", url: "https://youtube.com/" },
  ],

  // Races a sponsor can choose when buying a single race.
  races: [
    { name: "Oceanside 70.3", date: "Apr 3" },
    { name: "St. George 70.3", date: "May 8" },
    { name: "Boulder 70.3", date: "Jun 12" },
    { name: "Ironman Lake Placid", date: "Jul 24" },
    { name: "Santa Cruz 70.3", date: "Sep 11" },
    { name: "Ironman Arizona", date: "Nov 20" },
  ],

  // One entry per spot. `race` = price for a single race, `season` = whole season.
  // Spot ids match the drawings in kit.js.
  spots: {
    // Trisuit
    "tri-chest":    { race: 250, season: 1800,
                      sold: { sponsor: "Northline Coffee", url: "https://example.com", logo: "" } },
    "tri-sleeve-r": { race: 90,  season: 600 },
    "tri-sleeve-l": { race: 90,  season: 600 },
    "tri-belly":    { race: 150, season: 1000 },
    "tri-thigh-r":  { race: 80,  season: 550 },
    "tri-thigh-l":  { race: 80,  season: 550 },
    "tri-namebar":  { race: 120, season: 800 },
    "tri-back":     { race: 200, season: 1400 },
    "tri-seat":     { race: 140, season: 950,
                      sold: { sponsor: "Peak Physio", url: "", logo: "" } },

    // Cycling kit
    "bike-chest":    { race: 180, season: 1200 },
    "bike-sleeve-r": { race: 70,  season: 450 },
    "bike-sleeve-l": { race: 70,  season: 450 },
    "bike-front":    { race: 110, season: 700 },
    "bike-thigh-r":  { race: 60,  season: 400 },
    "bike-thigh-l":  { race: 60,  season: 400 },
    "bike-back":     { race: 160, season: 1100 },
    "bike-pockets":  { race: 120, season: 800 },
    "bike-seat":     { race: 90,  season: 600 },

    // Running kit
    "run-chest":  { race: 160, season: 1100 },
    "run-front":  { race: 100, season: 650 },
    "run-leg-r":  { race: 50,  season: 320 },
    "run-leg-l":  { race: 50,  season: 320 },
    "run-back":   { race: 130, season: 900 },
    "run-waist":  { race: 70,  season: 450 },

    // Accessories
    "acc-cap":      { race: 90,  season: 600 },
    "acc-helmet":   { race: 120, season: 850 },
    "acc-belt":     { race: 40,  season: 250 },
    "acc-downtube": { race: 200, season: 1500,
                      sold: { sponsor: "Gearhaus Cycles", url: "https://example.com", logo: "" } },
    "acc-toptube":  { race: 80,  season: 500 },
  },
};
