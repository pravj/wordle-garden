// Nature Particles System — Garden Mix + Dandelion Wisps

(function() {
  // ============ PHYSICS ============
  function noise(t) {
    return Math.sin(t * 1.3) * 0.5 +
           Math.sin(t * 2.7 + 1.4) * 0.3 +
           Math.sin(t * 4.1 + 2.8) * 0.2;
  }

  class Particle {
    constructor(config) {
      this.x = config.x ?? Math.random() * window.innerWidth;
      this.y = config.y ?? -20 - Math.random() * 100;
      this.vx = config.vx ?? (Math.random() - 0.5) * 0.3;
      this.vy = config.vy ?? 0.2 + Math.random() * 0.3;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 2;
      this.size = config.size ?? 10 + Math.random() * 8;
      this.opacity = config.opacity ?? 0.6 + Math.random() * 0.3;
      this.gravity = config.gravity ?? 0.015;
      this.drag = config.drag ?? 0.98;
      this.turbulenceStrength = config.turbulenceStrength ?? 0.08;
      this.turbulenceOffset = Math.random() * 1000;
      this.age = 0;
      this.fadeIn = 60;
      this.wobbleAmp = config.wobbleAmp ?? 1;
    }

    update(dt) {
      this.age += dt;
      const t = this.age * 0.01 + this.turbulenceOffset;
      const windX = noise(t) * this.turbulenceStrength;
      const windY = noise(t + 500) * this.turbulenceStrength * 0.3;

      this.vy += this.gravity * dt;
      this.vx += windX * dt;
      this.vy += windY * dt;

      const wobble = Math.sin(this.age * 0.03 + this.turbulenceOffset) * this.wobbleAmp * 0.02;
      this.vx += wobble * dt;

      this.vx *= this.drag;
      this.vy *= this.drag;
      this.vy = Math.min(this.vy, 1.5);

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.rotationSpeed += (noise(t + 200) - 0.1) * 0.01 * dt;
      this.rotationSpeed *= 0.99;
      this.rotation += this.rotationSpeed * dt;

      let alpha = this.opacity;
      if (this.age < this.fadeIn) alpha *= this.age / this.fadeIn;
      const scrollH = document.documentElement.scrollHeight;
      const viewBottom = window.scrollY + window.innerHeight;

      return {
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        opacity: Math.max(0, alpha),
        alive: this.y < viewBottom + 50 && this.x > -50 && this.x < window.innerWidth + 50
      };
    }
  }

  // ============ SVG GENERATORS ============

  function createPetalSVG(size, c1, c2) {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;pointer-events:none;will-change:transform;';
    el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 20 20">
      <ellipse cx="10" cy="10" rx="8" ry="5" fill="${c1}" opacity="0.85" transform="rotate(-15 10 10)"/>
      <ellipse cx="11" cy="9" rx="5" ry="3" fill="${c2}" opacity="0.4" transform="rotate(-15 10 10)"/>
    </svg>`;
    return el;
  }

  let leafGradId = 0;
  function createLeafSVG(size, c) {
    const id = 'plg' + (leafGradId++);
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;pointer-events:none;will-change:transform;';
    const skew = (Math.random() - 0.5) * 1.5;
    const bulge = 0.8 + Math.random() * 0.4;

    el.innerHTML = `<svg width="${size}" height="${size * 1.6}" viewBox="0 0 20 32" overflow="visible">
      <defs>
        <linearGradient id="${id}" x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stop-color="${c.base}"/>
          <stop offset="60%" stop-color="${c.tip}"/>
          <stop offset="100%" stop-color="${c.tip}" stop-opacity="0.8"/>
        </linearGradient>
      </defs>
      <path d="M10,1 C${12+bulge+skew},4 ${14+bulge},9 ${13.5+bulge*0.5},15 Q${12+skew},22 10,30 Q${8-skew},22 ${6.5-bulge*0.5},15 C${6-bulge},9 ${8-bulge-skew},4 10,1Z" fill="url(#${id})" opacity="0.85"/>
      <path d="M10,2 Q${10+skew*0.3},16 10,29" stroke="${c.vein}" stroke-width="0.6" opacity="0.45" fill="none" stroke-linecap="round"/>
      <path d="M10,6 Q8.5,7 ${6.5-bulge*0.3},8.5" stroke="${c.vein}" stroke-width="0.35" opacity="0.3" fill="none" stroke-linecap="round"/>
      <path d="M10,10 Q8,11.5 ${6-bulge*0.2},13" stroke="${c.vein}" stroke-width="0.35" opacity="0.28" fill="none" stroke-linecap="round"/>
      <path d="M10,14 Q8.5,15.5 7,17.5" stroke="${c.vein}" stroke-width="0.3" opacity="0.25" fill="none" stroke-linecap="round"/>
      <path d="M10,18 Q9,19.5 7.5,21" stroke="${c.vein}" stroke-width="0.25" opacity="0.2" fill="none" stroke-linecap="round"/>
      <path d="M10,6 Q11.5,7 ${13.5+bulge*0.3},8.5" stroke="${c.vein}" stroke-width="0.35" opacity="0.3" fill="none" stroke-linecap="round"/>
      <path d="M10,10 Q12,11.5 ${14+bulge*0.2},13" stroke="${c.vein}" stroke-width="0.35" opacity="0.28" fill="none" stroke-linecap="round"/>
      <path d="M10,14 Q11.5,15.5 13,17.5" stroke="${c.vein}" stroke-width="0.3" opacity="0.25" fill="none" stroke-linecap="round"/>
      <path d="M10,18 Q11,19.5 12.5,21" stroke="${c.vein}" stroke-width="0.25" opacity="0.2" fill="none" stroke-linecap="round"/>
      <path d="M10,1 C${12+bulge+skew},4 ${14+bulge},9 ${13.5+bulge*0.5},15 Q${12+skew},22 10,30 Q${8-skew},22 ${6.5-bulge*0.5},15 C${6-bulge},9 ${8-bulge-skew},4 10,1Z" fill="none" stroke="${c.base}" stroke-width="0.3" opacity="0.25"/>
    </svg>`;
    return el;
  }

  function createPollenDot(size, color) {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;pointer-events:none;will-change:transform;width:${size}px;height:${size}px;border-radius:50%;background:${color};`;
    return el;
  }

  let wispGradId = 0;
  function createWispSVG(size) {
    const id = 'pwg' + (wispGradId++);
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;pointer-events:none;will-change:transform;';

    const cx = 14, cy = 12, seedY = 24;
    const baseRadius = 7;
    const totalFilaments = 60 + Math.floor(Math.random() * 15);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const filaments = [];

    for (let i = 0; i < totalFilaments; i++) {
      const t = i / (totalFilaments - 1);
      const phi = Math.acos(1 - 2 * t);
      const theta = goldenAngle * i;
      const sx = Math.sin(phi) * Math.cos(theta);
      const sy = -Math.cos(phi);
      const sz = Math.sin(phi) * Math.sin(theta);
      const perspective = 0.85 + sz * 0.15;
      const radius = baseRadius * (0.85 + Math.random() * 0.3);
      const projX = sx * radius * perspective;
      const projY = sy * radius * perspective;
      const depth01 = (sz + 1) / 2;
      const layer = depth01 < 0.33 ? 'back' : depth01 < 0.66 ? 'mid' : 'front';
      const opacity = 0.12 + depth01 * 0.45;
      const strokeW = 0.06 + depth01 * 0.14;
      const ex = cx + projX, ey = cy + projY;
      const curve = (Math.random() - 0.5) * 0.8;
      const mx = cx + projX * 0.55 + curve, my = cy + projY * 0.55;
      const barbs = [];
      const barbCount = depth01 > 0.3 ? 2 + Math.floor(Math.random() * 2) : 1;
      const outAngle = Math.atan2(projY, projX);
      for (let b = 0; b < barbCount; b++) {
        const ba = outAngle + (Math.random() - 0.5) * 1.5;
        const bl = 0.4 + Math.random() * 0.7;
        barbs.push({ bx: ex + Math.cos(ba) * bl, by: ey + Math.sin(ba) * bl });
      }
      filaments.push({ ex, ey, mx, my, opacity, strokeW, barbs, layer });
    }

    function renderF(f, color) {
      let s = `<path d="M${cx},${cy} Q${f.mx},${f.my} ${f.ex},${f.ey}" stroke="${color}" stroke-width="${f.strokeW}" opacity="${f.opacity}" fill="none" stroke-linecap="round"/>`;
      f.barbs.forEach(b => { s += `<line x1="${f.ex}" y1="${f.ey}" x2="${b.bx}" y2="${b.by}" stroke="${color}" stroke-width="0.08" opacity="${f.opacity*0.6}" stroke-linecap="round"/>`; });
      return s;
    }

    const backSVG = filaments.filter(f => f.layer === 'back').map(f => renderF(f, '#d0c8b0')).join('');
    const midSVG = filaments.filter(f => f.layer === 'mid').map(f => renderF(f, '#b0a888')).join('');
    const frontSVG = filaments.filter(f => f.layer === 'front').map(f => renderF(f, '#8a7e60')).join('');

    el.innerHTML = `<svg width="${size*1.3}" height="${size*1.5}" viewBox="0 0 28 30" overflow="visible">
      ${backSVG}${midSVG}${frontSVG}
      <circle cx="${cx}" cy="${cy}" r="1.8" fill="#d8d0b8" opacity="0.2"/>
      <circle cx="${cx}" cy="${cy}" r="0.7" fill="#a89870" opacity="0.5"/>
      <line x1="${cx}" y1="${cy+0.5}" x2="${cx}" y2="${seedY-1}" stroke="#7a6a48" stroke-width="0.3" opacity="0.5" stroke-linecap="round"/>
      <ellipse cx="${cx}" cy="${seedY}" rx="0.7" ry="1.8" fill="#5a4a28" opacity="0.7"/>
      <ellipse cx="${cx}" cy="${seedY-0.3}" rx="0.35" ry="1" fill="#6a5a38" opacity="0.3"/>
    </svg>`;
    return el;
  }

  // ============ SPAWN FUNCTIONS ============

  function spawnGardenMix() {
    const r = Math.random();
    if (r < 0.45) {
      const colors = [['#6aaa64','#8cc084'],['#7ab874','#a3d49a'],['#c9b458','#d4c87a'],['#b8d4a8','#d0e8c4'],['#9abf8a','#b8d4a8']];
      const [c1,c2] = colors[Math.floor(Math.random() * colors.length)];
      const size = 10 + Math.random() * 9;
      const particle = new Particle({ gravity: 0.009+Math.random()*0.005, drag: 0.984, turbulenceStrength: 0.09+Math.random()*0.04, wobbleAmp: 1.5, size, opacity: 0.45+Math.random()*0.3 });
      return { particle, element: createPetalSVG(size, c1, c2) };
    } else if (r < 0.75) {
      const size = 2 + Math.random() * 2.5;
      const colors = ['#c9b458','#d4c87a','#e8dca0','#b8a840'];
      const particle = new Particle({ gravity: 0.003+Math.random()*0.003, drag: 0.992, turbulenceStrength: 0.06, wobbleAmp: 0.5, size, opacity: 0.3+Math.random()*0.3 });
      return { particle, element: createPollenDot(size, colors[Math.floor(Math.random() * colors.length)]) };
    } else {
      const colorSets = [
        { base: '#3a7a34', tip: '#6aaa64', vein: '#2a5a24' },
        { base: '#4a8a3a', tip: '#7ab874', vein: '#3a6a2a' },
        { base: '#2a6a30', tip: '#5a9a54', vein: '#1a4a20' },
        { base: '#5a8a2a', tip: '#8ab44a', vein: '#4a6a1a' },
      ];
      const c = colorSets[Math.floor(Math.random() * colorSets.length)];
      const size = 12 + Math.random() * 10;
      const particle = new Particle({ gravity: 0.018+Math.random()*0.008, drag: 0.978, turbulenceStrength: 0.1, wobbleAmp: 2, size, opacity: 0.5+Math.random()*0.25 });
      particle.rotationSpeed = (Math.random() - 0.5) * 3;
      return { particle, element: createLeafSVG(size, c) };
    }
  }

  function spawnDandelion() {
    const size = 18 + Math.random() * 12;
    const particle = new Particle({
      x: Math.random() * window.innerWidth,
      y: window.scrollY - 20 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.1,
      vy: 0.05 + Math.random() * 0.08,
      gravity: 0.002 + Math.random() * 0.002,
      drag: 0.996,
      turbulenceStrength: 0.06 + Math.random() * 0.04,
      wobbleAmp: 1.2,
      size,
      opacity: 0.4 + Math.random() * 0.3,
    });
    particle.rotationSpeed = (Math.random() - 0.5) * 0.3;
    return { particle, element: createWispSVG(size) };
  }

  // ============ SCENE MANAGER ============

  class ParticleScene {
    constructor(canvas, spawnFn, spawnRate) {
      this.canvas = canvas;
      this.particles = [];
      this.elements = [];
      this.spawnFn = spawnFn;
      this.spawnRate = spawnRate;
      this.spawnAccum = 0;
      this.running = false;
      this.runId = 0;
      this.lastTime = 0;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.runId++;
      this.lastTime = performance.now();
      // Pre-seed
      for (let i = 0; i < 5; i++) {
        const { particle, element } = this.spawnFn();
        particle.y = window.scrollY + Math.random() * window.innerHeight * 0.7;
        this.particles.push(particle);
        this.elements.push(element);
        this.canvas.appendChild(element);
      }
      this.tick(this.runId);
    }

    stop() {
      this.running = false;
      this.particles = [];
      this.elements.forEach(el => el.remove());
      this.elements = [];
      this.spawnAccum = 0;
    }

    tick(runId) {
      if (!this.running || runId !== this.runId) return;
      const now = performance.now();
      const dt = Math.min((now - this.lastTime) / 16.67, 2);
      this.lastTime = now;

      // Spawn from top of viewport
      this.spawnAccum += this.spawnRate * dt / 60;
      while (this.spawnAccum >= 1) {
        this.spawnAccum -= 1;
        const { particle, element } = this.spawnFn();
        // Spawn relative to scroll position
        particle.y = window.scrollY - 20 - Math.random() * 40;
        particle.x = Math.random() * window.innerWidth;
        this.particles.push(particle);
        this.elements.push(element);
        this.canvas.appendChild(element);
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const state = this.particles[i].update(dt);
        if (!state.alive || state.opacity <= 0) {
          this.elements[i].remove();
          this.particles.splice(i, 1);
          this.elements.splice(i, 1);
          continue;
        }
        const el = this.elements[i];
        el.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg)`;
        el.style.opacity = state.opacity;
      }

      requestAnimationFrame(() => this.tick(runId));
    }
  }

  // ============ INIT ============

  // Create canvas
  const canvas = document.createElement('div');
  canvas.id = 'particle-canvas';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;overflow:hidden;';
  document.body.style.position = 'relative';
  document.body.appendChild(canvas);

  const gardenMixScene = new ParticleScene(canvas, spawnGardenMix, 0.5);
  const dandelionScene = new ParticleScene(canvas, spawnDandelion, 0.6);

  // Expose for toggles
  window.ParticleToggles = {
    gardenMix: gardenMixScene,
    dandelion: dandelionScene,
  };
})();
