// Garden Sound Manager — alive, dynamic, never monotonous
(function() {
  const STORAGE_KEY = 'gardenSoundEnabled';

  const ambienceFiles = ['assets/audio/garden-ambience.wav', 'assets/audio/garden-ambience-long.wav'];
  const beeFiles = ['assets/audio/bee-buzz.wav', 'assets/audio/bee-buzz-long.wav'];

  // Two ambience tracks for crossfading
  let ambienceA = null;
  let ambienceB = null;
  let activeAmbience = 'A'; // which is currently playing

  // Two bee tracks for variety
  let beeA = null;
  let beeB = null;

  let loaded = false;
  let enabled = localStorage.getItem(STORAGE_KEY) === 'true';
  let playing = false;
  let breathTimer = null;
  let beeTimer = null;
  let crossfadeTimer = null;

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rand(min, max) { return min + Math.random() * (max - min); }

  function isLandingPage() {
    return !!document.querySelector('.landing-content');
  }

  function loadAudio() {
    if (loaded) return Promise.resolve();

    if (window.Loader) Loader.show();

    ambienceA = new Audio(ambienceFiles[0]);
    ambienceA.loop = true;
    ambienceA.volume = 0;

    ambienceB = new Audio(ambienceFiles[1]);
    ambienceB.loop = true;
    ambienceB.volume = 0;

    beeA = new Audio(beeFiles[0]);
    beeA.loop = false;
    beeA.volume = 0;

    beeB = new Audio(beeFiles[1]);
    beeB.loop = false;
    beeB.volume = 0;

    return new Promise((resolve) => {
      let ready = 0;
      const total = 4;
      const check = () => {
        ready++;
        if (ready >= total) {
          loaded = true;
          if (window.Loader) Loader.hide();
          resolve();
        }
      };
      [ambienceA, ambienceB, beeA, beeB].forEach(a => {
        a.addEventListener('canplaythrough', check, { once: true });
        a.load();
      });

      setTimeout(() => {
        if (!loaded) { loaded = true; if (window.Loader) Loader.hide(); resolve(); }
      }, 5000);
    });
  }

  // Smooth volume transition
  function volumeTo(audio, target, duration) {
    const start = audio.volume;
    const diff = target - start;
    const steps = Math.max(1, Math.round(duration / 50));
    let step = 0;
    const interval = setInterval(() => {
      step++;
      audio.volume = Math.max(0, Math.min(1, start + diff * (step / steps)));
      if (step >= steps) clearInterval(interval);
    }, 50);
  }

  // ============ WIND BREATHING ============
  // Ambience volume gently swells and dips like wind gusts
  function startBreathing() {
    if (breathTimer) return;

    function breathe() {
      if (!playing) return;
      const active = activeAmbience === 'A' ? ambienceA : ambienceB;
      if (!active || active.paused) return;

      // Random target between 0.04 and 0.12 (base is 0.08)
      const target = rand(0.04, 0.12);
      // Random duration between 2s and 4s
      const duration = rand(2000, 4000);

      volumeTo(active, target, duration);

      // Schedule next breath
      breathTimer = setTimeout(breathe, duration + rand(500, 1500));
    }

    breathe();
  }

  function stopBreathing() {
    if (breathTimer) { clearTimeout(breathTimer); breathTimer = null; }
  }

  // ============ BEE VISITS ============
  // Bee buzzes in bursts: fly in (3-6s), fly away (4-12s silence), repeat
  // Volume varies per visit — sometimes close, sometimes distant
  function startBeeVisits() {
    if (beeTimer || isLandingPage()) return;
    if (window.wandererIsBee === false) return;

    function visit() {
      if (!playing) return;

      // Pick a random bee track, pause the other
      const bee = Math.random() > 0.5 ? beeA : beeB;
      const otherBee = bee === beeA ? beeB : beeA;
      if (!bee) return;
      if (otherBee) { otherBee.pause(); otherBee.volume = 0; }

      // Random volume: close (0.10-0.14) or distant (0.03-0.06)
      const isClose = Math.random() > 0.4;
      const vol = isClose ? rand(0.10, 0.14) : rand(0.03, 0.06);

      // Fade in
      bee.currentTime = 0;
      bee.volume = 0;
      bee.play().catch(() => {});
      volumeTo(bee, vol, rand(800, 1500));

      // Buzz duration: 3-7 seconds
      const buzzDuration = rand(3000, 7000);

      setTimeout(() => {
        if (!playing) return;
        // Fade out
        volumeTo(bee, 0, rand(600, 1200));
        setTimeout(() => { bee.pause(); }, 1300);

        // Silence gap: 4-12 seconds before next visit
        const gap = rand(4000, 12000);
        beeTimer = setTimeout(visit, gap);
      }, buzzDuration);
    }

    // First visit after a short delay
    beeTimer = setTimeout(visit, rand(1000, 3000));
  }

  function stopBeeVisits() {
    if (beeTimer) { clearTimeout(beeTimer); beeTimer = null; }
    if (beeA) { beeA.pause(); beeA.volume = 0; }
    if (beeB) { beeB.pause(); beeB.volume = 0; }
  }

  // ============ AMBIENCE CROSSFADE ============
  // Swap between the two ambience tracks every 20-35 seconds
  function startCrossfade() {
    if (crossfadeTimer) return;

    function crossfade() {
      if (!playing) return;

      const fadeOut = activeAmbience === 'A' ? ambienceA : ambienceB;
      const fadeIn = activeAmbience === 'A' ? ambienceB : ambienceA;

      // Start the new track quietly
      fadeIn.volume = 0;
      fadeIn.play().catch(() => {});

      // Cross over ~3 seconds
      volumeTo(fadeOut, 0, 3000);
      volumeTo(fadeIn, 0.08, 3000);

      setTimeout(() => { fadeOut.pause(); }, 3200);

      activeAmbience = activeAmbience === 'A' ? 'B' : 'A';

      // Schedule next crossfade
      crossfadeTimer = setTimeout(crossfade, rand(20000, 35000));
    }

    crossfadeTimer = setTimeout(crossfade, rand(20000, 35000));
  }

  function stopCrossfade() {
    if (crossfadeTimer) { clearTimeout(crossfadeTimer); crossfadeTimer = null; }
  }

  // ============ PLAY / STOP ============

  function play() {
    function startAll() {
      playing = true;
      const active = activeAmbience === 'A' ? ambienceA : ambienceB;
      active.volume = 0;
      active.play().catch(() => {});
      volumeTo(active, 0.08, 800);

      startBreathing();
      startBeeVisits();
      startCrossfade();
    }

    if (!loaded) {
      loadAudio().then(startAll);
    } else {
      startAll();
    }
  }

  function stop() {
    playing = false;
    stopBreathing();
    stopBeeVisits();
    stopCrossfade();
    [ambienceA, ambienceB].forEach(a => {
      if (a) { volumeTo(a, 0, 600); setTimeout(() => a.pause(), 700); }
    });
  }

  function toggle() {
    enabled = !enabled;
    localStorage.setItem(STORAGE_KEY, enabled);
    if (enabled) play();
    else stop();
    updateAllToggles();
    return enabled;
  }

  function updateAllToggles() {
    document.querySelectorAll('.sound-toggle').forEach(el => {
      if (enabled) {
        el.classList.remove('muted');
        const textEl = el.querySelector('.sound-text');
        if (textEl) textEl.textContent = 'the garden is breathing';
      } else {
        el.classList.add('muted');
        const textEl = el.querySelector('.sound-text');
        if (textEl) textEl.textContent = 'click to hear the garden breathe';
      }
    });
  }

  // Auto-resume if was enabled on previous page
  if (enabled) {
    loadAudio().then(() => {
      const active = activeAmbience === 'A' ? ambienceA : ambienceB;
      active.play().then(() => {
        active.volume = 0.08;
        playing = true;
        startBreathing();
        startBeeVisits();
        startCrossfade();
      }).catch(() => {
        const resume = () => {
          play();
          document.removeEventListener('click', resume);
          document.removeEventListener('touchstart', resume);
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('touchstart', resume, { once: true });
      });
    });
  }

  // Init: bind all sound toggles on page
  document.addEventListener('DOMContentLoaded', () => {
    updateAllToggles();
    document.querySelectorAll('.sound-toggle').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        toggle();
      });
    });
  });

  window.GardenSound = { toggle, isEnabled: () => enabled };
})();
