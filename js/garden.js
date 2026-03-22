// Wordle Garden - Home Page Garden Grid

document.addEventListener('DOMContentLoaded', async () => {
  const gardenContainer = document.querySelector('.garden');

  if (!gardenContainer) return;

  try {
    // Fetch wordle data
    const response = await fetch('./data/wordles.json');
    const wordles = await response.json();

    // Sort by date (newest first)
    wordles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render each wordle as a flower
    wordles.forEach(wordle => {
      const flowerContainer = document.createElement('div');
      flowerContainer.className = 'flower-container';

      // Generate deterministic flower cluster
      const seed = FlowerGenerator.dateToSeed(wordle.date);
      const flowerSvg = FlowerGenerator.generateDeterministicFlowerCluster(
        wordle.green_count,
        wordle.yellow_count,
        seed
      );

      // Format date for display
      const dateObj = new Date(wordle.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      flowerContainer.innerHTML = `
        ${flowerSvg}
        <span class="flower-date">${formattedDate}</span>
      `;

      // Click to navigate to poem page
      flowerContainer.addEventListener('click', () => {
        window.location.href = `poem.html?date=${wordle.date}`;
      });

      gardenContainer.appendChild(flowerContainer);
    });

  } catch (error) {
    console.error('Error loading wordle data:', error);
    gardenContainer.innerHTML = '<p>Error loading garden data.</p>';
  }
});
