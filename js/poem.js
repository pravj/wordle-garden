// Wordle Garden - Poem Page Logic

document.addEventListener('DOMContentLoaded', async () => {
  // Get date from URL
  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get('date');

  if (!date) {
    window.location.href = 'index.html';
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
        <a href="index.html" class="back-link">&larr; Back to garden</a>
        <p>Wordle not found for this date.</p>
      `;
      return;
    }

    // Set up swipe navigation
    const prevDate = currentIndex < wordles.length - 1 ? wordles[currentIndex + 1].date : null;
    const nextDate = currentIndex > 0 ? wordles[currentIndex - 1].date : null;
    setupSwipeNavigation(prevDate, nextDate);

    // Update page title
    document.title = `${formatDate(wordle.date)} — Wordle Garden`;

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
        150
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
      poemContainer.innerHTML = renderPoem(wordle.poem);
    }

    // Update share section
    const shareSection = document.querySelector('.share-section');
    if (shareSection) {
      const shareUrl = window.location.href;
      shareSection.innerHTML = `
        <p>Share this poem: <a href="${shareUrl}">${shareUrl}</a></p>
      `;
    }

  } catch (error) {
    console.error('Error loading wordle data:', error);
    document.querySelector('.poem-page').innerHTML = `
      <a href="index.html" class="back-link">&larr; Back to garden</a>
      <p>Error loading poem data.</p>
    `;
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

// Render poem with stanza breaks
function renderPoem(poemText) {
  // Split by double newlines (stanza breaks)
  const stanzas = poemText.split('\n\n');

  return stanzas.map(stanza => {
    return `<div class="stanza">${stanza.replace(/\n/g, '<br>')}</div>`;
  }).join('');
}
