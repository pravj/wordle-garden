#!/usr/bin/env python3
"""
Grit Garden - Daily Wordle Pipeline

Fully automated: fetches today's Wordle answer, has Claude play the game,
generates a poem, and appends the entry to wordles.json.

Usage:
    python scripts/daily-pipeline.py              # today's puzzle
    python scripts/daily-pipeline.py 2026-03-15   # specific date
"""

import json
import os
import sys
import time
from datetime import date
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("Error: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("Error: requests package not installed. Run: pip install requests")
    sys.exit(1)


# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_FILE = PROJECT_DIR / "data" / "wordles.json"
WORDS_FILE = SCRIPT_DIR / "wordle-words.txt"

# Claude model
MODEL = "claude-sonnet-4-20250514"


# ---------------------------------------------------------------------------
# 1. Fetch today's answer
# ---------------------------------------------------------------------------

def fetch_answer(game_date: date) -> dict:
    """Fetch Wordle answer and metadata from NYT API."""
    url = f"https://www.nytimes.com/svc/wordle/v2/{game_date.isoformat()}.json"
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    solution = data.get("solution", "").upper().strip()
    if len(solution) != 5 or not solution.isalpha():
        raise ValueError(f"Invalid solution from NYT: {data}")

    return {
        "answer": solution,
        "wordle_number": data.get("days_since_launch", 0),
    }


# ---------------------------------------------------------------------------
# 2. Wordle game engine
# ---------------------------------------------------------------------------

def load_valid_words() -> set:
    """Load valid Wordle words for guess validation."""
    with open(WORDS_FILE) as f:
        return {line.strip().upper() for line in f if len(line.strip()) == 5}


def evaluate_guess(guess: str, answer: str) -> list:
    """
    Evaluate a guess against the answer. Returns list of 'correct', 'present', 'absent'.
    Handles duplicate letters per official Wordle rules (two-pass algorithm).
    """
    result = ["absent"] * 5
    answer_remaining = list(answer)

    # Pass 1: greens
    for i in range(5):
        if guess[i] == answer[i]:
            result[i] = "correct"
            answer_remaining[i] = None

    # Pass 2: yellows
    for i in range(5):
        if result[i] == "correct":
            continue
        if guess[i] in answer_remaining:
            result[i] = "present"
            answer_remaining[answer_remaining.index(guess[i])] = None

    return result


def format_feedback(word: str, result: list) -> str:
    """Format guess result as emoji feedback for Claude."""
    emoji = {"correct": "🟩", "present": "🟨", "absent": "⬜"}
    letters = "  ".join(word)
    squares = "  ".join(emoji[r] for r in result)
    return f"{letters}\n{squares}"


# ---------------------------------------------------------------------------
# 3. Claude plays Wordle
# ---------------------------------------------------------------------------

PLAYER_SYSTEM_PROMPT = """You are a casual Wordle player — not a solver or algorithm. You play like a regular person who enjoys the game over morning coffee.

Rules:
- Guess a valid 5-letter English word
- After each guess you'll see feedback:
  🟩 = correct letter, correct position
  🟨 = correct letter, wrong position
  ⬜ = letter not in the word
- You have 6 guesses total
- Duplicate letters are possible in the answer

How you play (like a human, not a computer):
- You have a few favorite starter words you rotate between
- After the first guess, you go with your gut — words that come to mind naturally, not the statistically optimal choice
- Sometimes you fixate on a pattern and try variations of it, even if it's not the most efficient path
- You build on what you know gradually — you don't make giant leaps across unrelated words
- You occasionally overlook a clue or forget a yellow letter — nobody's perfect
- You think in terms of common words you actually use, not obscure vocabulary
- If you're stuck, you try a word that feels right rather than one that eliminates the most letters

Reply with ONLY a 5-letter word in UPPERCASE. Nothing else."""


def play_wordle(answer: str, client: anthropic.Anthropic, valid_words: set) -> list:
    """Have Claude play Wordle. Returns list of guess dicts."""
    guesses = []
    messages = []

    for turn in range(1, 7):
        # Build prompt
        if turn == 1:
            user_msg = "Let's play Wordle! Make your first guess."
        else:
            prev = guesses[-1]
            feedback = format_feedback(prev["word"], prev["result"])
            remaining = 6 - turn + 1
            user_msg = f"{feedback}\n\nGuess {turn} of 6 ({remaining} remaining)."

        messages.append({"role": "user", "content": user_msg})

        # Get Claude's guess (with retries for invalid words)
        guess_word = None
        for attempt in range(4):
            response = client.messages.create(
                model=MODEL,
                max_tokens=20,
                system=PLAYER_SYSTEM_PROMPT,
                messages=messages,
            )
            raw = response.content[0].text.strip().upper()
            # Extract just the word (Claude might add punctuation)
            candidate = "".join(c for c in raw if c.isalpha())[:5]

            if len(candidate) == 5 and candidate in valid_words:
                guess_word = candidate
                break
            elif attempt < 3:
                # Ask again
                messages.append({"role": "assistant", "content": raw})
                messages.append({
                    "role": "user",
                    "content": f"'{candidate}' is not in the Wordle dictionary. Try a different word.",
                })

        if not guess_word:
            # Fallback: common safe words by turn
            fallbacks = ["SLATE", "ROUND", "HYPER", "GUILT", "WOVEN", answer]
            guess_word = fallbacks[turn - 1]
            print(f"  Turn {turn}: fell back to {guess_word}")

        # Evaluate
        result = evaluate_guess(guess_word, answer)
        guesses.append({"word": guess_word, "result": result})
        messages.append({"role": "assistant", "content": guess_word})

        won = all(r == "correct" for r in result)
        status = "🟩 SOLVED!" if won else f"({sum(1 for r in result if r == 'correct')}G {sum(1 for r in result if r == 'present')}Y)"
        print(f"  Turn {turn}: {guess_word} {status}")

        if won:
            break

    return guesses


# ---------------------------------------------------------------------------
# 4. Poem generation
# ---------------------------------------------------------------------------

STORY_SYSTEM_PROMPT = """You are a writer for Grit Garden, an art project that transforms Wordle games into deadpan observations about life.
You will be given a list of guess words in order, and whether the game was solved or not.
Persona: Read the guess words and infer the best-fit persona from this list:
* Housewife / stay-at-home parent
* New mother
* Husband
* Men
* Women
* Elder parents
* Parents
* Student during exams
* Unemployed / job hunting
* Freelancer waiting on invoice
* Doctor
* Teacher
* Lawyer
* Therapist
* Software engineer
* Newly married
* Just retired
* 20-something in first job
* Someone going through a breakup
* Gym bro
* Astrology person
* Startup founder
* Desi parent
* Stock market investor
If none fit, invent a persona the words naturally suggest. If still nothing, use everyman.
Style: Deadpan. Flat affect. No exclamation. No metaphor-explaining. State things as plain fact and move on. The humor and pathos live in what is not said.

Structure:
* One stanza per guess word, exactly 2 lines
* Each guess word must appear in its stanza, naturally woven in
* All words must appear in order, none dropped
* Tone follows the arc: flat and searching early, something tightening underneath as it goes
* EXACTLY {num_guesses} stanzas. No more, no less.

Closing line:
* If the game was solved: end with a single line of quiet grit or understated hope
* If the game was not solved: end with a single line of quiet despair or acceptance

Constraints:
* Each line should feel like a statement, not a sentence. Spare.
* Maximum 12 lines total
* No references to Wordle, grids, tiles, letters, puzzles, or guessing
* No line in the poem exceeds 9 words
* The closing line is the last line from the last word's stanza

You MUST respond in EXACTLY this format, nothing else:

TITLE: <title, max 5 words>
PERSONA: <1-2 words, singular>
PERSONA_PLURAL: <1-2 words, plural>

<the piece, stanzas separated by blank lines>"""


def get_recent_personas(wordles: list, days: int = 7) -> list:
    """Get unique personas from the last N entries to avoid repeats."""
    sorted_entries = sorted(wordles, key=lambda w: w["date"], reverse=True)
    recent = sorted_entries[:days]
    personas = []
    for entry in recent:
        p = entry.get("persona", "")
        if p and p.lower() not in [x.lower() for x in personas]:
            personas.append(p)
    return personas


def generate_story(guesses: list, answer: str, recent_personas: list, client: anthropic.Anthropic) -> tuple:
    """Generate a story from the completed game. Returns (title, persona, persona_plural, story)."""
    words = [g["word"] for g in guesses]
    word_list = ", ".join(words)
    solved = all(r == "correct" for r in guesses[-1]["result"])
    status = "The game was solved." if solved else "The game was not solved."
    num_guesses = len(guesses)

    avoid_note = ""
    if recent_personas:
        avoid_note = f"\n\nDo NOT use any of these personas (used in the last 7 days): {', '.join(recent_personas)}. Pick something different."

    prompt = f"""Guess words in order: {word_list}
{status}
Number of stanzas required: {num_guesses}{avoid_note}

Write the piece."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=500,
        system=STORY_SYSTEM_PROMPT.replace("{num_guesses}", str(num_guesses)),
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text.strip()

    # Parse structured output
    title = ""
    persona = ""
    persona_plural = ""
    story_lines = []

    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.upper().startswith("TITLE:"):
            title = stripped[6:].strip()
        elif stripped.upper().startswith("PERSONA_PLURAL:"):
            persona_plural = stripped[15:].strip()
        elif stripped.upper().startswith("PERSONA:"):
            persona = stripped[8:].strip()
        else:
            story_lines.append(line)

    story = "\n".join(story_lines).strip()
    return title, persona, persona_plural, story


# ---------------------------------------------------------------------------
# 5. Flower counts
# ---------------------------------------------------------------------------

def calculate_flower_counts(guesses: list) -> tuple:
    """Calculate green and yellow flower counts per the project rules."""
    last = guesses[-1]
    is_win = all(r == "correct" for r in last["result"])

    # Exclude final guess if won
    to_count = guesses[:-1] if is_win else guesses

    ever_green = set()
    ever_yellow = set()

    for g in to_count:
        for letter, result in zip(g["word"], g["result"]):
            if result == "correct":
                ever_green.add(letter)
            elif result == "present":
                ever_yellow.add(letter)

    return len(ever_green), len(ever_yellow)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Determine date
    if len(sys.argv) > 1:
        try:
            game_date = date.fromisoformat(sys.argv[1])
        except ValueError:
            print(f"Error: invalid date '{sys.argv[1]}'. Use YYYY-MM-DD format.")
            sys.exit(1)
    else:
        game_date = date.today()

    print(f"=== Grit Garden Daily Pipeline ===")
    print(f"Date: {game_date.isoformat()}")

    # Check for existing entry
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            wordles = json.load(f)
    else:
        wordles = []

    if any(w["date"] == game_date.isoformat() for w in wordles):
        print(f"Entry for {game_date.isoformat()} already exists. Skipping.")
        sys.exit(0)

    # Step 1: Fetch answer
    print("\n1. Fetching answer from NYT...")
    try:
        nyt = fetch_answer(game_date)
    except Exception as e:
        print(f"Error fetching answer: {e}")
        sys.exit(1)

    answer = nyt["answer"]
    wordle_number = nyt["wordle_number"]
    print(f"   Wordle #{wordle_number}: {answer}")

    # Step 2: Claude plays
    print(f"\n2. Claude plays Wordle...")
    client = anthropic.Anthropic()
    valid_words = load_valid_words()

    guesses = play_wordle(answer, client, valid_words)

    won = all(r == "correct" for r in guesses[-1]["result"])
    print(f"   {'Won' if won else 'Lost'} in {len(guesses)} guesses")

    # Step 3: Generate story
    print(f"\n3. Generating story...")
    recent_personas = get_recent_personas(wordles)
    if recent_personas:
        print(f"   Avoiding personas: {', '.join(recent_personas)}")
    title, persona, persona_plural, story = generate_story(guesses, answer, recent_personas, client)
    print(f"   Title: {title}")
    print(f"   Persona: {persona} / {persona_plural}")
    print(f"   {len([s for s in story.split(chr(10) + chr(10)) if s.strip()])} stanzas generated")

    # Step 4: Calculate flowers
    green_count, yellow_count = calculate_flower_counts(guesses)
    print(f"   Flowers: {green_count} green, {yellow_count} yellow")

    # Step 5: Build and save entry
    entry = {
        "date": game_date.isoformat(),
        "wordle_number": wordle_number,
        "answer": answer,
        "guesses": guesses,
        "title": title,
        "persona": persona,
        "persona_plural": persona_plural,
        "poem": story,
        "green_count": green_count,
        "yellow_count": yellow_count,
    }

    wordles.append(entry)
    wordles.sort(key=lambda w: w["date"])

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(wordles, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"\n4. Saved to {DATA_FILE}")
    print(f"\n{'=' * 50}")
    print(f"Story for {game_date.isoformat()}:")
    print(f"{'=' * 50}")
    print(story)
    print(f"{'=' * 50}")
    print("Done!")


if __name__ == "__main__":
    main()
