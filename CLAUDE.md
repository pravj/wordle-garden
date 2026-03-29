# Grit Garden

A personal art project that transforms daily Wordle attempts into poetry. Each game becomes a flower in a growing garden.

## Concept

The emotional arc of a Wordle game — confusion, partial clarity, near-miss, resolution — is mapped onto a poem. Each guess becomes a stanza, and the sentiment mirrors the progress: lost/searching for poor guesses, hopeful for partial hits, triumphant for the win.

The home page is a garden of flowers viewed from above. Each flower cluster represents one day's Wordle. The ratio of green to yellow flowers reflects how well the game went (more green = better performance). Clicking a flower opens its poem.

## Tech Stack

- **Framework**: Vanilla HTML/CSS/JS (keep it simple)
- **Hosting**: Vercel via GitHub
- **Data**: Static JSON files in `/data`
- **Art generation**: Manual, local — poems are pre-generated and stored

## Visual Style

**Botanical Illustration**
- 6-petal ellipse-based flowers viewed from above, generated as SVG
- Detailed petal structure with subtle stroke outlines
- Green petals: `#6aaa64` (correct letters)
- Yellow petals: `#c9b458` (misplaced letters)
- Flower centers: `#f5e6b3` with `#c9a83a` accents
- Background: warm off-white `#f8f6f1`
- Greenery behind flower clusters (JSON-based composition system in `greenery.js`)
- Animated wandering bee/butterfly that follows the cursor (`wanderer.js`)
- Typography: Cormorant Garamond (landing page), Playfair Display (garden/poem pages)

## Site Structure

```
/                     → Landing page (animated intro)
/garden.html          → Garden grid (flower clusters)
/poem.html?date=X     → Individual artwork page
```

### Landing Page (`/`)
- Animated scattered flowers across the page
- Title and tagline with "Enter Garden" button
- Uses Cormorant Garamond font (distinct from inner pages)
- Sound toggle placeholder (non-functional)
- Skip-landing flag with localStorage (off by default)

### Garden Page (`/garden.html`)
- Grid of flower clusters, responsive layout
- Each cluster = one Wordle game with greenery backdrop
- Flowers sized/colored based on green/yellow cell counts
- Deterministic rendering per date (seeded randomness)
- **Click**: Navigate to `/poem.html?date=YYYY-MM-DD`
- **Submit button**: Opens email link for contributions

### Artwork Page (`/poem.html?date=YYYY-MM-DD`)
- Wordle grid recreation (the guesses as colored tiles)
- Poem displayed below with stanza breaks
- Flower rendered at 150px
- Swipe (mobile) and arrow key (desktop) navigation between entries
- Shareable URL with OG image preview for social sharing

## Data Format

The `/data/wordles.json` file contains an array of entries. Games range from 2 to 6 guesses:

### Example: 2 guesses (lucky solve)

```json
{
  "date": "2026-03-10",
  "wordle_number": 1229,
  "answer": "LIGHT",
  "guesses": [
    { "word": "SLATE", "result": ["absent", "present", "absent", "present", "absent"] },
    { "word": "LIGHT", "result": ["correct", "correct", "correct", "correct", "correct"] }
  ],
  "poem": "A slate wiped clean, the day was just beginning,\nno shape yet formed, no sense of losing, winning.\n\nThen light broke through — immediate and bright,\nthe answer found in one pure flash of sight.",
  "green_count": 7,
  "yellow_count": 2
}
```

### Example: 4 guesses (solid game)

```json
{
  "date": "2026-03-15",
  "wordle_number": 1234,
  "answer": "CRANE",
  "guesses": [
    { "word": "ALERT", "result": ["absent", "present", "absent", "absent", "absent"] },
    { "word": "RAISE", "result": ["present", "correct", "absent", "absent", "present"] },
    { "word": "TRACE", "result": ["absent", "correct", "correct", "present", "correct"] },
    { "word": "CRANE", "result": ["correct", "correct", "correct", "correct", "correct"] }
  ],
  "poem": "An alert rang out across the morning haze,\na signal lost in unfamiliar maze.\n\nI tried to raise my hand against the doubt,\nbut shadows danced and turned me inside out.\n\nThen — a trace of something almost known,\na seed of hope where none had yet been sown.\n\nAt last the crane arrived on steady wing,\nand clarity bloomed into everything.",
  "green_count": 13,
  "yellow_count": 4
}
```

