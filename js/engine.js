/*
 * Recommendation engine.
 *
 * recommend(profile) takes:
 *   rating   NTRP number, 2.0 - 7.0
 *   gender   "male" | "female" | "unspecified"
 *   age      years
 *   style    "spin" | "flat" | "allcourt"
 *   racquet  { name?, headSize (sq in), pattern ("16x19"), ra (stiffness) }
 *   armPain  boolean (optional)
 *   budget   "value" | "mid" | "premium" (optional, default "mid")
 *
 * and returns ranked string picks with tension, gauge and the reasoning
 * behind each adjustment.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./data.js"));
  } else {
    root.StringEngine = factory(root.StringData);
  }
})(typeof self !== "undefined" ? self : this, function (data) {
  "use strict";

  const ATTRS = ["power", "control", "spin", "comfort", "durability", "tensionHold"];

  const GAUGE_MM = { "15L": 1.35, "16": 1.3, "16L": 1.27, "17": 1.24, "18": 1.18 };

  function ageGroup(age) {
    if (age < 12) return "child";
    if (age < 18) return "teen";
    if (age < 50) return "adult";
    if (age < 65) return "senior";
    return "veteran";
  }

  function patternDensity(pattern) {
    const [mains, crosses] = String(pattern).split("x").map(Number);
    const n = mains * crosses;
    if (!n) return "standard";
    if (n <= 288) return "open";
    if (n >= 342) return "dense";
    return "standard";
  }

  function normalize(profile) {
    const racquet = profile.racquet || {};
    return {
      rating: Number(profile.rating) || 3.0,
      gender: profile.gender || "unspecified",
      age: Number(profile.age) || 30,
      style: profile.style || "allcourt",
      armPain: Boolean(profile.armPain),
      budget: profile.budget || "mid",
      racquet: {
        name: racquet.name || "",
        headSize: Number(racquet.headSize) || 100,
        pattern: racquet.pattern || "16x19",
        ra: Number(racquet.ra) || 66,
      },
    };
  }

  /* How much this player should value each string property. */
  function computeWeights(p) {
    const w = { power: 1, control: 1, spin: 1, comfort: 1, durability: 0.5, tensionHold: 0.5 };
    const group = ageGroup(p.age);
    const density = patternDensity(p.racquet.pattern);

    // Skill level: newer players need free power and forgiveness; strong
    // players generate their own pace and need to keep it in the court.
    if (p.rating < 3.0) {
      w.power += 1.5; w.comfort += 1; w.spin -= 0.5; w.control -= 0.3;
    } else if (p.rating < 3.5) {
      w.power += 0.8; w.comfort += 0.6; w.spin -= 0.2;
    } else if (p.rating >= 4.5) {
      w.control += 1.5; w.tensionHold += 0.5; w.power -= 0.5;
      if (p.rating >= 5.0) w.control += 0.5;
    } else if (p.rating >= 4.0) {
      w.control += 0.7; w.tensionHold += 0.2;
    }

    // Stroke style.
    if (p.style === "spin") {
      w.spin += 2; w.durability += 0.5;
    } else if (p.style === "flat") {
      w.control += 1.5; w.tensionHold += 0.3; w.power -= 0.3;
    } else {
      w.comfort += 0.4; w.power += 0.2;
    }

    // Age: the young and the older both benefit from softer, livelier strings.
    if (group === "child") { w.comfort += 1.5; w.power += 1; }
    if (group === "senior") { w.comfort += 1; w.power += 0.5; }
    if (group === "veteran") { w.comfort += 1.5; w.power += 1; }

    // Gender is only a weak proxy for swing speed at recreational levels and
    // carries no weight once a player's rating shows they generate pace.
    if (p.gender === "female" && p.rating < 4.5) w.power += 0.3;

    // Racquet head size: small heads need help with power, big heads with control.
    if (p.racquet.headSize <= 97) w.power += 0.5;
    if (p.racquet.headSize >= 105) { w.control += 1; w.power -= 0.5; }

    // String pattern.
    if (density === "open") w.durability += 0.3;
    if (density === "dense") w.spin += 0.3;

    // Frame stiffness: stiff frames pass more shock to the arm.
    if (p.racquet.ra >= 70) w.comfort += 1.5;
    else if (p.racquet.ra >= 68) w.comfort += 0.7;

    if (p.armPain) w.comfort += 3;

    for (const k of ATTRS) w[k] = Math.max(0.1, w[k]);
    return w;
  }

  /* Hard exclusions and soft penalties for a string given the player. */
  function assess(string, p) {
    const group = ageGroup(p.age);
    let penalty = 0;
    const cautions = [];

    if (string.family === "poly") {
      const soft = string.type === "softPoly";
      if (group === "child") return { allowed: false, reason: "Full polyester is too stiff for a junior's developing arm." };
      if (p.rating < 3.0) return { allowed: false, reason: "Polyester needs fast, full swings to work; it would rob a newer player of power." };
      if (p.armPain && !soft) return { allowed: false, reason: "Firm polyester is the most common string-related cause of tennis elbow." };
      if (p.armPain) { penalty += 8; cautions.push("Even soft poly is firmer than multifilament or gut; monitor your arm."); }

      if (p.rating < 4.0) {
        let pen = soft ? 1.5 : string.type === "shapedPoly" ? 4 : 6;
        if (p.style === "spin") pen /= 2;
        penalty += pen;
      }
      if (group === "teen" && p.rating < 4.0) penalty += 4;
      if (group === "veteran") penalty += soft ? 2 : 5;
      if (group === "senior") penalty += soft ? 0 : 2;
      if (p.racquet.ra >= 70) {
        penalty += soft ? 1 : 3;
        cautions.push(`Your frame is stiff (RA ${p.racquet.ra}); poly in a stiff frame is harsh, so keep tension low and restring often.`);
      }
    }

    if (string.family === "hybrid") {
      if (group === "child") penalty += 8;
      if (p.rating < 3.0) penalty += 5;
      const softCross = /Touch|X-One|Synthetic/.test(string.crosses || "");
      if (p.armPain && !/Touch/.test(string.mains || "")) penalty += softCross ? 2 : 4;
    }

    if (string.type === "gut" && p.rating < 3.5) {
      penalty += 8;
      cautions.push("Natural gut is excellent but costly for a developing player.");
    }
    if (string.type === "synGut" && p.rating >= 4.5) penalty += 5;
    if (string.type === "multi" && p.rating >= 4.5 && p.style === "spin") {
      penalty += 3;
      cautions.push("Heavy topspin will fray multifilament quickly.");
    }

    // Price tiers run 1 (budget) to 4 (natural gut).
    const PRICE_PENALTY = {
      value: [0, 0, 4, 8, Infinity],
      mid: [0, 0, 1, 3, 7],
      premium: [0, 0, 0, 0, 0],
    };
    const pricePenalty = (PRICE_PENALTY[p.budget] || PRICE_PENALTY.mid)[string.price];
    if (pricePenalty === Infinity) return { allowed: false, reason: "Outside a value budget." };
    // Newer players and growing juniors get the least return from premium string.
    const priceSensitivity = p.rating < 3.0 || group === "child" ? 1.5 : 1;
    penalty += pricePenalty * priceSensitivity;

    return { allowed: true, penalty, cautions };
  }

  function weightedScore(string, weights) {
    let total = 0;
    let weightSum = 0;
    for (const k of ATTRS) {
      total += weights[k] * string.attrs[k];
      weightSum += weights[k];
    }
    return (total / weightSum) * 10;
  }

  /* Material class used for tension: poly, softPoly, soft (multi/syn gut) or gut. */
  function tensionKind(stringName) {
    const s = data.STRINGS.find((x) => x.name === stringName);
    if (!s) return "soft";
    if (s.type === "gut") return "gut";
    if (s.type === "softPoly") return "softPoly";
    if (s.family === "poly") return "poly";
    return "soft";
  }

  const BASE_TENSION = { poly: 50, softPoly: 51, soft: 55, gut: 56 };

  function recommendTension(p, kind) {
    const group = ageGroup(p.age);
    const density = patternDensity(p.racquet.pattern);
    const adjustments = [];
    let t = BASE_TENSION[kind];

    const add = (delta, reason) => {
      if (delta) { t += delta; adjustments.push({ delta, reason }); }
    };

    const headAdj = Math.round((p.racquet.headSize - 100) * 0.25 * 2) / 2;
    if (headAdj > 0) add(headAdj, `${p.racquet.headSize} sq in head has more trampoline effect`);
    if (headAdj < 0) add(headAdj, `${p.racquet.headSize} sq in head has less built-in power`);

    if (density === "dense") add(-2, `dense ${p.racquet.pattern} pattern plays stiffer`);
    if (density === "open") add(1, `open ${p.racquet.pattern} pattern plays livelier`);

    if (p.style === "flat") add(2, "hard flat hitting needs a tighter bed for control");
    if (p.style === "spin") add(-1, "a slightly looser bed increases dwell time and spin");

    if (p.rating < 3.0) add(-2, "lower tension gives a bigger sweet spot and easy power");
    else if (p.rating >= 5.0) add(1, "high swing speed can handle a firmer bed");

    if (group === "child") add(-3, "junior arms need a soft, forgiving bed");
    if (group === "senior") add(-1, "extra comfort for the arm");
    if (group === "veteran") add(-2, "extra comfort and free power");

    if (p.racquet.ra >= 70) add(-1.5, `stiff frame (RA ${p.racquet.ra}) transmits more shock`);
    if (p.armPain) add(-3, "arm pain: softer bed reduces shock");

    t = Math.min(62, Math.max(38, t));
    const mid = Math.round(t);
    return {
      lbs: [mid - 2, mid + 2],
      kg: [Math.round((mid - 2) * 0.4536), Math.round((mid + 2) * 0.4536)],
      target: mid,
      base: BASE_TENSION[kind],
      adjustments,
    };
  }

  function targetGaugeMm(string, p) {
    const isPoly = string.family === "poly";
    if (isPoly) {
      if (p.style === "flat" && p.rating >= 4.0) return 1.3; // string breakers / durability
      if (p.style === "spin" && p.rating >= 5.0) return 1.27; // very fast swings snap thin poly
      return 1.24;
    }
    if (p.armPain || ageGroup(p.age) === "veteran") return 1.24;
    return 1.3;
  }

  function recommendGauge(string, p) {
    if (string.type === "hybrid") return string.gauges[0];
    const target = targetGaugeMm(string, p);
    let best = string.gauges[0];
    for (const g of string.gauges) {
      if (Math.abs(GAUGE_MM[g] - target) < Math.abs(GAUGE_MM[best] - target)) best = g;
    }
    return `${best} (${GAUGE_MM[best].toFixed(2)} mm)`;
  }

  function describeStrengths(string, weights) {
    // The attributes that both matter to this player and the string is good at.
    return ATTRS.map((k) => ({ k, v: string.attrs[k] * weights[k] }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 2)
      .map((x) => x.k);
  }

  const ATTR_LABEL = {
    power: "power", control: "control", spin: "spin", comfort: "comfort",
    durability: "durability", tensionHold: "tension maintenance",
  };

  function generalNotes(p) {
    const notes = [];
    const group = ageGroup(p.age);
    if (p.gender === "female" && p.rating < 4.5) {
      notes.push("Gender is used only as a light hint toward more power at recreational levels. Your own swing speed matters far more, so adjust if you swing fast.");
    }
    if (group === "child") notes.push("For juniors, stick with synthetic gut or multifilament until they play 4.0-level tennis and are physically mature.");
    if (p.racquet.ra >= 70) notes.push(`Your frame is stiff (RA ${p.racquet.ra}). Softer strings and lower tension will protect your arm.`);
    if (p.racquet.headSize >= 105) notes.push("Oversize heads launch the ball more; a controlled string and slightly higher tension help keep it in.");
    if (patternDensity(p.racquet.pattern) === "dense") notes.push(`Dense ${p.racquet.pattern} patterns limit string movement, so a shaped or slick poly helps you get spin.`);
    if (p.armPain) notes.push("With arm pain, natural gut or a premium multifilament at low tension is the safest choice. A dampener does not reduce shock to the arm.");
    notes.push("Restring at least as many times a year as you play per week. Polyester goes dead in roughly 15-25 hours of play even if it doesn't break.");
    return notes;
  }

  function recommend(profileInput) {
    const p = normalize(profileInput);
    const weights = computeWeights(p);
    const excluded = [];
    const scored = [];

    for (const s of data.STRINGS) {
      const a = assess(s, p);
      if (!a.allowed) { excluded.push({ string: s, reason: a.reason }); continue; }
      const score = Math.max(0, Math.min(100, weightedScore(s, weights) - a.penalty));
      scored.push({ string: s, score, cautions: a.cautions });
    }
    scored.sort((a, b) => b.score - a.score);

    // Keep the top three varied: no more than two of the same type.
    const picks = [];
    const typeCount = {};
    for (const c of scored) {
      if ((typeCount[c.string.type] || 0) >= 2) continue;
      typeCount[c.string.type] = (typeCount[c.string.type] || 0) + 1;
      picks.push(c);
      if (picks.length === 3) break;
    }

    const results = picks.map((c) => {
      const s = c.string;
      let tension;
      if (s.type === "hybrid") {
        tension = {
          mains: recommendTension(p, tensionKind(s.mains)),
          crosses: recommendTension(p, tensionKind(s.crosses)),
        };
      } else {
        tension = { mains: recommendTension(p, tensionKind(s.name)) };
      }
      return {
        id: s.id,
        name: s.name,
        type: s.type,
        typeLabel: data.STRING_TYPES[s.type].label,
        typeSummary: data.STRING_TYPES[s.type].summary,
        attrs: s.attrs,
        price: s.price,
        match: Math.round(c.score),
        strengths: describeStrengths(s, weights).map((k) => ATTR_LABEL[k]),
        gauge: recommendGauge(s, p),
        tension,
        cautions: c.cautions,
      };
    });

    return {
      profile: p,
      weights,
      picks: results,
      excluded: excluded.map((e) => ({ name: e.string.name, reason: e.reason })),
      notes: generalNotes(p),
    };
  }

  return { recommend, computeWeights, recommendTension, patternDensity, ageGroup, ATTRS };
});
