// Grow Your Own Poem — lazy-loaded module
// Handles modal, upload, Wordle screenshot validation, and analysis via wordle-gardener API

(function () {
  var API_URL = 'https://wordle-gardener-9001wmg6c-pravjs-projects.vercel.app/api/analyze';

  // --- Modal creation ---
  function createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'gym-overlay';

    const modal = document.createElement('div');
    modal.className = 'gym-modal';
    modal.innerHTML = `
      <button class="gym-close" aria-label="Close">&times;</button>
      <div class="gym-content">
        <h2 class="gym-title">grow your poem</h2>
        <p class="gym-subtitle">upload your Wordle screenshot</p>
        <div class="gym-dropzone" id="gym-dropzone">
          <div class="gym-dropzone-inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>tap to choose or drop image here</span>
          </div>
          <input type="file" id="gym-file" accept="image/*" hidden>
        </div>
        <div class="gym-preview" id="gym-preview" hidden>
          <img id="gym-preview-img" alt="Screenshot preview">
        </div>
        <div class="gym-result" id="gym-result" hidden></div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close handlers
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
    modal.querySelector('.gym-close').addEventListener('click', () => closeModal(overlay));
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal(overlay);
        document.removeEventListener('keydown', escHandler);
      }
    });

    // Upload handlers
    const dropzone = modal.querySelector('#gym-dropzone');
    const fileInput = modal.querySelector('#gym-file');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('gym-dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('gym-dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('gym-dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFile(file, modal);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) {
        handleFile(fileInput.files[0], modal);
      }
    });

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('gym-visible'));
  }

  function closeModal(overlay) {
    overlay.classList.remove('gym-visible');
    setTimeout(() => overlay.remove(), 300);
  }

  // --- File handling ---
  function handleFile(file, modal) {
    const preview = modal.querySelector('#gym-preview');
    const previewImg = modal.querySelector('#gym-preview-img');
    const dropzone = modal.querySelector('#gym-dropzone');
    const result = modal.querySelector('#gym-result');

    // Show preview
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    preview.hidden = false;
    dropzone.hidden = true;
    result.hidden = true;

    // Show scanning state
    result.hidden = false;
    result.className = 'gym-result gym-scanning';
    result.innerHTML = '<span>scanning...</span>';

    // Validate after image loads
    previewImg.onload = () => {
      validateWordleScreenshot(previewImg).then((detection) => {
        if (detection.isWordle) {
          result.className = 'gym-result gym-scanning';
          result.innerHTML = '<span>wordle detected — reading your game...</span>';
          analyzeScreenshot(file, result, dropzone, preview, modal);
        } else {
          showRetry(result, dropzone, preview, modal, "that doesn't look like a Wordle screenshot");
        }
      });
    };
  }

  // --- Wordle screenshot validation ---
  function validateWordleScreenshot(img) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const totalPixels = pixels.length / 4;

      let greenCount = 0;
      let yellowCount = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        const [h, s, l] = rgbToHsl(r, g, b);

        // Wordle green zone (covers light mode, dark mode, high contrast)
        if (h >= 100 && h <= 145 && s >= 25 && s <= 70 && l >= 30 && l <= 65) {
          greenCount++;
        }
        // Wordle yellow zone
        else if (h >= 35 && h <= 60 && s >= 35 && s <= 75 && l >= 35 && l <= 70) {
          yellowCount++;
        }
      }

      const greenPct = greenCount / totalPixels;
      const yellowPct = yellowCount / totalPixels;
      const wordlePct = greenPct + yellowPct;

      // Every finished Wordle has at least 5 green cells (the winning row)
      // so greenPct should be measurable. Combined with yellow, we want
      // at least ~3% of pixels in Wordle colors for a typical screenshot.
      const isWordle = wordlePct > 0.03 && greenPct > 0.01;

      resolve({ isWordle, greenPct, yellowPct });
    });
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return [h * 360, s * 100, l * 100];
  }

  // --- API call ---
  function analyzeScreenshot(file, result, dropzone, preview, modal) {
    var formData = new FormData();
    formData.append('image', file);

    fetch(API_URL, { method: 'POST', body: formData })
      .then(function (res) {
        if (!res.ok) throw new Error('Server error (' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (data.error) {
          showRetry(result, dropzone, preview, modal, data.error);
          return;
        }
        result.className = 'gym-result gym-success';
        result.innerHTML = renderGameData(data);
      })
      .catch(function (err) {
        showRetry(result, dropzone, preview, modal, 'something went wrong — ' + err.message);
      });
  }

  function showRetry(result, dropzone, preview, modal, message) {
    result.className = 'gym-result gym-failure';
    result.innerHTML =
      '<span class="gym-result-icon">&times;</span>' +
      '<span>' + message + '</span>' +
      '<button class="gym-retry">try another</button>';
    result.querySelector('.gym-retry').addEventListener('click', function () {
      preview.hidden = true;
      dropzone.hidden = false;
      result.hidden = true;
      modal.querySelector('#gym-file').value = '';
    });
  }

  function renderGameData(data) {
    var gridHtml = data.guesses.map(function (g) {
      var cells = g.word.split('').map(function (letter, i) {
        var cls = g.result[i] === 'correct' ? 'correct'
                : g.result[i] === 'present' ? 'present'
                : 'absent';
        return '<div class="wordle-cell ' + cls + '">' + letter + '</div>';
      }).join('');
      return '<div class="wordle-row">' + cells + '</div>';
    }).join('');

    var poemHtml = '';
    if (data.poem) {
      var stanzas = data.poem.split('\n\n');
      poemHtml = '<div class="gym-poem">' +
        stanzas.map(function (s) {
          return '<div class="stanza">' + s.replace(/\n/g, '<br>') + '</div>';
        }).join('') +
      '</div>';
    }

    return (
      '<div class="gym-game-result">' +
        '<div class="gym-grid">' + gridHtml + '</div>' +
        poemHtml +
        '<div class="gym-meta">' +
          '<span class="gym-answer">' + data.answer + '</span>' +
          '<span class="gym-counts">' + data.green_count + ' green, ' + data.yellow_count + ' yellow</span>' +
        '</div>' +
      '</div>'
    );
  }

  // --- Public API ---
  window.GrowYourOwn = { open: createModal };
})();
