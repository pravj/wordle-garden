# Grit Garden

A personal art project that transforms daily Wordle attempts into poetry. Each game becomes a flower in a growing garden.

**Live at [grit.garden](https://grit.garden)**

## Concept

The emotional arc of a Wordle game — confusion, partial clarity, near-miss, resolution — is mapped onto a poem. Each guess becomes a stanza, and the sentiment mirrors the progress: lost/searching for poor guesses, hopeful for partial hits, triumphant for the win.

The garden page shows flower clusters viewed from above. Each cluster represents one day's Wordle. The ratio of green to yellow flowers reflects how well the game went. Clicking a flower opens its poem.

## Tech Stack

- **Framework**: Vanilla HTML/CSS/JS (no build step, no dependencies)
- **Hosting**: Vercel via GitHub (auto-deploys from main)
- **Data**: Static JSON in `/data/wordles.json`
- **AI**: Claude Sonnet 4 (plays Wordle, generates poems, scans user screenshots)

## Site Structure

```
/                     → Landing page (editorial, Tailwind CSS)
/garden.html          → Garden grid (flower clusters by month)
/poem.html?date=X     → Individual poem page
```

### Landing Page (`/`)
- Editorial design using Tailwind CSS
- Botanical flower image with glass card overlay
- Wooden signpost CTA ("way to garden →")
- Sound toggle with animated bars (frown shape when muted)
- Footer: @hackpravj

### Garden Page (`/garden.html`)
- Flower clusters grouped by month with sticky headers
- Deterministic rendering per date (seeded randomness)
- Nature particles: falling petals, leaves, dandelion wisps, pollen
- Wandering bee/butterfly (perches on strikethrough "puzzles" for 3s, then follows cursor)
- Wild meadow grass footer with brown leaves
- Sound toggle (garden ambience + bee buzz)

### Poem Page (`/poem.html?date=YYYY-MM-DD`)
- Wordle grid with colored tiles
- Poem with guess words highlighted per-letter in Wordle colors
- Plant marker back nav ("← way to garden") — tilted kraft paper tag on a stick
- "Grow your own poem" — upload a Wordle screenshot, Claude generates your poem
- Swipe (mobile) and arrow key (desktop) navigation between entries
- Share button: native share sheet on mobile, copy link on desktop
- Sound toggle, grass footer, OG tags for social previews

## Visual Style

- 6-petal SVG flowers viewed from above, botanical illustration style
- Green petals: `#6aaa64` / Yellow petals: `#c9b458`
- Flower centers: `#f5e6b3` with `#c9a83a` accents
- Background: `#f8f6f1` / Text: `#2c3e2d` / Muted: `#5d6b5e`
- Borders: `#c5d4c0`

## Typography

- **Fraunces** — Titles (SemiBold 600 Italic), taglines (ExtraLight 200), signpost/nav (ExtraLight 200)
- **DM Serif Display** — Body text, headings, labels
- **Sorts Mill Goudy** — Poem text (italic)

## Daily Pipeline

A GitHub Action (`.github/workflows/daily-wordle.yml`) runs daily:
1. Fetches today's Wordle answer from NYT API
2. Claude plays the game (prompted as a casual human player, not an optimizer)
3. Claude writes a poem following the constraint system
4. Entry appended to `wordles.json`, sitemap regenerated, auto-committed

Manual backfill: `python scripts/daily-pipeline.py 2026-02-15`

## Grow Your Own Poem

On any poem page, visitors can upload a Wordle screenshot:
1. `js/grow-your-own.js` opens a bottom drawer
2. Screenshot is sent to Claude for grid scanning
3. Claude identifies guesses and generates a poem
4. Result displayed with flower and Wordle grid

## Sound Design

`js/sound.js` — dynamic, never monotonous:
- **Wind breathing**: Ambience volume swells between 4-12% every 2-4s like gusts
- **Bee visits** (garden/poem only, when wanderer is a bee): 3-7s buzzes at random volume, 4-12s silence between visits
- **Crossfade**: Two ambience tracks swap every 20-35s with 3s crossfade
- Persists across pages via localStorage, auto-resumes
- Landing page: ambience only (no bee)

## Data Format

```json
{
  "date": "2026-03-15",
  "wordle_number": 1234,
  "answer": "CRANE",
  "guesses": [
    { "word": "ALERT", "result": ["absent", "present", "absent", "absent", "absent"] },
    { "word": "CRANE", "result": ["correct", "correct", "correct", "correct", "correct"] }
  ],
  "poem": "An alert rang out...\n\nAt last the crane arrived...",
  "green_count": 13,
  "yellow_count": 4
}
```

Result values: `"correct"` (green), `"present"` (yellow), `"absent"` (gray)

## File Structure

```
wordle-garden/
├── index.html               # Landing page (Tailwind, editorial)
├── garden.html              # Garden grid page
├── poem.html                # Individual poem page
├── css/style.css            # Shared styles (garden, poem pages)
├── js/
│   ├── garden.js            # Garden: loads data, renders flower grid by month
│   ├── poem.js              # Poem: grid, poem, highlight, share, swipe nav
│   ├── flowers.js           # SVG flower generation + greenery
│   ├── greenery.js          # JSON-based greenery composition
│   ├── particles.js         # Nature particles (petals, leaves, dandelion, pollen)
│   ├── wanderer.js          # Bee/butterfly: perch → follow cursor → drift
│   ├── grass.js             # Wild meadow grass generator
│   ├── loader.js            # Spinning flower loader overlay
│   ├── sound.js             # Dynamic ambient audio manager
│   └── grow-your-own.js     # Screenshot upload → poem generation
├── data/wordles.json        # All Wordle entries
├── assets/
│   ├── audio/               # Garden ambience + bee buzz WAV files
│   ├── og-image.png         # OG preview image (1200x630)
│   └── bush-3-*.png         # Bush greenery images
├── scripts/
│   ├── daily-pipeline.py    # Daily auto-play + poem generation
│   ├── generate-sitemap.py  # Sitemap generator
│   └── wordle-words.txt     # Valid Wordle word list
├── .github/workflows/
│   ├── daily-wordle.yml     # Daily cron pipeline
│   └── add-wordle.yml       # Manual entry submission
├── sitemap.xml
├── robots.txt
└── README.md
```

## Implemented Features

- Editorial landing page with Tailwind CSS, botanical image, wooden signpost
- Garden grid grouped by month with sticky headers
- Per-letter Wordle color tiles on guess words in poems
- Nature particles: petals, leaves (with veins/gradients), dandelion wisps, pollen
- Wanderer bee/butterfly: perches 3s, follows cursor, drifts to center
- Dynamic sound: wind breathing, bee visits, track crossfading
- Flower spinner loader with garden activity text
- Wild meadow grass with brown leaves at page bottoms
- Plant marker back nav on poem page
- Grow your own poem (screenshot upload)
- Daily automated pipeline (Claude plays + writes)
- OG/Twitter meta tags with preview image
- Sitemap + robots.txt
- Share: native share sheet (mobile) / copy link (desktop)

## Future Ideas

- **Field Notes page**: Dedicated page explaining every design detail (plan exists, sampler built)
- **Day/night design**: Tint shifts based on time of day
- **Grow-on-scroll**: Flowers sprout as they enter viewport
- **Garden path between months**: Winding path SVG instead of flat dividers

## Development

```bash
npx serve .                              # Local dev
python scripts/daily-pipeline.py         # Run today's pipeline
python scripts/daily-pipeline.py 2026-02-15  # Backfill a date
git push origin main                     # Deploy (Vercel auto)
```
