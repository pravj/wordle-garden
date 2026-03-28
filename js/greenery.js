// Greenery SVG Generator - renders botanical greenery from JSON

const GreeneryGenerator = {

  // Seeded random for consistency
  seededRandom: function(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  },

  // Generate SVG from greenery JSON
  generate: function(config, size = 120, seed = 1) {
    const elements = [];
    const sortedElements = [...config.composition.elements].sort((a, b) => a.layer_depth - b.layer_depth);

    sortedElements.forEach(element => {
      switch(element.type) {
        case 'brown_branches':
          elements.push(this.renderBranches(element, size, seed));
          break;
        case 'base_shrubbery':
          elements.push(this.renderShrubbery(element, size, seed));
          break;
        case 'eucalyptus_sprigs':
          elements.push(this.renderEucalyptus(element, size, seed));
          break;
        case 'dried_leaves':
          elements.push(this.renderDriedLeaves(element, size, seed));
          break;
        case 'floral_accents':
          elements.push(this.renderFloralAccents(element, size, seed));
          break;
      }
    });

    return `<g class="greenery">${elements.join('')}</g>`;
  },

  // Render brown branches
  renderBranches: function(element, size, seed) {
    const branches = [];

    element.branches.forEach((branch, i) => {
      const startX = (branch.start[0] / 100) * size;
      const startY = (branch.start[1] / 100) * size;
      const endX = (branch.end[0] / 100) * size;
      const endY = (branch.end[1] / 100) * size;

      // Control point for curve
      const midX = (startX + endX) / 2 + branch.curve;
      const midY = (startY + endY) / 2;

      branches.push(`
        <path
          d="M${startX},${startY} Q${midX},${midY} ${endX},${endY}"
          stroke="${element.color}"
          stroke-width="${element.thickness || 2}"
          fill="none"
          stroke-linecap="round"
          opacity="0.8"
        />
      `);
    });

    return branches.join('');
  },

  // Render base shrubbery (radiating leaves)
  renderShrubbery: function(element, size, seed) {
    const leaves = [];
    const cx = (element.center_point[0] / 100) * size;
    const cy = (element.center_point[1] / 100) * size;
    const count = element.leaf_count || 12;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360 + this.seededRandom(seed + i) * 30;
      const rad = angle * Math.PI / 180;

      const minSize = (element.size_range_pct[0] / 100) * size;
      const maxSize = (element.size_range_pct[1] / 100) * size;
      const leafLength = minSize + this.seededRandom(seed + i + 50) * (maxSize - minSize);
      const leafWidth = leafLength * 0.25;

      // Leaf tip position
      const tipX = cx + Math.cos(rad) * leafLength;
      const tipY = cy + Math.sin(rad) * leafLength;

      // Slight color variation
      const colorVariation = this.seededRandom(seed + i + 100) > 0.5 ? element.color : '#5a7d5a';

      leaves.push(`
        <ellipse
          cx="${cx + Math.cos(rad) * leafLength * 0.5}"
          cy="${cy + Math.sin(rad) * leafLength * 0.5}"
          rx="${leafWidth}"
          ry="${leafLength * 0.5}"
          fill="${colorVariation}"
          opacity="${element.opacity || 0.85}"
          transform="rotate(${angle} ${cx + Math.cos(rad) * leafLength * 0.5} ${cy + Math.sin(rad) * leafLength * 0.5})"
        />
      `);
    }

    return leaves.join('');
  },

  // Render eucalyptus sprigs
  renderEucalyptus: function(element, size, seed) {
    const sprigs = [];

    element.stems.forEach((stem, stemIdx) => {
      const originX = (stem.origin[0] / 100) * size;
      const originY = (stem.origin[1] / 100) * size;
      const length = (stem.length_pct / 100) * size;
      const rad = stem.angle * Math.PI / 180;

      const endX = originX + Math.cos(rad) * length;
      const endY = originY - Math.sin(rad) * length;

      // Curved stem
      const curveOffset = (this.seededRandom(seed + stemIdx) - 0.5) * 15;
      const ctrlX = (originX + endX) / 2 + curveOffset;
      const ctrlY = (originY + endY) / 2;

      // Stem line
      sprigs.push(`
        <path
          d="M${originX},${originY} Q${ctrlX},${ctrlY} ${endX},${endY}"
          stroke="${element.stem_color || '#8b7355'}"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          opacity="0.7"
        />
      `);

      // Leaves along stem
      const leafCount = 5 + Math.floor(this.seededRandom(seed + stemIdx + 100) * 3);
      const leafSize = element.leaf_size || 8;

      for (let i = 1; i <= leafCount; i++) {
        const t = i / (leafCount + 1);
        // Bezier point
        const px = (1-t)*(1-t)*originX + 2*(1-t)*t*ctrlX + t*t*endX;
        const py = (1-t)*(1-t)*originY + 2*(1-t)*t*ctrlY + t*t*endY;

        const perpAngle = rad + Math.PI / 2;
        const offset = leafSize * 0.6;
        const side = i % 2 === 0 ? 1 : -1;

        const leafX = px + Math.cos(perpAngle) * offset * side;
        const leafY = py + Math.sin(perpAngle) * offset * side;

        const actualSize = leafSize * (0.7 + this.seededRandom(seed + stemIdx + i) * 0.6);

        sprigs.push(`
          <ellipse
            cx="${leafX}"
            cy="${leafY}"
            rx="${actualSize * 0.8}"
            ry="${actualSize * 0.6}"
            fill="${element.color}"
            opacity="0.8"
            transform="rotate(${stem.angle + side * 20} ${leafX} ${leafY})"
          />
        `);
      }
    });

    return sprigs.join('');
  },

  // Render dried leaves
  renderDriedLeaves: function(element, size, seed) {
    const leaves = [];
    const count = element.count || 5;

    for (let i = 0; i < count; i++) {
      const x = (20 + this.seededRandom(seed + i) * 60) / 100 * size;
      const y = (30 + this.seededRandom(seed + i + 50) * 50) / 100 * size;
      const minSize = element.size_range ? element.size_range[0] : 4;
      const maxSize = element.size_range ? element.size_range[1] : 8;
      const leafSize = minSize + this.seededRandom(seed + i + 100) * (maxSize - minSize);
      const rotation = this.seededRandom(seed + i + 150) * 360;

      // Curled teardrop shape using path
      leaves.push(`
        <ellipse
          cx="${x}"
          cy="${y}"
          rx="${leafSize * 0.6}"
          ry="${leafSize}"
          fill="${element.color}"
          opacity="${element.opacity || 0.7}"
          transform="rotate(${rotation} ${x} ${y})"
        />
      `);
    }

    return leaves.join('');
  },

  // Render floral accents
  renderFloralAccents: function(element, size, seed) {
    const florals = [];

    element.positions.forEach((pos, i) => {
      const x = (pos.coord[0] / 100) * size;
      const y = (pos.coord[1] / 100) * size;
      const scale = pos.scale || 1;

      // Thin stem
      const stemLength = 15 * scale;
      const stemEndY = y - stemLength;

      florals.push(`
        <path
          d="M${x},${y} Q${x + 3},${y - stemLength/2} ${x},${stemEndY}"
          stroke="${element.color}"
          stroke-width="0.8"
          fill="none"
          opacity="0.8"
        />
      `);

      // Small buds at end
      const budSize = 2 * scale;
      florals.push(`
        <circle cx="${x - 2}" cy="${stemEndY - 2}" r="${budSize}" fill="${element.color}" opacity="0.9"/>
        <circle cx="${x + 2}" cy="${stemEndY - 3}" r="${budSize * 0.8}" fill="${element.color}" opacity="0.9"/>
        <circle cx="${x}" cy="${stemEndY - 5}" r="${budSize * 0.7}" fill="${element.color}" opacity="0.9"/>
      `);
    });

    return florals.join('');
  }
};

