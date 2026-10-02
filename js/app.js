(function () {
  "use strict";

  const { STRING_TYPES, RACQUETS, RATINGS } = window.StringData;
  const { recommend } = window.StringEngine;

  const $ = (id) => document.getElementById(id);
  const form = $("player-form");
  const results = $("results");

  const ATTR_LABELS = {
    power: "Power", control: "Control", spin: "Spin",
    comfort: "Comfort", durability: "Durability", tensionHold: "Tension hold",
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function populate() {
    $("rating").innerHTML = RATINGS.map((r) =>
      `<option value="${r.value}"${r.value === 3.5 ? " selected" : ""}>${esc(r.label)}</option>`).join("");

    $("racquet").innerHTML =
      `<option value="">Other / not listed</option>` +
      RACQUETS.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join("");
    $("racquet").value = "pure-aero";
    applyRacquet();

    $("types").innerHTML = Object.values(STRING_TYPES).map((t) =>
      `<article class="type-card"><h4>${esc(t.label)}</h4><p>${esc(t.summary)}</p></article>`).join("");
  }

  function applyRacquet() {
    const r = RACQUETS.find((x) => x.id === $("racquet").value);
    if (!r) return;
    $("headSize").value = String(r.headSize);
    if (!$("headSize").value) $("headSize").value = "100";
    $("pattern").value = r.pattern;
    $("ra").value = r.ra;
  }

  function readProfile() {
    const racquet = RACQUETS.find((x) => x.id === $("racquet").value);
    return {
      rating: parseFloat($("rating").value),
      age: parseInt($("age").value, 10) || 35,
      gender: $("gender").value,
      style: form.querySelector('input[name="style"]:checked').value,
      armPain: $("armPain").checked,
      budget: $("budget").value,
      racquet: {
        name: racquet ? racquet.name : "Your racquet",
        headSize: parseInt($("headSize").value, 10),
        pattern: $("pattern").value,
        ra: parseInt($("ra").value, 10) || 66,
      },
    };
  }

  function bars(attrs) {
    return `<dl class="bars">${Object.entries(ATTR_LABELS).map(([k, label]) => `
      <div class="bar"><dt>${label}</dt><dd><span style="--v:${attrs[k] * 10}%"></span><b>${attrs[k]}</b></dd></div>`).join("")}
    </dl>`;
  }

  function tensionBlock(label, t) {
    return `<div class="tension">
      <div class="tension-main"><span class="k">${label}</span>
        <span class="v">${t.lbs[0]}-${t.lbs[1]} lbs</span>
        <span class="sub">${t.kg[0]}-${t.kg[1]} kg</span></div>
      <details><summary>Why this tension</summary>
        <ul class="adj">
          <li><span>Baseline for this material</span><b>${t.base} lbs</b></li>
          ${t.adjustments.map((a) => `<li><span>${esc(a.reason)}</span><b>${a.delta > 0 ? "+" : ""}${a.delta}</b></li>`).join("")}
        </ul>
      </details>
    </div>`;
  }

  function pickCard(p, i) {
    const price = "$".repeat(p.price) + `<span class="dim">${"$".repeat(4 - p.price)}</span>`;
    const tension = p.tension.crosses
      ? tensionBlock("Mains", p.tension.mains) + tensionBlock("Crosses", p.tension.crosses)
      : tensionBlock("Tension", p.tension.mains);
    return `<article class="pick${i === 0 ? " top" : ""}">
      <header>
        <div>
          <p class="eyebrow">${i === 0 ? "Best match" : `Alternative ${i}`} &middot; ${esc(p.typeLabel)}</p>
          <h3>${esc(p.name)}</h3>
        </div>
        <div class="match" title="How well this string fits your profile"><b>${p.match}</b><span>match</span></div>
      </header>
      <p class="why">Strong where you need it most: <strong>${p.strengths.join(" and ")}</strong>.</p>
      <div class="specs">
        <div class="spec"><span class="k">Gauge</span><span class="v">${esc(p.gauge)}</span></div>
        <div class="spec"><span class="k">Price</span><span class="v price">${price}</span></div>
      </div>
      <div class="tensions">${tension}</div>
      ${bars(p.attrs)}
      ${p.cautions.length ? `<ul class="cautions">${p.cautions.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    </article>`;
  }

  function render() {
    const r = recommend(readProfile());
    const rating = RATINGS.find((x) => x.value === r.profile.rating);
    $("utr-hint").textContent = rating ? `Roughly UTR ${rating.utr}` : "";

    const styleLabel = { spin: "big spin", flat: "hard flat", allcourt: "all-court" }[r.profile.style];
    const rq = r.profile.racquet;
    results.innerHTML = `
      <p class="summary">For a <strong>${r.profile.rating} ${styleLabel}</strong> player, age ${r.profile.age},
        using a <strong>${esc(rq.name)}</strong> (${rq.headSize} sq in, ${esc(rq.pattern)}, RA ${rq.ra}):</p>
      ${r.picks.map(pickCard).join("")}
      <section class="panel notes">
        <h3>Things to know</h3>
        <ul>${r.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
        ${r.excluded.length ? `<details><summary>Strings we ruled out (${r.excluded.length})</summary>
          <ul class="excluded">${r.excluded.map((e) => `<li><b>${esc(e.name)}</b> - ${esc(e.reason)}</li>`).join("")}</ul></details>` : ""}
      </section>`;
  }

  populate();
  $("racquet").addEventListener("change", () => { applyRacquet(); render(); });
  ["headSize", "pattern", "ra"].forEach((id) => $(id).addEventListener("change", () => {
    // Manual spec edits mean the frame no longer matches a listed model.
    const r = RACQUETS.find((x) => x.id === $("racquet").value);
    if (r && (String(r.headSize) !== $("headSize").value || r.pattern !== $("pattern").value || String(r.ra) !== $("ra").value)) {
      $("racquet").value = "";
    }
  }));
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", (e) => e.preventDefault());
  render();
})();