### Example: 6 guesses (close call)

```json
{
  "date": "2026-03-12",
  "wordle_number": 1231,
  "answer": "QUERY",
  "guesses": [
    { "word": "AUDIO", "result": ["absent", "present", "absent", "absent", "absent"] },
    { "word": "SUPER", "result": ["absent", "present", "absent", "present", "present"] },
    { "word": "RULER", "result": ["present", "correct", "absent", "correct", "correct"] },
    { "word": "OUTER", "result": ["absent", "correct", "absent", "correct", "correct"] },
    { "word": "QUEER", "result": ["correct", "correct", "correct", "correct", "correct"] },
    { "word": "QUERY", "result": ["correct", "correct", "correct", "correct", "correct"] }
  ],
  "poem": "The audio was static, nothing clear,\njust noise and fog and a whisper of fear.\n\nI felt super lost, grasping at air,\nfragments of meaning scattered everywhere.\n\nA ruler's edge — something to measure by,\na faint geometry beneath the sky.\n\nThe outer walls were closing, pressing tight,\nbut cracks appeared, admitting threads of light.\n\nSomething queer stirred in the narrowing space,\na strange familiar rhythm finding pace.\n\nAt last the query landed, understood —\nthe question answered, exactly as it should.",
  "green_count": 18,
  "yellow_count": 6
}
```

Result values: `"correct"` (green), `"present"` (yellow), `"absent"` (gray)

## Poem Generation

Poems are generated using Claude Code. See `/scripts/generate-poem.md` for full instructions.

**Quick workflow (manual):**
1. Save Wordle screenshot to `/scripts/screenshots/YYYY-MM-DD.png`
2. Ask Claude Code: "Generate a poem for scripts/screenshots/2026-03-15.png"
3. Append the JSON output to `/data/wordles.json`

**Quick workflow (automated):**
1. Run `python scripts/generate.py` with a screenshot
2. Uses Claude Sonnet 4 API to analyze the screenshot and generate poem + JSON
3. Saves to `scripts/games/YYYY-MM-DD/` and optionally appends to `data/wordles.json`

**GitHub Actions submission:**
- `.github/workflows/add-wordle.yml` allows submitting entries via `workflow_dispatch`
- Validates JSON structure, checks for duplicates, auto-commits

**System prompt used:**

```
You will be given a Wordle game screenshot.

Analyze the guesses in order:
- Note each guess word and how much progress was made
- Map the emotional arc across all guesses:
  confusion → partial clarity → near-miss → resolution
  (adjusted based on actual number of guesses)

Write a poem where:
- Number of stanzas equals the number of guesses made
- Each stanza is exactly 2 lines
- Each stanza revolves around the actual guess word,
  woven naturally into the line — not as a letter hint
- The sentiment of each stanza mirrors the progress of that guess:
  lost/searching for poor guesses, hopeful for partial hits,
  triumphant for the win
- Do NOT reference counts, numbers, or quantities of
  letters found — let the emotion carry the progress
- No references to Wordle, grids, tiles, letters, or puzzles
- The poem should read as a standalone piece about
  perseverance or discovery
```

## Flower Generation Logic

Each flower cluster represents a Wordle game:
- Count total green cells across all guesses → number of green flowers
- Count total yellow cells across all guesses → number of yellow flowers
- Larger flowers for higher counts, scattered arrangement
- Flowers overlap naturally like a real bouquet viewed from above
- Deterministic rendering using date-based seeded randomness (`dateToSeed()`)
- Two greenery systems:
  - **Procedural** (in `flowers.js`): tropical, eucalyptus, meadow, bush generators
  - **JSON-based** (in `greenery.js`): `GreeneryGenerator.generate()` with layer depth management