// Default greenery config
const DEFAULT_GREENERY_CONFIG = {
  "canvas": {
    "background_color": "transparent"
  },
  "color_palette": {
    "primary_green": "#4a6d4a",
    "secondary_green": "#3d5c3d",
    "light_green": "#6b8f6b",
    "brown_branch": "#8b7355",
    "brown_dried": "#a08060",
    "accent_pink": "#d8b4bc"
  },
  "composition": {
    "focal_point": [50, 50],
    "layering_strategy": "bottom-to-top",
    "elements": [
      {
        "type": "brown_branches",
        "branches": [
          {"start": [40, 70], "end": [30, 40], "curve": 10},
          {"start": [60, 70], "end": [75, 45], "curve": -8},
          {"start": [50, 65], "end": [50, 35], "curve": 5}
        ],
        "color": "#8b7355",
        "thickness": 2,
        "layer_depth": 0
      },
      {
        "type": "base_shrubbery",
        "center_point": [50, 55],
        "leaf_count": 12,
        "size_range_pct": [20, 35],
        "color": "#4a6d4a",
        "opacity": 0.85,
        "layer_depth": 1
      },
      {
        "type": "eucalyptus_sprigs",
        "stems": [
          {"angle": 120, "length_pct": 45, "origin": [45, 55]},
          {"angle": 80, "length_pct": 50, "origin": [55, 55]},
          {"angle": 200, "length_pct": 40, "origin": [48, 60]},
          {"angle": 340, "length_pct": 38, "origin": [52, 60]}
        ],
        "leaf_shape": "oval",
        "leaf_size": 8,
        "color": "#3d5c3d",
        "stem_color": "#8b7355",
        "layer_depth": 2
      },
      {
        "type": "dried_leaves",
        "count": 5,
        "color": "#a08060",
        "size_range": [4, 8],
        "opacity": 0.7,
        "layer_depth": 3
      },
      {
        "type": "floral_accents",
        "positions": [
          {"coord": [35, 45], "scale": 0.8},
          {"coord": [65, 42], "scale": 1.0}
        ],
        "color": "#d8b4bc",
        "layer_depth": 4
      }
    ]
  }
};

window.GreeneryGenerator = GreeneryGenerator;
window.DEFAULT_GREENERY_CONFIG = DEFAULT_GREENERY_CONFIG;
