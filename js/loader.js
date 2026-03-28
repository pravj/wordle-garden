// Flower Loader — spinning 6-petal flower overlay
(function() {
  const messages = [
    'tending the garden...',
    'watering the seeds...',
    'pulling the weeds...',
    'turning the soil...',
    'waiting for bloom...',
    'gathering petals...',
    'planting new seeds...',
  ];

  const flowerSVG = `<svg class="flower-loader-pulse" width="48" height="48" viewBox="0 0 40 40">
    <g transform="translate(20,20)">
      <ellipse rx="7" ry="3.5" fill="#6aaa64" opacity="0.85" transform="rotate(0) translate(8,0)"/>
      <ellipse rx="7" ry="3.5" fill="#c9b458" opacity="0.85" transform="rotate(60) translate(8,0)"/>
      <ellipse rx="7" ry="3.5" fill="#6aaa64" opacity="0.85" transform="rotate(120) translate(8,0)"/>
      <ellipse rx="7" ry="3.5" fill="#c9b458" opacity="0.85" transform="rotate(180) translate(8,0)"/>
      <ellipse rx="7" ry="3.5" fill="#6aaa64" opacity="0.85" transform="rotate(240) translate(8,0)"/>
      <ellipse rx="7" ry="3.5" fill="#c9b458" opacity="0.85" transform="rotate(300) translate(8,0)"/>
      <circle r="4" fill="#f5e6b3"/>
      <circle r="2" fill="#c9a83a" opacity="0.6"/>
    </g>
  </svg>`;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'flower-loader';
  overlay.innerHTML = `
    ${flowerSVG}
    <span class="flower-loader-text">${messages[Math.floor(Math.random() * messages.length)]}</span>
  `;
  document.documentElement.appendChild(overlay);

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #flower-loader {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(248,246,241,0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      backdrop-filter: blur(2px);
      transition: opacity 0.4s ease;
    }

    #flower-loader.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .flower-loader-text {
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 200;
      font-style: italic;
      font-size: 0.9rem;
      color: #5d6b5e;
      letter-spacing: 0.05em;
    }

    @keyframes flower-spin-pulse {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.08); }
      100% { transform: rotate(360deg) scale(1); }
    }

    .flower-loader-pulse {
      animation: flower-spin-pulse 2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);

  window.Loader = {
    hide() {
      overlay.classList.add('hidden');
      setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
      }, 400);
    },
    show() {
      overlay.classList.remove('hidden');
      overlay.querySelector('.flower-loader-text').textContent =
        messages[Math.floor(Math.random() * messages.length)];
      if (!overlay.parentNode) document.body.appendChild(overlay);
    }
  };
})();
