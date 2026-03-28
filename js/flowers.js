// Wordle Garden - Botanical Flower SVG Generation

// Greenery style: 'none', 'tropical', 'eucalyptus', 'meadow', 'bush'
let currentGreeneryStyle = 'bush';

function setGreeneryStyle(style) {
  currentGreeneryStyle = style;
}

function getGreeneryStyle() {
  return currentGreeneryStyle;
}

const COLORS = {
  green: '#6aaa64',
  greenDark: '#3d6b3d',
  yellow: '#c9b458',
  yellowDark: '#8b7d3a',
  center: '#f5e6b3',
  centerAccent: '#c9a83a'
};

// Generate a single 6-petal flower wrapped in a group for animation
function createFlower(cx, cy, size, color, colorDark, index = 0) {
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

  // Wrap in group for animation, with transform-origin at flower center
  return `<g class="flower" style="transform-origin: ${cx}px ${cy}px;" data-index="${index}">${petals.join('')}${center}</g>`;
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

    flowers.push(createFlower(pos.x, pos.y, pos.size, color, colorDark, i));
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
function generateDeterministicFlowerCluster(greenCount, yellowCount, dateSeed, viewBoxSize = 120, isLatest = false) {
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

    flowers.push(createFlower(pos.x, pos.y, pos.size, color, colorDark, i));
  }

  // Add greenery behind flowers
  const greenery = generateGreenery(viewBoxSize, dateSeed, isLatest);

  return `
    <svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" class="flower-cluster">
      ${greenery}
      ${flowers.join('')}
    </svg>
  `;
}

// Convert date string to seed number
function dateToSeed(dateStr) {
  return dateStr.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
}

// Generate tropical greenery (ferns/palm fronds)
function generateTropicalGreenery(viewBoxSize, seed) {
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;
  const greenery = [];
  const leafColor = '#3d5c3d';
  const leafColorLight = '#5a7d5a';

  // Generate 5-7 fern fronds radiating outward
  const frondCount = 5 + Math.floor(seededRandom(seed) * 3);

  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * 360 + seededRandom(seed + i) * 30 - 15;
    const length = viewBoxSize * 0.45 + seededRandom(seed + i + 50) * viewBoxSize * 0.15;
    const rad = angle * Math.PI / 180;

    // Main stem
    const endX = cx + Math.cos(rad) * length;
    const endY = cy + Math.sin(rad) * length;
    const ctrlX = cx + Math.cos(rad) * length * 0.5 + (seededRandom(seed + i + 100) - 0.5) * 20;
    const ctrlY = cy + Math.sin(rad) * length * 0.5 + (seededRandom(seed + i + 101) - 0.5) * 20;

    // Leaflets along the frond
    const leaflets = [];
    const leafletCount = 6 + Math.floor(seededRandom(seed + i + 200) * 4);

    for (let j = 1; j <= leafletCount; j++) {
      const t = j / (leafletCount + 1);
      const px = cx + (ctrlX - cx) * t * 2 * (1 - t) + (endX - cx) * t * t + cx * (1 - t) * (1 - t) - cx;
      const py = cy + (ctrlY - cy) * t * 2 * (1 - t) + (endY - cy) * t * t + cy * (1 - t) * (1 - t) - cy;
      const baseX = cx + px;
      const baseY = cy + py;

      const perpAngle = rad + Math.PI / 2;
      const leafLen = (1 - t * 0.6) * 12;

      // Left leaflet
      leaflets.push(`<ellipse cx="${baseX + Math.cos(perpAngle) * leafLen / 2}" cy="${baseY + Math.sin(perpAngle) * leafLen / 2}" rx="${leafLen / 2}" ry="2.5" fill="${leafColorLight}" transform="rotate(${angle + 60} ${baseX} ${baseY})"/>`);
      // Right leaflet
      leaflets.push(`<ellipse cx="${baseX - Math.cos(perpAngle) * leafLen / 2}" cy="${baseY - Math.sin(perpAngle) * leafLen / 2}" rx="${leafLen / 2}" ry="2.5" fill="${leafColorLight}" transform="rotate(${angle - 60} ${baseX} ${baseY})"/>`);
    }

    greenery.push(`
      <g opacity="0.85">
        ${leaflets.join('')}
        <path d="M${cx},${cy} Q${ctrlX},${ctrlY} ${endX},${endY}" stroke="${leafColor}" stroke-width="1.5" fill="none"/>
      </g>
    `);
  }

  return greenery.join('');
}

