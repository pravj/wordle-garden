// Wordle Garden - Botanical Flower SVG Generation

const COLORS = {
  green: '#6aaa64',
  greenDark: '#3d6b3d',
  yellow: '#c9b458',
  yellowDark: '#8b7d3a',
  center: '#f5e6b3',
  centerAccent: '#c9a83a'
};

// Generate a single 6-petal flower
function createFlower(cx, cy, size, color, colorDark) {
  const petals = [];
  const petalCount = 6;
  const petalLength = size * 0.8;
  const petalWidth = size * 0.35;

  for (let i = 0; i < petalCount; i++) {
    const angle = (i * 60) * (Math.PI / 180);
    const rotation = i * 60;

    petals.push(`
      <ellipse
        cx="${cx}"
        cy="${cy - petalLength / 2}"
        rx="${petalWidth}"
        ry="${petalLength}"
        fill="${color}"
        stroke="${colorDark}"
        stroke-width="0.5"
        transform="rotate(${rotation} ${cx} ${cy})"
      />
    `);
  }

  // Center of flower
  const centerSize = size * 0.35;
  const center = `
    <circle cx="${cx}" cy="${cy}" r="${centerSize}" fill="${COLORS.center}" stroke="${COLORS.centerAccent}" stroke-width="0.5"/>
    <circle cx="${cx - centerSize * 0.2}" cy="${cy - centerSize * 0.2}" r="${centerSize * 0.15}" fill="${COLORS.centerAccent}"/>
    <circle cx="${cx + centerSize * 0.25}" cy="${cy + centerSize * 0.15}" r="${centerSize * 0.12}" fill="${COLORS.centerAccent}"/>
    <circle cx="${cx + centerSize * 0.1}" cy="${cy - centerSize * 0.3}" r="${centerSize * 0.1}" fill="${COLORS.centerAccent}"/>
  `;

  return petals.join('') + center;
}

// Generate a flower cluster based on green/yellow counts
function generateFlowerCluster(greenCount, yellowCount, viewBoxSize = 120) {
  const flowers = [];
  const totalFlowers = Math.min(greenCount + yellowCount, 8);

  // Determine ratio of green to yellow flowers
  const total = greenCount + yellowCount;
  const greenRatio = total > 0 ? greenCount / total : 0.5;
  const greenFlowers = Math.round(totalFlowers * greenRatio);
  const yellowFlowers = totalFlowers - greenFlowers;

  // Predefined positions for natural-looking arrangement
  const positions = [
    { x: 60, y: 60, size: 14 },   // center (largest)
    { x: 40, y: 42, size: 11 },   // top-left
    { x: 80, y: 46, size: 10 },   // top-right
    { x: 42, y: 78, size: 9 },    // bottom-left
    { x: 78, y: 74, size: 10 },   // bottom-right
    { x: 60, y: 32, size: 8 },    // top
    { x: 32, y: 60, size: 8 },    // left
    { x: 86, y: 58, size: 7 },    // right
  ];

  // Create array of flower types (shuffled for variety)
  const flowerTypes = [];
  for (let i = 0; i < greenFlowers; i++) flowerTypes.push('green');
  for (let i = 0; i < yellowFlowers; i++) flowerTypes.push('yellow');

  // Shuffle to mix green and yellow
  for (let i = flowerTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flowerTypes[i], flowerTypes[j]] = [flowerTypes[j], flowerTypes[i]];
  }

  // Generate flowers
  for (let i = 0; i < Math.min(flowerTypes.length, positions.length); i++) {
    const pos = positions[i];
    const type = flowerTypes[i];
    const color = type === 'green' ? COLORS.green : COLORS.yellow;
    const colorDark = type === 'green' ? COLORS.greenDark : COLORS.yellowDark;

    flowers.push(createFlower(pos.x, pos.y, pos.size, color, colorDark));
  }

  return `
    <svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" class="flower-cluster">
      ${flowers.join('')}
    </svg>
  `;
}

// Seeded random for consistent flower generation per date
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate deterministic flower cluster (same result for same data)
function generateDeterministicFlowerCluster(greenCount, yellowCount, dateSeed, viewBoxSize = 120) {
  const flowers = [];
  const totalFlowers = Math.min(greenCount + yellowCount, 8);

  // Determine ratio
  const total = greenCount + yellowCount;
  const greenRatio = total > 0 ? greenCount / total : 0.5;
  const greenFlowers = Math.round(totalFlowers * greenRatio);
  const yellowFlowers = totalFlowers - greenFlowers;

  // Positions with slight variation based on seed
  const basePositions = [
    { x: 60, y: 60, size: 14 },
    { x: 40, y: 42, size: 11 },
    { x: 80, y: 46, size: 10 },
    { x: 42, y: 78, size: 9 },
    { x: 78, y: 74, size: 10 },
    { x: 60, y: 32, size: 8 },
    { x: 32, y: 60, size: 8 },
    { x: 86, y: 58, size: 7 },
  ];

  // Add slight position variation based on date
  const positions = basePositions.map((pos, i) => ({
    x: pos.x + (seededRandom(dateSeed + i) - 0.5) * 5,
    y: pos.y + (seededRandom(dateSeed + i + 100) - 0.5) * 5,
    size: pos.size + (seededRandom(dateSeed + i + 200) - 0.5) * 1.5
  }));

  // Create flower types array
  const flowerTypes = [];
  for (let i = 0; i < greenFlowers; i++) flowerTypes.push('green');
  for (let i = 0; i < yellowFlowers; i++) flowerTypes.push('yellow');

  // Deterministic shuffle based on seed
  for (let i = flowerTypes.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(dateSeed + i * 7) * (i + 1));
    [flowerTypes[i], flowerTypes[j]] = [flowerTypes[j], flowerTypes[i]];
  }

  // Generate flowers
  for (let i = 0; i < Math.min(flowerTypes.length, positions.length); i++) {
    const pos = positions[i];
    const type = flowerTypes[i];
    const color = type === 'green' ? COLORS.green : COLORS.yellow;
    const colorDark = type === 'green' ? COLORS.greenDark : COLORS.yellowDark;

    flowers.push(createFlower(pos.x, pos.y, pos.size, color, colorDark));
  }

  return `
    <svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" class="flower-cluster">
      ${flowers.join('')}
    </svg>
  `;
}

// Convert date string to seed number
function dateToSeed(dateStr) {
  return dateStr.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
}

// Export for use in other modules
window.FlowerGenerator = {
  generateFlowerCluster,
  generateDeterministicFlowerCluster,
  dateToSeed
};
