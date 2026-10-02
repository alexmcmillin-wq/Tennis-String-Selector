const test = require("node:test");
const assert = require("node:assert/strict");
const { recommend, recommendTension, patternDensity, ageGroup } = require("../js/engine.js");

const racquet = (o = {}) => ({ headSize: 100, pattern: "16x19", ra: 66, ...o });
const player = (o = {}) => ({ rating: 4.0, gender: "male", age: 30, style: "allcourt", racquet: racquet(), ...o });
const families = (r) => r.picks.map((p) => p.type);
const isPoly = (t) => t === "poly" || t === "shapedPoly" || t === "softPoly";

test("always returns three picks with tension and gauge", () => {
  const r = recommend(player());
  assert.equal(r.picks.length, 3);
  for (const p of r.picks) {
    assert.ok(p.tension.mains.lbs[0] < p.tension.mains.lbs[1]);
    assert.ok(p.gauge);
    assert.ok(p.match >= 0 && p.match <= 100);
  }
});

test("beginners and young juniors never get full polyester", () => {
  for (const profile of [player({ rating: 2.5 }), player({ age: 10, rating: 3.5, style: "spin" })]) {
    const r = recommend(profile);
    assert.ok(!families(r).some(isPoly), families(r).join());
    assert.ok(r.excluded.some((e) => e.name === "Babolat RPM Blast"));
  }
});

test("advanced spin hitter gets shaped polyester first", () => {
  const r = recommend(player({ rating: 4.5, age: 22, style: "spin" }));
  assert.equal(r.picks[0].type, "shapedPoly");
});

test("advanced flat hitter gets a control-oriented polyester", () => {
  const r = recommend(player({ rating: 5.0, style: "flat", racquet: racquet({ headSize: 98, pattern: "18x20", ra: 62 }) }));
  assert.ok(isPoly(r.picks[0].type));
  assert.ok(r.picks[0].attrs.control >= 8);
});

test("arm pain excludes firm polyester and favours gut or multi", () => {
  const r = recommend(player({ rating: 3.5, age: 68, armPain: true, racquet: racquet({ ra: 72 }) }));
  assert.ok(["gut", "multi"].includes(r.picks[0].type));
  assert.ok(r.excluded.some((e) => e.name === "Luxilon 4G"));
});

test("value budget excludes natural gut", () => {
  const r = recommend(player({ rating: 3.0, budget: "value" }));
  assert.ok(!r.picks.some((p) => p.name.includes("VS Touch")));
});

test("polyester is strung looser than multifilament for the same player", () => {
  const r = recommend(player({ rating: 4.0, style: "spin" }));
  const hybrid = r.picks.find((p) => p.type === "hybrid") ||
    recommend(player({ rating: 3.5, age: 45, style: "spin", racquet: racquet({ ra: 68 }) })).picks.find((p) => p.type === "hybrid");
  assert.ok(hybrid, "expected a hybrid pick");
  assert.ok(hybrid.tension.mains.target < hybrid.tension.crosses.target);
});

test("tension rises with head size and flat hitting, falls with arm pain", () => {
  const t = (o) => recommendTension(player({ rating: 3.0, ...o }), "soft").target;
  assert.ok(t({ racquet: racquet({ headSize: 110 }) }) > t({ racquet: racquet({ headSize: 95 }) }));
  assert.ok(t({ style: "flat" }) > t({ style: "spin" }));
  assert.ok(t({ armPain: true }) < t({}));
  assert.ok(t({ racquet: racquet({ pattern: "18x20" }) }) < t({}));
});

test("helpers classify patterns and ages", () => {
  assert.equal(patternDensity("16x18"), "open");
  assert.equal(patternDensity("16x19"), "standard");
  assert.equal(patternDensity("18x20"), "dense");
  assert.equal(ageGroup(10), "child");
  assert.equal(ageGroup(16), "teen");
  assert.equal(ageGroup(70), "veteran");
});