// Generate eucalyptus greenery (elegant branching)
function generateEucalyptusGreenery(viewBoxSize, seed) {
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;
  const greenery = [];
  const stemColor = '#5d6b5e';
  const leafColor = '#4a6d5c';
  const leafColorAlt = '#6b8f7a';

  // Generate 3-4 eucalyptus branches
  const branchCount = 3 + Math.floor(seededRandom(seed) * 2);

  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * 360 + seededRandom(seed + i) * 40 - 20 + 45;
    const length = viewBoxSize * 0.5 + seededRandom(seed + i + 50) * viewBoxSize * 0.15;
    const rad = angle * Math.PI / 180;

    const endX = cx + Math.cos(rad) * length;
    const endY = cy + Math.sin(rad) * length;

    // Curved stem
    const ctrlX = cx + Math.cos(rad + 0.3) * length * 0.6;
    const ctrlY = cy + Math.sin(rad + 0.3) * length * 0.6;

    // Eucalyptus leaves (oval pairs along stem)
    const leaves = [];
    const leafCount = 5 + Math.floor(seededRandom(seed + i + 100) * 3);

    for (let j = 1; j <= leafCount; j++) {
      const t = j / (leafCount + 1);
      // Bezier point
      const px = (1-t)*(1-t)*cx + 2*(1-t)*t*ctrlX + t*t*endX;
      const py = (1-t)*(1-t)*cy + 2*(1-t)*t*ctrlY + t*t*endY;

      const leafSize = 5 + (1 - t) * 3;
      const perpAngle = rad + Math.PI / 2;
      const offset = leafSize * 0.8;
      const color = seededRandom(seed + i + j) > 0.5 ? leafColor : leafColorAlt;

      // Paired leaves
      leaves.push(`<ellipse cx="${px + Math.cos(perpAngle) * offset}" cy="${py + Math.sin(perpAngle) * offset}" rx="${leafSize}" ry="${leafSize * 0.6}" fill="${color}" transform="rotate(${angle + 30} ${px + Math.cos(perpAngle) * offset} ${py + Math.sin(perpAngle) * offset})"/>`);
      leaves.push(`<ellipse cx="${px - Math.cos(perpAngle) * offset}" cy="${py - Math.sin(perpAngle) * offset}" rx="${leafSize}" ry="${leafSize * 0.6}" fill="${color}" transform="rotate(${angle - 30} ${px - Math.cos(perpAngle) * offset} ${py - Math.sin(perpAngle) * offset})"/>`);
    }

    greenery.push(`
      <g opacity="0.8">
        ${leaves.join('')}
        <path d="M${cx},${cy} Q${ctrlX},${ctrlY} ${endX},${endY}" stroke="${stemColor}" stroke-width="1" fill="none"/>
      </g>
    `);
  }

  return greenery.join('');
}

// Generate meadow greenery (wild grass blades)
function generateMeadowGreenery(viewBoxSize, seed) {
  const cx = viewBoxSize / 2;
  const cy = viewBoxSize / 2;
  const greenery = [];

  const grassColors = ['#4a6d4a', '#3d5c3d', '#5a7d5a', '#6b8f6b'];

  // Generate 12-18 grass blades
  const bladeCount = 12 + Math.floor(seededRandom(seed) * 7);

  for (let i = 0; i < bladeCount; i++) {
    const angle = seededRandom(seed + i) * 360;
    const rad = angle * Math.PI / 180;
    const length = viewBoxSize * 0.35 + seededRandom(seed + i + 50) * viewBoxSize * 0.25;

    // Start point near center but with some spread
    const startOffset = seededRandom(seed + i + 100) * viewBoxSize * 0.15;
    const startX = cx + Math.cos(rad + Math.PI) * startOffset;
    const startY = cy + Math.sin(rad + Math.PI) * startOffset;

    const endX = cx + Math.cos(rad) * length;
    const endY = cy + Math.sin(rad) * length;

    // Curve for natural grass bend
    const curve = (seededRandom(seed + i + 150) - 0.5) * 30;
    const ctrlX = (startX + endX) / 2 + Math.cos(rad + Math.PI/2) * curve;
    const ctrlY = (startY + endY) / 2 + Math.sin(rad + Math.PI/2) * curve;

    const color = grassColors[Math.floor(seededRandom(seed + i + 200) * grassColors.length)];
    const width = 1.5 + seededRandom(seed + i + 250) * 2;

    greenery.push(`
      <path d="M${startX},${startY} Q${ctrlX},${ctrlY} ${endX},${endY}"
            stroke="${color}"
            stroke-width="${width}"
            stroke-linecap="round"
            fill="none"
            opacity="0.75"/>
    `);
  }

  return greenery.join('');
}

// Get greenery SVG based on current style
function generateGreenery(viewBoxSize, seed, isLatest = false) {
  switch (currentGreeneryStyle) {
    case 'tropical':
      return generateTropicalGreenery(viewBoxSize, seed);
    case 'eucalyptus':
      return generateEucalyptusGreenery(viewBoxSize, seed);
    case 'meadow':
      return generateMeadowGreenery(viewBoxSize, seed);
    case 'bush':
      // Use stacked top + bottom images with swaying top
      const topHeight = viewBoxSize * 0.8;
      const bottomHeight = viewBoxSize * 0.2;
      return `
        <image class="bush-top" href="assets/bush-3-top.png" x="0" y="0" width="${viewBoxSize}" height="${topHeight}" preserveAspectRatio="xMidYMid slice" opacity="0.75" style="transform-origin: ${viewBoxSize/2}px ${topHeight}px;"/>
        <image href="assets/bush-3-bottom.png" x="0" y="${topHeight}" width="${viewBoxSize}" height="${bottomHeight}" preserveAspectRatio="xMidYMid slice" opacity="0.75"/>
      `;
    case 'custom':
      // Use generated SVG greenery
      if (typeof GreeneryGenerator !== 'undefined') {
        return GreeneryGenerator.generate(DEFAULT_GREENERY_CONFIG, viewBoxSize, seed);
      }
      return '';
    default:
      return '';
  }
}

// Generate a single standalone flower
function generateSingleFlower(type, size, seed) {
  const color = type === 'green' ? COLORS.green : COLORS.yellow;
  const colorDark = type === 'green' ? COLORS.greenDark : COLORS.yellowDark;

  // Add slight rotation variation based on seed
  const rotation = seed ? (seededRandom(seed) - 0.5) * 30 : 0;

  const cx = size / 2;
  const cy = size / 2;
  const flowerSize = size * 0.35;

  const flower = createFlower(cx, cy, flowerSize, color, colorDark);

  return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="transform: rotate(${rotation}deg)">
      ${flower}
    </svg>
  `;
}

// Export for use in other modules
window.FlowerGenerator = {
  generateFlowerCluster,
  generateDeterministicFlowerCluster,
  generateSingleFlower,
  dateToSeed,
  setGreeneryStyle,
  getGreeneryStyle
};
