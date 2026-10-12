// Tabs and ad-spot placement for the 3D kit.
//
// The mannequin is life-size in metres: feet at y = 0, top of head at about y = 1.78,
// facing +z. "Left" and "right" are from the wearer's point of view (wearer's right is -x).
//
// Each spot is projected onto the named 3D part (`on`) along a ray that starts at `from`
// and travels in direction `dir`. `w` and `h` are the patch size in metres, `roll` turns
// the patch around its centre in degrees. Prices live in config.js.
window.KIT = {
  tabs: [
    { id: "tri", name: "Trisuit", scene: "suit", outfit: "tri" },
    { id: "cyc", name: "Cycling kit", scene: "suit", outfit: "cyc" },
    { id: "run", name: "Running kit", scene: "suit", outfit: "run" },
    { id: "helm", name: "Helmet & belt", scene: "suit", outfit: "helm" },
    { id: "bike", name: "Bike", scene: "bike" },
  ],

  spots: [
    // Trisuit
    { id: "tri-chest", tab: "tri", name: "Chest", on: "torso", from: [0, 1.32, 1], dir: [0, 0, -1], w: 0.2, h: 0.09 },
    { id: "tri-sleeve-r", tab: "tri", name: "Right sleeve", on: "sleeveR", from: [-1, 1.37, 0], dir: [1, 0, 0], w: 0.06, h: 0.07 },
    { id: "tri-sleeve-l", tab: "tri", name: "Left sleeve", on: "sleeveL", from: [1, 1.37, 0], dir: [-1, 0, 0], w: 0.06, h: 0.07 },
    { id: "tri-belly", tab: "tri", name: "Stomach", on: "torso", from: [0, 1.13, 1], dir: [0, 0, -1], w: 0.2, h: 0.08 },
    { id: "tri-thigh-r", tab: "tri", name: "Right thigh", on: "legR", from: [-1, 0.79, 0], dir: [1, 0, 0], w: 0.1, h: 0.08 },
    { id: "tri-thigh-l", tab: "tri", name: "Left thigh", on: "legL", from: [1, 0.79, 0], dir: [-1, 0, 0], w: 0.1, h: 0.08 },
    { id: "tri-namebar", tab: "tri", name: "Name bar", on: "torso", from: [0, 1.42, -1], dir: [0, 0, 1], w: 0.22, h: 0.045 },
    { id: "tri-back", tab: "tri", name: "Upper back", on: "torso", from: [0, 1.29, -1], dir: [0, 0, 1], w: 0.22, h: 0.11 },
    { id: "tri-seat", tab: "tri", name: "Seat", on: "torso", from: [0, 0.94, -1], dir: [0, 0, 1], w: 0.2, h: 0.08,
      note: "Faces every rider behind me on the bike." },

    // Cycling kit
    { id: "cyc-chest", tab: "cyc", name: "Jersey chest", on: "torso", from: [0, 1.32, 1], dir: [0, 0, -1], w: 0.2, h: 0.08 },
    { id: "cyc-sleeve-r", tab: "cyc", name: "Right sleeve", on: "sleeveR", from: [-1, 1.33, 0], dir: [1, 0, 0], w: 0.06, h: 0.09 },
    { id: "cyc-sleeve-l", tab: "cyc", name: "Left sleeve", on: "sleeveL", from: [1, 1.33, 0], dir: [-1, 0, 0], w: 0.06, h: 0.09 },
    { id: "cyc-front", tab: "cyc", name: "Jersey front", on: "torso", from: [0, 1.14, 1], dir: [0, 0, -1], w: 0.2, h: 0.08 },
    { id: "cyc-thigh-r", tab: "cyc", name: "Right thigh", on: "legR", from: [-1, 0.74, 0], dir: [1, 0, 0], w: 0.11, h: 0.08 },
    { id: "cyc-thigh-l", tab: "cyc", name: "Left thigh", on: "legL", from: [1, 0.74, 0], dir: [-1, 0, 0], w: 0.11, h: 0.08 },
    { id: "cyc-back", tab: "cyc", name: "Upper back", on: "torso", from: [0, 1.3, -1], dir: [0, 0, 1], w: 0.24, h: 0.1 },
    { id: "cyc-pockets", tab: "cyc", name: "Pocket band", on: "torso", from: [0, 1.06, -1], dir: [0, 0, 1], w: 0.26, h: 0.06 },
    { id: "cyc-seat", tab: "cyc", name: "Seat", on: "torso", from: [0, 0.94, -1], dir: [0, 0, 1], w: 0.2, h: 0.07 },

    // Running kit
    { id: "run-cap", tab: "run", name: "Cap front", on: "cap", from: [0, 1.735, 1], dir: [0, 0, -1], w: 0.09, h: 0.04 },
    { id: "run-chest", tab: "run", name: "Chest", on: "torso", from: [0, 1.31, 1], dir: [0, 0, -1], w: 0.2, h: 0.09 },
    { id: "run-front", tab: "run", name: "Lower front", on: "torso", from: [0, 1.13, 1], dir: [0, 0, -1], w: 0.2, h: 0.07,
      note: "Sits just above the race number." },
    { id: "run-leg-r", tab: "run", name: "Right leg", on: "legR", from: [-1, 0.84, 0], dir: [1, 0, 0], w: 0.08, h: 0.06 },
    { id: "run-leg-l", tab: "run", name: "Left leg", on: "legL", from: [1, 0.84, 0], dir: [-1, 0, 0], w: 0.08, h: 0.06 },
    { id: "run-back", tab: "run", name: "Upper back", on: "torso", from: [0, 1.29, -1], dir: [0, 0, 1], w: 0.22, h: 0.1 },
    { id: "run-waist", tab: "run", name: "Back waistband", on: "torso", from: [0, 0.97, -1], dir: [0, 0, 1], w: 0.22, h: 0.045 },

    // Helmet & race belt
    { id: "helm-side-r", tab: "helm", name: "Helmet, right side", on: "helmet", from: [-1, 1.72, -0.07], dir: [1, 0, 0], w: 0.14, h: 0.05 },
    { id: "helm-side-l", tab: "helm", name: "Helmet, left side", on: "helmet", from: [1, 1.72, -0.07], dir: [-1, 0, 0], w: 0.14, h: 0.05 },
    { id: "helm-tail", tab: "helm", name: "Helmet top", on: "helmet", from: [0, 2.2, -0.05], dir: [0, -1, 0], w: 0.07, h: 0.13 },
    { id: "helm-belt", tab: "helm", name: "Race belt", on: "belt", from: [1, 1.06, 0], dir: [-1, 0, 0], w: 0.1, h: 0.024 },

    // Bike (side view along x, rear wheel at -x)
    { id: "bike-downtube", tab: "bike", name: "Down tube", on: "downtube", from: [0.19, 0.49, 1], dir: [0, 0, -1], w: 0.36, h: 0.05, roll: 38 },
    { id: "bike-toptube", tab: "bike", name: "Top tube", on: "toptube", from: [0.11, 0.85, 1], dir: [0, 0, -1], w: 0.3, h: 0.035, roll: -2 },
    { id: "bike-seattube", tab: "bike", name: "Seat tube", on: "seattube", from: [-0.115, 0.58, 1], dir: [0, 0, -1], w: 0.26, h: 0.04, roll: 103 },
    { id: "bike-disc", tab: "bike", name: "Disc wheel", on: "disc", from: [-0.52, 0.47, 1], dir: [0, 0, -1], w: 0.36, h: 0.12,
      note: "The biggest surface on race day." },
  ],
};