## Submissions

Users can submit their own Wordle screenshots via email:
- **Email**: hackpravj@gmail.com
- Simple mailto link on home page: "Share your Wordle"

## Implemented Features

- **Font system**: Fraunces (titles/taglines), DM Serif Display (body), Sorts Mill Goudy (poems)
- **Landing page**: Hanging wooden signpost CTA, scattered flowers with clear center band, side flower lines on mobile
- **Garden page**: Month section headers (sticky), wild meadow grass footer with brown leaves
- **Poem page**: Plant marker back nav ("← way to garden"), per-letter Wordle color tiles on guess words
- **Nature particles**: Falling petals, leaves (with veins/gradients), pollen, dandelion wisps on garden page
- **Wanderer**: Bee/butterfly perches on key elements for 3s, then follows cursor or drifts to center
- **Flower loader**: Spinning 6-petal flower overlay with random garden activity text, shown on all page loads
- **Procedural grass**: Wild meadow with brown leaf accents at page bottoms (garden + poem)

## Future Ideas

### Design & Experience
- **Design details page**: A dedicated page explaining the peak detailing — every design choice, color meaning, flower logic, poem structure. A love letter to the craft.
- **Day/night design**: Background, flower colors, and overall tint shift based on time of day. Morning = warm golden, evening = cool blue. The garden feels alive and time-aware.
- **Sound on poem page**: Ambient sound toggle on the poem page too, not just landing. Different ambient per poem or season.
- **Sound loading bar**: First click on "enable sound" should show a small loading bar (flower loader) while audio assets load, then transition smoothly into playback.
- **Grow-on-scroll**: Flowers scale up from 0 as they enter viewport on garden page, like sprouting.
- **Garden path between months**: Replace flat month dividers with a winding dotted/stone path SVG.
- **Organic scatter layout**: Break the rigid grid, randomize flower positions slightly.
- **Parallax depth**: Background elements move slower than foreground on scroll.

### User Features
- **Make your own poem**: Let visitors paste their Wordle result and generate a poem on the spot (would need client-side or API-based generation).
- **Better submission flow**: Beyond mailto — a form, or a way to submit directly from the site with preview before sending.

### Art Styles (extensible)
- Haiku chains (one haiku per guess)
- Color palettes (gradient based on emotional journey)
- Micro-fiction (2-3 sentence stories using each guess word)
- Weather reports (absurdist metaphor: "Started foggy, ended sunny")
- Abstract generative SVG art

## File Structure

```
wordle-garden/
├── index.html               # Landing page (animated intro)
├── garden.html              # Garden grid page
├── poem.html                # Individual poem page
├── css/
│   └── style.css
├── js/
│   ├── garden.js            # Garden page: loads data, renders flower grid
│   ├── poem.js              # Poem page: grid, poem, swipe/keyboard nav
│   ├── flowers.js           # SVG flower generation (procedural greenery)
│   ├── greenery.js          # JSON-based greenery composition system
│   ├── wanderer.js          # Animated bee/butterfly cursor follower
│   ├── particles.js         # Nature particles (petals, leaves, dandelion, pollen)
│   ├── grass.js             # Wild meadow grass generator
│   └── loader.js            # Spinning flower loader overlay
├── data/
│   └── wordles.json
├── assets/                  # Image assets (bush PNGs, design refs)
├── scripts/
│   ├── generate-poem.md     # Manual poem generation instructions
│   ├── generate.py          # Automated poem gen via Claude API
│   ├── screenshots/         # Wordle screenshots to process
│   └── games/               # Generated game data per date
├── docs/
│   └── claude-project-instructions.md  # System prompt for Claude projects
├── .github/
│   └── workflows/
│       └── add-wordle.yml   # GitHub Action for mobile submissions
├── CLAUDE.md
└── style-sampler.html       # Visual style reference (dev only)
```

## Development

```bash
# Local development
npx serve .

# Deploy
git push origin main  # Vercel auto-deploys from main
```
