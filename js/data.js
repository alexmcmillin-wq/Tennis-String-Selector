/*
 * Reference data for the string selector.
 *
 * String attributes are on a 1-10 scale and reflect consensus from lab
 * testing (stiffness, tension loss) and player reviews. They are relative
 * to each other, not absolute measurements.
 *
 *   power        - how much depth the string gives for the same swing
 *   control      - how well it limits launch angle / trampoline effect
 *   spin         - snapback and bite on the ball
 *   comfort      - softness, vibration and shock reaching the arm
 *   durability   - resistance to notching and breakage
 *   tensionHold  - how well it maintains tension over time
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StringData = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STRING_TYPES = {
    poly: {
      label: "Polyester (co-poly)",
      summary:
        "Stiff, low-powered and spin-friendly. Gives advanced players with fast swings control and bite, but is harsh on the arm and loses tension quickly.",
    },
    shapedPoly: {
      label: "Shaped polyester",
      summary:
        "Polyester with edges (square, hex, octagonal) that grip the ball for maximum spin. The go-to for heavy topspin players.",
    },
    softPoly: {
      label: "Soft polyester",
      summary:
        "A more elastic co-poly that keeps most of the control and spin of poly with noticeably better comfort and power.",
    },
    multi: {
      label: "Multifilament",
      summary:
        "Hundreds of micro-fibres bundled together. Soft, powerful and arm-friendly; the closest synthetic to natural gut.",
    },
    gut: {
      label: "Natural gut",
      summary:
        "The benchmark for power, comfort, feel and tension maintenance. Expensive and less durable, and sensitive to moisture.",
    },
    synGut: {
      label: "Synthetic gut",
      summary:
        "Solid nylon core with wraps. Inexpensive and well-rounded; a sensible default for beginners and casual players.",
    },
    hybrid: {
      label: "Hybrid",
      summary:
        "Two different strings in the mains and crosses, blending the strengths of each (for example poly control with gut comfort).",
    },
  };

  // family: the broad material group used by eligibility rules.
  const STRINGS = [
    // Shaped polyester
    { id: "rpm-blast", name: "Babolat RPM Blast", type: "shapedPoly", family: "poly", gauges: ["16", "17"], price: 2,
      attrs: { power: 4, control: 8, spin: 9, comfort: 4, durability: 8, tensionHold: 6 } },
    { id: "hyper-g", name: "Solinco Hyper-G", type: "shapedPoly", family: "poly", gauges: ["16", "16L", "17"], price: 2,
      attrs: { power: 5, control: 8, spin: 9, comfort: 4, durability: 8, tensionHold: 6 } },
    { id: "lynx-tour", name: "Head Lynx Tour", type: "shapedPoly", family: "poly", gauges: ["16", "17"], price: 2,
      attrs: { power: 5, control: 8, spin: 8, comfort: 6, durability: 7, tensionHold: 6 } },
    { id: "cyclone", name: "Volkl Cyclone", type: "shapedPoly", family: "poly", gauges: ["16", "17", "18"], price: 1,
      attrs: { power: 5, control: 7, spin: 8, comfort: 5, durability: 8, tensionHold: 5 } },

    // Round / firm polyester
    { id: "alu-power", name: "Luxilon ALU Power", type: "poly", family: "poly", gauges: ["16L", "17"], price: 3,
      attrs: { power: 6, control: 9, spin: 7, comfort: 5, durability: 7, tensionHold: 5 } },
    { id: "4g", name: "Luxilon 4G", type: "poly", family: "poly", gauges: ["16L", "17"], price: 3,
      attrs: { power: 4, control: 9, spin: 6, comfort: 3, durability: 9, tensionHold: 9 } },
    { id: "confidential", name: "Solinco Confidential", type: "poly", family: "poly", gauges: ["16L", "17"], price: 2,
      attrs: { power: 4, control: 9, spin: 7, comfort: 4, durability: 8, tensionHold: 9 } },

    // Soft polyester
    { id: "poly-tour-pro", name: "Yonex Poly Tour Pro", type: "softPoly", family: "poly", gauges: ["16L", "17"], price: 2,
      attrs: { power: 6, control: 7, spin: 7, comfort: 7, durability: 6, tensionHold: 6 } },
    { id: "solstice-power", name: "Diadem Solstice Power", type: "softPoly", family: "poly", gauges: ["16L", "17"], price: 2,
      attrs: { power: 7, control: 7, spin: 7, comfort: 7, durability: 6, tensionHold: 6 } },

    // Multifilament
    { id: "x-one", name: "Tecnifibre X-One Biphase", type: "multi", family: "soft", gauges: ["16", "17", "18"], price: 3,
      attrs: { power: 8, control: 5, spin: 4, comfort: 9, durability: 4, tensionHold: 7 } },
    { id: "nxt", name: "Wilson NXT", type: "multi", family: "soft", gauges: ["16", "17"], price: 3,
      attrs: { power: 8, control: 5, spin: 4, comfort: 9, durability: 4, tensionHold: 6 } },
    { id: "velocity", name: "Head Velocity MLT", type: "multi", family: "soft", gauges: ["16", "17"], price: 1,
      attrs: { power: 7, control: 5, spin: 4, comfort: 8, durability: 5, tensionHold: 6 } },

    // Natural gut
    { id: "vs-touch", name: "Babolat VS Touch", type: "gut", family: "soft", gauges: ["16", "15L"], price: 4,
      attrs: { power: 10, control: 6, spin: 5, comfort: 10, durability: 3, tensionHold: 10 } },

    // Synthetic gut
    { id: "duraflex", name: "Prince Synthetic Gut Duraflex", type: "synGut", family: "soft", gauges: ["16", "17"], price: 1,
      attrs: { power: 6, control: 6, spin: 5, comfort: 6, durability: 6, tensionHold: 5 } },
    { id: "pps", name: "Head Synthetic Gut PPS", type: "synGut", family: "soft", gauges: ["16", "17"], price: 1,
      attrs: { power: 6, control: 6, spin: 5, comfort: 6, durability: 7, tensionHold: 5 } },

    // Hybrids (mains / crosses)
    { id: "gut-alu", name: "VS Touch mains / ALU Power crosses", type: "hybrid", family: "hybrid", gauges: ["16 / 16L"],
      mains: "Babolat VS Touch", crosses: "Luxilon ALU Power",
      attrs: { power: 8, control: 7, spin: 6, comfort: 8, durability: 5, tensionHold: 8 } },
    { id: "alu-gut", name: "ALU Power mains / VS Touch crosses", type: "hybrid", family: "hybrid", gauges: ["16L / 16"],
      mains: "Luxilon ALU Power", crosses: "Babolat VS Touch",
      attrs: { power: 7, control: 8, spin: 8, comfort: 7, durability: 7, tensionHold: 7 } },
    { id: "rpm-multi", name: "RPM Blast mains / X-One Biphase crosses", type: "hybrid", family: "hybrid", gauges: ["17 / 16"],
      mains: "Babolat RPM Blast", crosses: "Tecnifibre X-One Biphase",
      attrs: { power: 6, control: 7, spin: 8, comfort: 7, durability: 7, tensionHold: 6 } },
    { id: "poly-syn", name: "Hyper-G mains / Synthetic Gut crosses", type: "hybrid", family: "hybrid", gauges: ["17 / 16"],
      mains: "Solinco Hyper-G", crosses: "Prince Synthetic Gut Duraflex",
      attrs: { power: 6, control: 7, spin: 7, comfort: 6, durability: 8, tensionHold: 5 } },
  ];

  // A hybrid uses half a set of each string, so it costs the average of the two.
  for (const s of STRINGS) {
    if (s.type !== "hybrid") continue;
    const price = (name) => STRINGS.find((x) => x.name === name).price;
    s.price = Math.ceil((price(s.mains) + price(s.crosses)) / 2);
  }

  // RA = flex stiffness rating. Specs are for current-generation standard models.
  const RACQUETS = [
    { id: "pure-aero", name: "Babolat Pure Aero", headSize: 100, pattern: "16x19", ra: 66, weight: 300 },
    { id: "pure-drive", name: "Babolat Pure Drive", headSize: 100, pattern: "16x19", ra: 71, weight: 300 },
    { id: "pure-strike-98", name: "Babolat Pure Strike 98 16x19", headSize: 98, pattern: "16x19", ra: 65, weight: 305 },
    { id: "pure-drive-107", name: "Babolat Pure Drive 107", headSize: 107, pattern: "16x19", ra: 70, weight: 285 },
    { id: "blade-98-16", name: "Wilson Blade 98 16x19", headSize: 98, pattern: "16x19", ra: 62, weight: 305 },
    { id: "blade-98-18", name: "Wilson Blade 98 18x20", headSize: 98, pattern: "18x20", ra: 62, weight: 305 },
    { id: "pro-staff-97", name: "Wilson Pro Staff 97", headSize: 97, pattern: "16x19", ra: 66, weight: 315 },
    { id: "clash-100", name: "Wilson Clash 100", headSize: 100, pattern: "16x19", ra: 55, weight: 295 },
    { id: "ultra-100", name: "Wilson Ultra 100", headSize: 100, pattern: "16x19", ra: 72, weight: 300 },
    { id: "hyper-hammer", name: "Wilson Hyper Hammer 5.3 OS", headSize: 110, pattern: "16x20", ra: 71, weight: 240 },
    { id: "speed-mp", name: "Head Speed MP", headSize: 100, pattern: "16x19", ra: 64, weight: 300 },
    { id: "radical-mp", name: "Head Radical MP", headSize: 98, pattern: "16x19", ra: 66, weight: 300 },
    { id: "gravity-pro", name: "Head Gravity Pro", headSize: 100, pattern: "18x20", ra: 62, weight: 315 },
    { id: "prestige-mp", name: "Head Prestige MP", headSize: 99, pattern: "18x19", ra: 63, weight: 320 },
    { id: "boom-mp", name: "Head Boom MP", headSize: 100, pattern: "16x19", ra: 66, weight: 295 },
    { id: "ti-s6", name: "Head Ti.S6", headSize: 115, pattern: "16x19", ra: 70, weight: 225 },
    { id: "ezone-100", name: "Yonex EZONE 100", headSize: 100, pattern: "16x19", ra: 68, weight: 300 },
    { id: "vcore-98", name: "Yonex VCORE 98", headSize: 98, pattern: "16x19", ra: 66, weight: 305 },
    { id: "percept-97", name: "Yonex Percept 97", headSize: 97, pattern: "16x19", ra: 64, weight: 310 },
    { id: "tf40-305", name: "Tecnifibre TF40 305 18x20", headSize: 98, pattern: "18x20", ra: 63, weight: 305 },
    { id: "sx-300", name: "Dunlop SX 300", headSize: 100, pattern: "16x19", ra: 69, weight: 300 },
    { id: "junior-26", name: "Junior racquet (25-26\")", headSize: 100, pattern: "16x19", ra: 60, weight: 250 },
  ];

  const RATINGS = [
    { value: 2.0, label: "2.0 - New to the game", utr: "1-2" },
    { value: 2.5, label: "2.5 - Learning strokes", utr: "1.5-2.5" },
    { value: 3.0, label: "3.0 - Consistent rallies at moderate pace", utr: "2.5-3.5" },
    { value: 3.5, label: "3.5 - Directional control, developing spin", utr: "3.5-4.5" },
    { value: 4.0, label: "4.0 - Dependable strokes, varied spin", utr: "4.5-6" },
    { value: 4.5, label: "4.5 - Power and spin as weapons", utr: "6-7.5" },
    { value: 5.0, label: "5.0 - Strong tournament / college club", utr: "7.5-9" },
    { value: 5.5, label: "5.5+ - College varsity / satellite pro", utr: "9-11" },
    { value: 6.0, label: "6.0-7.0 - Professional / world-class", utr: "11+" },
  ];

  return { STRING_TYPES, STRINGS, RACQUETS, RATINGS };
});
