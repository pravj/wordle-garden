// Wordle Garden - Wandering Bee/Butterfly

(function() {
  // Randomly choose bee or butterfly for this session
  const isBee = Math.random() > 0.5;

  // Japanese mon-style SVG icons
  const beeSvg = `
    <svg viewBox="0 0 32 32" width="36" height="36">
      <ellipse cx="16" cy="18" rx="5" ry="7" fill="#3d3428"/>
      <ellipse cx="16" cy="15" rx="4" ry="1.5" fill="#c9b458"/>
      <ellipse cx="16" cy="19" rx="4.5" ry="1.5" fill="#c9b458"/>
      <ellipse cx="10" cy="14" rx="4" ry="6" fill="#f5f0e6" opacity="0.7" transform="rotate(-20 10 14)"/>
      <ellipse cx="22" cy="14" rx="4" ry="6" fill="#f5f0e6" opacity="0.7" transform="rotate(20 22 14)"/>
      <circle cx="16" cy="9" r="3.5" fill="#3d3428"/>
      <path d="M14 6 Q12 3 10 4" stroke="#3d3428" stroke-width="1" fill="none"/>
      <path d="M18 6 Q20 3 22 4" stroke="#3d3428" stroke-width="1" fill="none"/>
    </svg>
  `;

  const butterflySvg = `
    <svg viewBox="0 0 32 32" width="36" height="36">
      <ellipse cx="9" cy="14" rx="7" ry="9" fill="#6aaa64" opacity="0.85" transform="rotate(-10 9 14)"/>
      <ellipse cx="23" cy="14" rx="7" ry="9" fill="#6aaa64" opacity="0.85" transform="rotate(10 23 14)"/>
      <circle cx="8" cy="12" r="2" fill="#3d6b3d" opacity="0.5"/>
      <circle cx="24" cy="12" r="2" fill="#3d6b3d" opacity="0.5"/>
      <ellipse cx="10" cy="22" rx="5" ry="6" fill="#c9b458" opacity="0.8" transform="rotate(-15 10 22)"/>
      <ellipse cx="22" cy="22" rx="5" ry="6" fill="#c9b458" opacity="0.8" transform="rotate(15 22 22)"/>
      <ellipse cx="16" cy="16" rx="2" ry="8" fill="#3d3428"/>
      <circle cx="16" cy="7" r="2" fill="#3d3428"/>
      <path d="M15 5 Q13 2 11 3" stroke="#3d3428" stroke-width="0.8" fill="none"/>
      <path d="M17 5 Q19 2 21 3" stroke="#3d3428" stroke-width="0.8" fill="none"/>
    </svg>
  `;

  // Create wanderer element
  const wanderer = document.createElement('div');
  wanderer.innerHTML = isBee ? beeSvg : butterflySvg;
  wanderer.style.cssText = `
    position: fixed;
    top: 100px;
    left: 100px;
    pointer-events: none;
    z-index: 9999;
    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.15));
    transition: opacity 0.5s ease;
  `;
  document.body.appendChild(wanderer);

  // Position tracking
  let targetX = 100;
  let targetY = 100;
  let currentX = 100;
  let currentY = 100;
  let wobbleOffset = 0;

  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  // Animation loop
  function animate() {
    // Lazy follow with easing (very slow/dreamy)
    currentX += (targetX - currentX) * 0.008;
    currentY += (targetY - currentY) * 0.008;

    // Add wobble for floating effect
    wobbleOffset += 0.04;
    const wobbleX = Math.sin(wobbleOffset) * 6;
    const wobbleY = Math.cos(wobbleOffset * 0.7) * 4;

    // Calculate rotation based on movement direction
    const dx = targetX - currentX;
    const rotation = Math.max(-15, Math.min(15, dx * 0.2));

    // Apply position using top/left
    wanderer.style.left = (currentX + wobbleX - 18) + 'px';
    wanderer.style.top = (currentY + wobbleY - 18) + 'px';
    wanderer.style.transform = `rotate(${rotation}deg)`;

    requestAnimationFrame(animate);
  }

  animate();
})();
