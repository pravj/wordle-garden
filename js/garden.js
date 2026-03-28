// Wordle Garden - Home Page Garden Grid

document.addEventListener('DOMContentLoaded', async () => {
  const gardenContainer = document.querySelector('.garden');

  if (!gardenContainer) return;

  let wordles = [];

  // Get season class for a YYYY-MM key
  function getSeason(monthKey) {
    const month = parseInt(monthKey.split('-')[1]);
    if (month >= 3 && month <= 5) return 'season-spring';
    if (month >= 6 && month <= 8) return 'season-summer';
    if (month >= 9 && month <= 11) return 'season-fall';
    return 'season-winter';
  }

  // Format YYYY-MM to display string
  function formatMonth(monthKey) {
    const [y, m] = monthKey.split('-');
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  // Group wordles by month
  function groupByMonth(entries) {
    const groups = {};
    entries.forEach(entry => {
      const key = entry.date.substring(0, 7);
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }

  // Render all flowers grouped by month
  function renderGarden() {
    gardenContainer.innerHTML = '';

    const groups = groupByMonth(wordles);
    const monthKeys = Object.keys(groups).sort().reverse();

    monthKeys.forEach(monthKey => {
      const section = document.createElement('div');
      section.className = `month-section ${getSeason(monthKey)}`;

      const header = document.createElement('div');
      header.className = 'month-header';
      header.textContent = formatMonth(monthKey);
      section.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'month-grid';

      groups[monthKey].forEach((wordle, index) => {
        const flowerContainer = document.createElement('div');
        flowerContainer.className = 'flower-container';

        // Generate deterministic flower cluster
        const seed = FlowerGenerator.dateToSeed(wordle.date);
        const isLatest = monthKeys[0] === monthKey && index === 0;
        const flowerSvg = FlowerGenerator.generateDeterministicFlowerCluster(
          wordle.green_count,
          wordle.yellow_count,
          seed,
          120,
          isLatest
        );

        // Format date for display
        const dateObj = new Date(wordle.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        flowerContainer.innerHTML = `
          ${flowerSvg}
          <span class="flower-date">${formattedDate}</span>
        `;

        // Click to navigate to poem page
        flowerContainer.addEventListener('click', () => {
          window.location.href = `poem.html?date=${wordle.date}`;
        });

        grid.appendChild(flowerContainer);
      });

      section.appendChild(grid);
      gardenContainer.appendChild(section);
    });
  }

  try {
    // Fetch wordle data
    const response = await fetch('./data/wordles.json');
    wordles = await response.json();

    // Sort by date (newest first)
    wordles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Initial render
    renderGarden();

  } catch (error) {
    console.error('Error loading wordle data:', error);
    gardenContainer.innerHTML = '<p>Error loading garden data.</p>';
  }
});
