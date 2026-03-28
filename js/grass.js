// Wild Meadow Grass Generator
window.GrassGenerator = {
  generate(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const w = 800;
    const h = 80;

    function blade(x, y, height, lean, color, cls) {
      const tipX = x + lean;
      const tipY = y - height;
      const cpX = x + lean * 0.4;
      const cpY = y - height * 0.6;
      return `<path class="${cls}" d="M${x-1.5},${y} Q${cpX},${cpY} ${tipX},${tipY} Q${cpX+1},${cpY} ${x+1.5},${y}Z" fill="${color}"/>`;
    }

    // Small leaf shape for brown fallen leaves
    function leaf(x, y, size, rotation, color, cls) {
      return `<g transform="translate(${x},${y}) rotate(${rotation})" class="${cls}">
        <path d="M0,0 C${size*0.4},${-size*0.6} ${size*0.8},${-size*0.4} ${size},0 C${size*0.8},${size*0.3} ${size*0.3},${size*0.4} 0,0Z" fill="${color}" opacity="0.7"/>
        <path d="M0,0 L${size*0.9},0" stroke="${color}" stroke-width="0.3" opacity="0.4" fill="none"/>
      </g>`;
    }

    const greens = ['#5a9a54','#6aaa64','#7ab874','#8cc084'];
    const browns = ['#a0825a','#8b7044','#b89060','#947550','#7a6038'];
    const classes = ['sway','sway-r','sway-slow'];
    let svg = '';

    // Back layer — tall, sparse (mix green + occasional brown)
    svg += '<g opacity="0.4">';
    for (let x = 5; x < w; x += 18 + Math.random() * 15) {
      const h2 = 50 + Math.random() * 25;
      const lean = (Math.random() - 0.5) * 12;
      const isBrown = Math.random() < 0.15;
      const color = isBrown ? browns[Math.floor(Math.random() * browns.length)] : greens[Math.floor(Math.random() * 2)];
      const cls = classes[Math.floor(Math.random() * 3)];
      svg += blade(x, h, h2, lean, color, cls);
    }
    svg += '</g>';

    // Mid layer (some brown blades)
    svg += '<g opacity="0.6">';
    for (let x = 3; x < w; x += 12 + Math.random() * 10) {
      const h2 = 30 + Math.random() * 25;
      const lean = (Math.random() - 0.5) * 8;
      const isBrown = Math.random() < 0.1;
      const color = isBrown ? browns[Math.floor(Math.random() * browns.length)] : greens[1 + Math.floor(Math.random() * 2)];
      const cls = classes[Math.floor(Math.random() * 3)];
      svg += blade(x, h, h2, lean, color, cls);
    }
    svg += '</g>';

    // Front layer — short, dense
    svg += '<g opacity="0.8">';
    for (let x = 0; x < w; x += 8 + Math.random() * 8) {
      const h2 = 15 + Math.random() * 18;
      const lean = (Math.random() - 0.5) * 5;
      const isBrown = Math.random() < 0.08;
      const color = isBrown ? browns[Math.floor(Math.random() * browns.length)] : greens[2 + Math.floor(Math.random() * 2)];
      const cls = classes[Math.floor(Math.random() * 3)];
      svg += blade(x, h, h2, lean, color, cls);
    }
    svg += '</g>';

    // Scattered brown fallen leaves on the ground
    for (let x = 20; x < w; x += 60 + Math.random() * 120) {
      const ly = 65 + Math.random() * 12;
      const size = 5 + Math.random() * 5;
      const rotation = Math.random() * 360;
      const color = browns[Math.floor(Math.random() * browns.length)];
      const cls = classes[Math.floor(Math.random() * 3)];
      svg += leaf(x, ly, size, rotation, color, cls);
    }

    // Wildflower dots
    for (let x = 30; x < w; x += 80 + Math.random() * 100) {
      const cy = 20 + Math.random() * 15;
      const r = 1.5 + Math.random() * 1.5;
      const color = Math.random() > 0.5 ? '#c9b458' : '#e8a0bf';
      svg += `<circle cx="${x}" cy="${cy}" r="${r}" fill="${color}" opacity="${0.5 + Math.random() * 0.3}"/>`;
    }

    container.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${svg}</svg>`;
  }
};
