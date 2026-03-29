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

PLAYER_SYSTEM_PROMPT = """You are playing Wordle — the word guessing game.

Rules:
- Guess a valid 5-letter English word
- After each guess you'll see feedback:
  🟩 = correct letter, correct position
  🟨 = correct letter, wrong position
  ⬜ = letter not in the word
- You have 6 guesses total
- Duplicate letters are possible in the answer

How to play:
- Start with a common word with varied letters
- Use feedback to eliminate and narrow down
- Don't reuse letters confirmed absent
- Track which positions letters can or cannot occupy

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

POEM_SYSTEM_PROMPT = """You are a poet writing for Grit Garden, an art project that transforms Wordle games into poems.

Write a poem where:
- Number of stanzas equals the number of guesses
- Each stanza is exactly 2 lines (a couplet)
- Each stanza revolves around that guess word, woven naturally into the line
- The sentiment of each stanza mirrors the progress of that guess:
  lost/searching for poor guesses, hopeful for partial hits, triumphant for the win
- Do NOT reference counts, numbers, or quantities of letters found
- No references to Wordle, grids, tiles, letters, or puzzles
- The poem should read as a standalone piece about perseverance or discovery

Return ONLY the poem. No title, no explanation. Separate stanzas with blank lines."""


def generate_poem(guesses: list, answer: str, client: anthropic.Anthropic) -> str:
    """Generate a poem from the completed game."""
    # Describe the game for the poet
    lines = []
    for i, g in enumerate(guesses, 1):
        emoji = {"correct": "🟩", "present": "🟨", "absent": "⬜"}
        squares = " ".join(emoji[r] for r in g["result"])
        lines.append(f"Guess {i}: {g['word']} → {squares}")

    game_text = "\n".join(lines)

    prompt = f"""Here is a completed Wordle game. The answer was {answer}.

{game_text}

Write the poem ({len(guesses)} stanzas, 2 lines each)."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        system=POEM_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.content[0].text.strip()


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

    # Step 3: Generate poem
    print(f"\n3. Generating poem...")
    poem = generate_poem(guesses, answer, client)
    print(f"   {len(poem.split(chr(10) + chr(10)))} stanzas generated")

    # Step 4: Calculate flowers
    green_count, yellow_count = calculate_flower_counts(guesses)
    print(f"   Flowers: {green_count} green, {yellow_count} yellow")

    # Step 5: Build and save entry
    entry = {
        "date": game_date.isoformat(),
        "wordle_number": wordle_number,
        "answer": answer,
        "guesses": guesses,
        "poem": poem,
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
    print(f"Poem for {game_date.isoformat()}:")
    print(f"{'=' * 50}")
    print(poem)
    print(f"{'=' * 50}")
    print("Done!")


if __name__ == "__main__":
    main()
