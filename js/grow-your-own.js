// Grow Your Own Poem — drawer-based flow
// Upload, validate, analyze, compare — all inside a bottom drawer

(function () {
  var API_URL = 'https://wordle-gardener.vercel.app/api/analyze';
  var drawer, overlay, drawerContent, drawerStatus, pendingRequest;

  function open() {
    if (drawer) { showDrawer('half'); return; }
    createDrawer();
    // Small delay for DOM paint before animating
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { showDrawer('half'); });
    });
  }

  // --- Drawer creation ---
  function createDrawer() {
    overlay = document.createElement('div');
    overlay.className = 'gym-overlay';
    overlay.addEventListener('click', function () { hideDrawer(); });

    drawer = document.createElement('div');
    drawer.className = 'gym-drawer';
    drawer.innerHTML =
      '<div class="gym-handle"><div class="gym-handle-bar"></div></div>' +
      '<div class="gym-drawer-scroll">' +
        '<div class="gym-status" id="gym-status"></div>' +
        '<div class="gym-upload-area" id="gym-upload-area">' +
          '<div class="gym-dropzone" id="gym-dropzone">' +
            '<div class="gym-dropzone-inner">' +
              '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
                '<polyline points="17 8 12 3 7 8"/>' +
                '<line x1="12" y1="3" x2="12" y2="15"/>' +
              '</svg>' +
              '<span>upload your Wordle screenshot</span>' +
            '</div>' +
            '<input type="file" id="gym-file" accept="image/*" hidden>' +
          '</div>' +
        '</div>' +
        '<div class="gym-result-area" id="gym-result-area"></div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    drawerContent = drawer.querySelector('.gym-drawer-scroll');
    drawerStatus = drawer.querySelector('#gym-status');

    // Handle close
    drawer.querySelector('.gym-handle').addEventListener('click', function () { hideDrawer(); });

    // Swipe down to close
    var startY = 0;
    drawer.addEventListener('touchstart', function (e) {
      if (drawerContent.scrollTop <= 0) startY = e.touches[0].clientY;
    }, { passive: true });
    drawer.addEventListener('touchend', function (e) {
      if (e.changedTouches[0].clientY - startY > 80 && drawerContent.scrollTop <= 0) hideDrawer();
    }, { passive: true });

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('gym-drawer-half') ||
          drawer.classList.contains('gym-drawer-tall') ||
          drawer.classList.contains('gym-drawer-full')) {
        hideDrawer();
      }
    });

    // Upload handlers
    var dropzone = drawer.querySelector('#gym-dropzone');
    var fileInput = drawer.querySelector('#gym-file');

    dropzone.addEventListener('click', function () { fileInput.click(); });

    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropzone.classList.add('gym-dragover');
    });

    dropzone.addEventListener('dragleave', function () {
      dropzone.classList.remove('gym-dragover');
    });

    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('gym-dragover');
      var file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleFile(file);
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files[0]) handleFile(fileInput.files[0]);
    });
  }

  function showDrawer(size) {
    overlay.classList.add('gym-visible');
    drawer.classList.remove('gym-drawer-half', 'gym-drawer-tall', 'gym-drawer-full');
    drawer.classList.add('gym-drawer-' + size);
  }

  function hideDrawer() {
    overlay.classList.remove('gym-visible');
    drawer.classList.remove('gym-drawer-half', 'gym-drawer-tall', 'gym-drawer-full');
  }

  // --- File handling ---
  function handleFile(file) {
    var uploadArea = drawer.querySelector('#gym-upload-area');
    uploadArea.style.display = 'none';

    setStatus('scanning...');

    // Validate via canvas
    var img = new Image();
    img.onload = function () {
      validateWordleScreenshot(img).then(function (detection) {
        if (detection.isWordle) {
          setStatus('wordle detected — reading your game...');
          sendToAPI(file);
        } else {
          setStatus('');
          showError("that doesn't look like a Wordle screenshot");
        }
      });
    };
    img.src = URL.createObjectURL(file);
  }

  function setStatus(text) {
    drawerStatus.textContent = text;
    drawerStatus.style.display = text ? 'block' : 'none';
  }

  function showError(message) {
    var resultArea = drawer.querySelector('#gym-result-area');
    resultArea.innerHTML =
      '<div class="gym-error">' +
        '<span>' + message + '</span>' +
        '<button class="gym-retry">try another</button>' +
      '</div>';
    resultArea.querySelector('.gym-retry').addEventListener('click', function () {
      resetUpload();
    });
  }

  function resetUpload() {
    var uploadArea = drawer.querySelector('#gym-upload-area');
    uploadArea.style.display = '';
    drawer.querySelector('#gym-file').value = '';
    drawer.querySelector('#gym-result-area').innerHTML = '';
    setStatus('');
    showDrawer('half');
  }

  // --- API call ---
  function sendToAPI(file) {
    var formData = new FormData();
    formData.append('image', file);

    pendingRequest = fetch(API_URL, { method: 'POST', body: formData })
      .then(function (res) {
        if (!res.ok) throw new Error('Server error (' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        if (data.error) { setStatus(''); showError(data.error); return; }

        // Grid arrived — grow to tall
        setStatus('');
        showDrawer('full');
        renderResult(data);
      })
      .catch(function (err) {
        setStatus('');
        showError('something went wrong — ' + err.message);
      });
  }

  // --- Render result ---
  function renderResult(data) {
    var resultArea = drawer.querySelector('#gym-result-area');

    // Build "your" grid
    var yourGridHtml = data.guesses.map(function (g) {
      var cells = g.word.split('').map(function (letter, i) {
        var cls = g.result[i] === 'correct' ? 'correct'
                : g.result[i] === 'present' ? 'present' : 'absent';
        return '<div class="wordle-cell ' + cls + '">' + letter + '</div>';
      }).join('');
      return '<div class="wordle-row">' + cells + '</div>';
    }).join('');

    // Build "your" poem
    var yourPoemHtml = '';
    if (data.poem) {
      var stanzas = data.poem.split('\n\n');
      yourPoemHtml = stanzas.map(function (s, i) {
        var html = s.replace(/\n/g, '<br>');
        // Highlight guess words with tiles
        if (data.guesses && data.guesses[i]) {
          var guess = data.guesses[i];
          var word = guess.word.toLowerCase();
          var tileHtml = guess.word.split('').map(function (letter, j) {
            var cls = guess.result[j] === 'correct' ? 'tile-green'
                    : guess.result[j] === 'present' ? 'tile-yellow' : 'tile-gray';
            return '<span class="' + cls + '">' + letter.toLowerCase() + '</span>';
          }).join('');
          var regex = new RegExp('\\b(' + word + ')\\b', 'i');
          html = html.replace(regex, '<span class="guess-word">' + tileHtml + '</span>');
        }
        return '<div class="stanza">' + html + '</div>';
      }).join('');
    }

    resultArea.innerHTML =
      '<div class="gym-section">' +
        '<div class="gym-section-label">your poem</div>' +
        '<div class="wordle-grid">' + yourGridHtml + '</div>' +
        '<div class="poem-content"><div class="poem-text">' +
          yourPoemHtml +
        '</div></div>' +
        '<div class="gym-your-meta">' +
          data.answer + ' — ' + data.green_count + ' green, ' + data.yellow_count + ' yellow' +
        '</div>' +
      '</div>';

    // Scroll to top of result
    drawerContent.scrollTop = 0;
  }

  // --- Wordle screenshot validation ---
  function validateWordleScreenshot(img) {
    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var pixels = imageData.data;
      var totalPixels = pixels.length / 4;

      var greenCount = 0;
      var yellowCount = 0;

      for (var i = 0; i < pixels.length; i += 4) {
        var r = pixels[i];
        var g = pixels[i + 1];
        var b = pixels[i + 2];

        var hsl = rgbToHsl(r, g, b);
        var h = hsl[0], s = hsl[1], l = hsl[2];

        if (h >= 100 && h <= 145 && s >= 25 && s <= 70 && l >= 30 && l <= 65) {
          greenCount++;
        } else if (h >= 35 && h <= 60 && s >= 35 && s <= 75 && l >= 35 && l <= 70) {
          yellowCount++;
        }
      }

      var greenPct = greenCount / totalPixels;
      var yellowPct = yellowCount / totalPixels;
      var wordlePct = greenPct + yellowPct;

      resolve({ isWordle: wordlePct > 0.03 && greenPct > 0.01 });
    });
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s;
    var l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return [h * 360, s * 100, l * 100];
  }

  // --- Public API ---
  window.GrowYourOwn = { open: open };
})();
