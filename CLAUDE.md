# Wordle Garden

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
- 6-petal flowers viewed from above
- Detailed petal structure with subtle stroke outlines
- Green petals: `#6aaa64` (correct letters)
- Yellow petals: `#c9b458` (misplaced letters)
- Flower centers: `#f5e6b3` with `#c9a83a` accents
- Background: warm off-white `#f8f6f1`
- Typography: serif for poems (Playfair Display or similar)

## Site Structure

```
/                     → Garden grid (home)
/poem/[date]          → Individual artwork page
```

### Home Page (`/`)
- Grid of flower clusters, responsive layout
- Each cluster = one Wordle game
- Flowers sized/colored based on green/yellow cell counts
- **Hover**: Show date (e.g., "March 15, 2026")
- **Click**: Navigate to `/poem/[date]`
- **Submit button**: Opens email link for contributions

### Artwork Page (`/poem/[date]`)
- Wordle grid recreation (the guesses as colored tiles)
- Poem displayed below
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

**Quick workflow:**
1. Save Wordle screenshot to `/scripts/screenshots/YYYY-MM-DD.png`
2. Ask Claude Code: "Generate a poem for scripts/screenshots/2026-03-15.png"
3. Append the JSON output to `/data/wordles.json`

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

## Submissions

Users can submit their own Wordle screenshots via email:
- **Email**: hackpravj@gmail.com
- Simple mailto link on home page: "Share your Wordle"

## Future Ideas

Art styles beyond poems (not implemented yet, but designed to be extensible):
- Haiku chains (one haiku per guess)
- Color palettes (gradient based on emotional journey)
- Micro-fiction (2-3 sentence stories using each guess word)
- Weather reports (absurdist metaphor: "Started foggy, ended sunny")
- Abstract generative SVG art

## File Structure

```
wordle-garden/
├── index.html
├── poem.html              # Template for /poem/[date]
├── css/
│   └── style.css
├── js/
│   ├── garden.js          # Home page flower grid
│   ├── poem.js            # Individual poem page
│   └── flowers.js         # SVG flower generation
├── data/
│   └── wordles.json
├── scripts/
│   ├── generate-poem.md   # Instructions for poem generation
│   └── screenshots/       # Wordle screenshots to process
├── CLAUDE.md
└── style-sampler.html     # Visual style reference (dev only)
```

## Development

```bash
# Local development
npx serve .

# Deploy
git push origin main  # Vercel auto-deploys from main
```
