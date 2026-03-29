// Wordle Garden - Poem Page Logic

document.addEventListener('DOMContentLoaded', async () => {
  // Get date from URL
  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get('date');

  if (!date) {
    window.location.href = 'garden.html';
    return;
  }

  try {
    // Fetch wordle data
    const response = await fetch('./data/wordles.json');
    const wordles = await response.json();

    // Sort by date (newest first)
    wordles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Find the specific wordle and its index
    const currentIndex = wordles.findIndex(w => w.date === date);
    const wordle = wordles[currentIndex];

    if (!wordle) {
      document.querySelector('.poem-page').innerHTML = `
        <a href="garden.html" class="back-link">&larr; Back to garden</a>
        <p>Wordle not found for this date.</p>
      `;
      return;
    }

    // Set up swipe navigation
    const prevDate = currentIndex < wordles.length - 1 ? wordles[currentIndex + 1].date : null;
    const nextDate = currentIndex > 0 ? wordles[currentIndex - 1].date : null;
    setupSwipeNavigation(prevDate, nextDate);

    // Update page title and meta tags
    document.title = `${formatDate(wordle.date)} — Grit Garden`;
    const poemUrl = `https://grit.garden/poem.html?date=${wordle.date}`;
    const firstLine = wordle.poem.split('\n')[0];
    const metaDesc = firstLine.length > 120 ? firstLine.slice(0, 117) + '...' : firstLine;
    updateMeta('og:title', `${formatDate(wordle.date)} — Grit Garden`);
    updateMeta('og:description', metaDesc);
    updateMeta('og:url', poemUrl);
    updateMeta('twitter:title', `${formatDate(wordle.date)} — Grit Garden`);
    updateMeta('twitter:description', metaDesc);
    updateMeta('description', metaDesc);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = poemUrl;

    // Render date header
    const dateHeader = document.querySelector('.poem-date');
    if (dateHeader) {
      dateHeader.textContent = formatDate(wordle.date);
    }

    // Render wordle number
    const wordleNumber = document.querySelector('.wordle-number');
    if (wordleNumber) {
      wordleNumber.textContent = `Wordle #${wordle.wordle_number}`;
    }

    // Render flower
    const flowerContainer = document.querySelector('.poem-flower');
    if (flowerContainer) {
      const seed = FlowerGenerator.dateToSeed(wordle.date);
      flowerContainer.innerHTML = FlowerGenerator.generateDeterministicFlowerCluster(
        wordle.green_count,
        wordle.yellow_count,
        seed,
        120
      );
    }

    // Render Wordle grid
    const gridContainer = document.querySelector('.wordle-grid');
    if (gridContainer) {
      gridContainer.innerHTML = renderWordleGrid(wordle.guesses);
    }

    // Render poem
    const poemContainer = document.querySelector('.poem-text');
    if (poemContainer) {
      poemContainer.innerHTML = renderPoem(wordle.poem, wordle.guesses);
    }

    // Update share section
    const shareSection = document.querySelector('.share-section');
    if (shareSection) {
      shareSection.innerHTML = `
        <button class="share-btn" id="share-btn">share this poem</button>
      `;
      document.getElementById('share-btn').addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({ title: document.title, url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => {
            document.getElementById('share-btn').textContent = 'link copied';
            setTimeout(() => {
              document.getElementById('share-btn').textContent = 'share this poem';
            }, 2000);
          });
        }
      });
    }

    // Hide loader
    if (window.Loader) Loader.hide();

  } catch (error) {
    console.error('Error loading wordle data:', error);
    document.querySelector('.poem-page').innerHTML = `
      <a href="garden.html" class="back-link">&larr; Back to garden</a>
      <p>Error loading poem data.</p>
    `;
    if (window.Loader) Loader.hide();
  }
});

// Swipe navigation for mobile + keyboard for desktop
function setupSwipeNavigation(prevDate, nextDate) {
  let touchStartX = 0;
  let touchEndX = 0;
  const minSwipeDistance = 50;

  // Touch events for mobile
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) < minSwipeDistance) return;

    if (distance > 0 && prevDate) {
      // Swipe right → previous (older) date
      window.location.href = `poem.html?date=${prevDate}`;
    } else if (distance < 0 && nextDate) {
      // Swipe left → next (newer) date
      window.location.href = `poem.html?date=${nextDate}`;
    }
  }

  // Keyboard events for desktop
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && prevDate) {
      // Left arrow → previous (older) date
      window.location.href = `poem.html?date=${prevDate}`;
    } else if (e.key === 'ArrowRight' && nextDate) {
      // Right arrow → next (newer) date
      window.location.href = `poem.html?date=${nextDate}`;
    }
  });
}

// Update meta tag content
function updateMeta(nameOrProperty, content) {
  const el = document.querySelector(`meta[property="${nameOrProperty}"]`)
          || document.querySelector(`meta[name="${nameOrProperty}"]`);
  if (el) el.setAttribute('content', content);
}

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

// Render Wordle grid HTML
function renderWordleGrid(guesses) {
  return guesses.map(guess => {
    const cells = guess.word.split('').map((letter, i) => {
      const state = guess.result[i];
      return `<div class="wordle-cell ${state}">${letter}</div>`;
    }).join('');

    return `<div class="wordle-row">${cells}</div>`;
  }).join('');
}

// Render poem with stanza breaks and highlighted guess words
function renderPoem(poemText, guesses) {
  const stanzas = poemText.split('\n\n');

  return stanzas.map((stanza, i) => {
    let html = stanza.replace(/\n/g, '<br>');

    // Highlight the guess word for this stanza
    if (guesses && guesses[i]) {
      const guess = guesses[i];
      const word = guess.word.toLowerCase();

      // Build per-letter tile spans
      const tileHtml = guess.word.split('').map((letter, j) => {
        const cls = guess.result[j] === 'correct' ? 'tile-green'
                  : guess.result[j] === 'present' ? 'tile-yellow'
                  : 'tile-gray';
        return `<span class="${cls}">${letter.toLowerCase()}</span>`;
      }).join('');

      // Replace first case-insensitive match of the word in the stanza
      const regex = new RegExp(`\\b(${word})\\b`, 'i');
      html = html.replace(regex, `<span class="guess-word">${tileHtml}</span>`);
    }

    return `<div class="stanza">${html}</div>`;
  }).join('');
}
