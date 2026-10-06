# Tennis String Selector

A guide that recommends a tennis string, gauge and tension for a player based on:

- **Player rating** (NTRP 2.0-7.0, with approximate UTR equivalents)
- **Age**
- **Gender**
- **Hitting style**: big spin, all-court, or hard and flat
- **Racquet**: pick from 20+ popular frames, or enter specs for any racquet
- **Racquet size**: head size, string pattern and stiffness (RA)
- Optional: arm pain, budget

The tool returns three ranked picks. Each pick shows a match score, recommended gauge, a tension range in lbs and kg with a line-by-line explanation, and a property profile (power, control, spin, comfort, durability, tension hold). Below the picks it lists general advice and the strings it ruled out, with the reason for each.

## Running it

It is a static site with no build step. Open `index.html` in a browser, or serve the folder:

```sh
npm start        # serves the folder with `npx serve`
npm test         # runs the recommendation engine tests (Node 18+)
```

## How recommendations are made

The logic lives in `js/engine.js`. The string and racquet catalog lives in `js/data.js`.

1. **Weights.** Each player gets a weight for each string property. Lower ratings weight power and comfort. Higher ratings weight control and tension maintenance. Spin hitters weight spin and durability, and flat hitters weight control. All-court players weight comfort, especially at 3.0-4.0, so intermediate all-courters see a full bed of multifilament. Juniors and players over 50 weight comfort. Small heads add power; oversize heads add control. Stiff frames (RA 68+) and arm pain add comfort.
2. **Eligibility.** Full polyester is excluded for players under 12, players rated below 3.0, and players with arm pain (soft poly is still allowed for arm pain, with a penalty). Poly is penalized for 3.0-3.5 players (less so for spin hitters), for older players, and in stiff frames. Price is penalized according to the chosen budget: natural gut is excluded on a value budget and heavily penalized on mid-range. A hybrid is priced as the average of its two strings, since it uses half a set of each.
3. **Ranking.** Strings are scored by a weighted average of their properties, minus penalties. The top three are returned, with no more than two of the same string type.
4. **Tension.** Each string starts from a material baseline (poly 50, soft poly 51, multi or synthetic gut 55, gut 56 lbs). The baseline is then adjusted for head size, string pattern density, hitting style, rating, age, frame stiffness and arm pain. Hybrids get separate mains and crosses tensions.
5. **Gauge.** Thin poly (about 1.24 mm) is the default for spin and feel. Thicker poly is recommended for hard flat hitters and 5.0+ spin players, who break strings faster. Soft strings default to 16 gauge, or 17 for extra comfort.

String property ratings are relative 1-10 values based on lab data (stiffness, tension loss) and player reviews. Edit `js/data.js` to add strings or racquets. To change the rules, edit `js/engine.js` and update the tests in `test/`.
