// Line drawings and ad-spot geometry. All drawings share a 400 × 500 canvas.
// Zone `r` is [x, y, width, height]; `rot` rotates it around its centre (degrees).
// "Left" and "right" are from the wearer's point of view.
(function () {
  const tri = {
    front:
      "M160,30 Q200,62 240,30 L290,40 L318,70 L330,130 L292,140 L288,250 L300,330 L304,440 L214,450 L200,370 L186,450 L96,440 L100,330 L112,250 L108,140 L70,130 L82,70 L110,40 Z",
    back:
      "M160,30 Q200,46 240,30 L290,40 L318,70 L330,130 L292,140 L288,250 L300,330 L304,440 L214,450 L200,370 L186,450 L96,440 L100,330 L112,250 L108,140 L70,130 L82,70 L110,40 Z",
    seams:
      "M112,150 Q120,250 104,330 M288,150 Q280,250 296,330 M98,428 L187,438 M213,438 L302,428 M80,118 L110,126 M320,118 L290,126",
  };
  const bikeJersey = (neck) =>
    `M165,30 Q200,${neck} 235,30 L295,45 L345,120 L315,150 L290,120 L292,270 L108,270 L110,120 L85,150 L55,120 L105,45 Z`;
  const bikeShorts = "M112,280 L288,280 L300,440 L214,450 L200,360 L186,450 L100,440 Z";
  const bikeSeams = "M62,113 L92,143 M338,113 L308,143 M101,428 L187,438 M213,438 L299,428 M110,258 L290,258";

  const singlet = (neck) =>
    `M160,30 Q200,${neck} 240,30 L262,30 Q268,90 300,110 L298,260 L102,260 L100,110 Q132,90 138,30 Z`;
  const runShorts = "M108,270 L292,270 L306,380 L212,388 L200,330 L188,388 L94,380 Z";
  const runSeams = "M108,284 L292,284 M104,250 L296,250";

  const body = (d) => `<path class="g-body" d="${d}"/>`;
  const seam = (d) => `<path class="g-seam" d="${d}"/>`;

  const drawings = {
    "tri-front": body(tri.front) + seam(tri.seams) + `<path class="g-zip" d="M200,47 L200,215"/>`,
    "tri-back": body(tri.back) + seam(tri.seams + " M200,290 L200,370"),
    "bike-front":
      body(bikeJersey(56)) + body(bikeShorts) + seam(bikeSeams) + `<path class="g-zip" d="M200,44 L200,258"/>`,
    "bike-back":
      body(bikeJersey(42)) + body(bikeShorts) +
      seam(bikeSeams + " M118,212 L282,212 M173,212 L173,258 M227,212 L227,258"),
    "run-front": body(singlet(80)) + body(runShorts) + seam(runSeams),
    "run-back": body(singlet(52)) + body(runShorts) + seam(runSeams + " M200,284 L200,330"),
    "acc-gear":
      // Cap
      body("M50,148 Q50,62 120,60 Q190,62 190,148 Z") +
      body("M44,148 L196,148 Q204,170 120,172 Q36,170 44,148 Z") +
      seam("M120,60 L120,148 M80,72 Q70,110 72,148 M160,72 Q170,110 168,148") +
      // Helmet (side view)
      body("M222,152 Q226,74 300,64 Q366,62 374,124 L366,152 Z") +
      seam("M248,104 Q290,80 340,86 M240,130 Q300,112 362,118 M222,152 L366,152") +
      // Race belt
      body("M36,236 L364,236 L364,256 L36,256 Z") +
      body("M168,224 L232,224 L232,268 L168,268 Z") +
      seam("M176,236 L224,236 M176,256 L224,256") +
      // Bike
      `<circle class="g-wheel" cx="112" cy="420" r="62"/><circle class="g-wheel" cx="304" cy="420" r="62"/>` +
      `<path class="g-frame" d="M112,420 L196,424 L176,334 Z M176,334 L286,328 L292,360 L196,424 M292,360 L304,420 M176,334 L170,316 M150,314 L192,314 M286,328 L304,320 Q326,320 322,344"/>`,
  };

  const garments = [
    { id: "tri", name: "Trisuit", views: ["front", "back"] },
    { id: "bike", name: "Cycling kit", views: ["front", "back"] },
    { id: "run", name: "Running kit", views: ["front", "back"] },
    { id: "acc", name: "Accessories", views: ["gear"] },
  ];

  const zones = [
    // Trisuit
    { id: "tri-chest", garment: "tri", view: "front", name: "Chest", size: "20 × 9 cm", r: [148, 86, 104, 46] },
    { id: "tri-sleeve-r", garment: "tri", view: "front", name: "Right sleeve", size: "6 × 9 cm", r: [80, 74, 26, 42], rot: 8 },
    { id: "tri-sleeve-l", garment: "tri", view: "front", name: "Left sleeve", size: "6 × 9 cm", r: [294, 74, 26, 42], rot: -8 },
    { id: "tri-belly", garment: "tri", view: "front", name: "Stomach", size: "20 × 8 cm", r: [148, 196, 104, 40] },
    { id: "tri-thigh-r", garment: "tri", view: "front", name: "Right thigh", size: "12 × 8 cm", r: [112, 372, 62, 42] },
    { id: "tri-thigh-l", garment: "tri", view: "front", name: "Left thigh", size: "12 × 8 cm", r: [226, 372, 62, 42] },
    { id: "tri-namebar", garment: "tri", view: "back", name: "Name bar", size: "24 × 5 cm", r: [138, 64, 124, 26] },
    { id: "tri-back", garment: "tri", view: "back", name: "Upper back", size: "22 × 12 cm", r: [144, 104, 112, 62] },
    { id: "tri-seat", garment: "tri", view: "back", name: "Seat", size: "20 × 9 cm", r: [150, 298, 100, 44],
      note: "Faces every rider behind me on the bike." },

    // Cycling kit
    { id: "bike-chest", garment: "bike", view: "front", name: "Jersey chest", size: "20 × 8 cm", r: [148, 84, 104, 42] },
    { id: "bike-sleeve-r", garment: "bike", view: "front", name: "Right sleeve", size: "5 × 9 cm", r: [74, 76, 24, 44], rot: 30 },
    { id: "bike-sleeve-l", garment: "bike", view: "front", name: "Left sleeve", size: "5 × 9 cm", r: [302, 76, 24, 44], rot: -30 },
    { id: "bike-front", garment: "bike", view: "front", name: "Jersey front", size: "20 × 8 cm", r: [148, 186, 104, 40] },
    { id: "bike-thigh-r", garment: "bike", view: "front", name: "Right thigh", size: "12 × 8 cm", r: [114, 376, 62, 40] },
    { id: "bike-thigh-l", garment: "bike", view: "front", name: "Left thigh", size: "12 × 8 cm", r: [224, 376, 62, 40] },
    { id: "bike-back", garment: "bike", view: "back", name: "Upper back", size: "24 × 10 cm", r: [138, 80, 124, 52] },
    { id: "bike-pockets", garment: "bike", view: "back", name: "Pocket band", size: "28 × 7 cm", r: [126, 220, 148, 32] },
    { id: "bike-seat", garment: "bike", view: "back", name: "Seat", size: "22 × 8 cm", r: [146, 290, 108, 40] },

    // Running kit
    { id: "run-chest", garment: "run", view: "front", name: "Chest", size: "20 × 9 cm", r: [148, 104, 104, 46] },
    { id: "run-front", garment: "run", view: "front", name: "Lower front", size: "20 × 8 cm", r: [148, 196, 104, 40],
      note: "Sits just above the race number." },
    { id: "run-leg-r", garment: "run", view: "front", name: "Right leg", size: "11 × 6 cm", r: [112, 338, 60, 32] },
    { id: "run-leg-l", garment: "run", view: "front", name: "Left leg", size: "11 × 6 cm", r: [228, 338, 60, 32] },
    { id: "run-back", garment: "run", view: "back", name: "Upper back", size: "22 × 11 cm", r: [144, 92, 112, 56] },
    { id: "run-waist", garment: "run", view: "back", name: "Back waistband", size: "24 × 5 cm", r: [140, 290, 120, 28] },

    // Accessories
    { id: "acc-cap", garment: "acc", view: "gear", name: "Cap front", size: "8 × 4 cm", r: [86, 94, 68, 34] },
    { id: "acc-helmet", garment: "acc", view: "gear", name: "Helmet side", size: "10 × 4 cm", r: [268, 96, 74, 26] },
    { id: "acc-belt", garment: "acc", view: "gear", name: "Race belt", size: "12 × 3 cm", r: [58, 237, 92, 18] },
    { id: "acc-downtube", garment: "acc", view: "gear", name: "Bike down tube", size: "40 × 4 cm", r: [192, 383, 112, 18], rot: -34 },
    { id: "acc-toptube", garment: "acc", view: "gear", name: "Bike top tube", size: "25 × 3 cm", r: [192, 322, 80, 14], rot: -3 },
  ];

  window.KIT = { garments, drawings, zones };
})();
