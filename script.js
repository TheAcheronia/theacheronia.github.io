/**
 * TheAcheronia Portfolio & Arcy Music Interactive Core
 * Engineered with native browser standards, 60fps canvas, and zero bloat.
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initAmbientCanvas();
  initArcyMusicShowcase();
  initTerminalCLI();
  initProjectFilters();
  initNavigation();
  initCopyActions();
});

/* ==========================================================================
   1. THEME ENGINE
   ========================================================================== */
function initThemeEngine() {
  const themeBtn = document.getElementById('theme-btn');
  const themeMenu = document.getElementById('theme-menu');
  const themeLabel = document.querySelector('.theme-current-label');
  const themeOpts = document.querySelectorAll('.theme-opt');

  const savedTheme = localStorage.getItem('theacheronia-theme') || 'catppuccin';
  applyTheme(savedTheme);

  if (themeBtn && themeMenu) {
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      themeMenu.classList.remove('show');
    });

    themeOpts.forEach(opt => {
      opt.addEventListener('click', () => {
        const val = opt.getAttribute('data-theme-val');
        applyTheme(val);
        themeMenu.classList.remove('show');
      });
    });
  }

  function applyTheme(name) {
    document.body.setAttribute('data-theme', name);
    localStorage.setItem('theacheronia-theme', name);

    themeOpts.forEach(opt => {
      if (opt.getAttribute('data-theme-val') === name) {
        opt.classList.add('active');
        if (themeLabel) {
          const raw = opt.textContent.split(' ')[0];
          themeLabel.textContent = raw;
        }
      } else {
        opt.classList.remove('active');
      }
    });

    // Notify canvas to refresh colors
    if (window.onThemeUpdate) {
      window.onThemeUpdate();
    }
  }

  window.setWebsiteTheme = applyTheme;
}

/* ==========================================================================
   2. DYNAMIC AMBIENT CANVAS BACKGROUND
   ========================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Constellation particles
  const particleCount = Math.min(45, Math.floor(width / 30));
  const particles = [];

  function getParticleColor() {
    const style = getComputedStyle(document.body);
    return style.getPropertyValue('--accent-primary').trim() || '#cba6f7';
  }

  let baseColor = getParticleColor();
  window.onThemeUpdate = () => {
    baseColor = getParticleColor();
  };

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.4 + 0.15
    });
  }

  let mouseX = -1000;
  let mouseY = -1000;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  let isPaused = false;
  document.addEventListener('visibilitychange', () => {
    isPaused = document.hidden;
    if (!isPaused) requestAnimationFrame(render);
  });

  function render() {
    if (isPaused) return;

    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Mouse gentle repel
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        p.x += (dx / dist) * 0.8;
        p.y += (dy / dist) * 0.8;
      }

      ctx.fillStyle = baseColor;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Connect near particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist2 < 120) {
          ctx.strokeStyle = baseColor;
          ctx.globalAlpha = (1 - dist2 / 120) * 0.12;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/* ==========================================================================
   3. ARCY MUSIC SHOWCASE & AUDIO SYNTHESIZER
   ========================================================================== */
function initArcyMusicShowcase() {
  const canvas = document.getElementById('arcy-visualizer');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const playBtn = document.getElementById('play-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');
  const albumArt = document.getElementById('album-art');
  const visModeBtn = document.getElementById('vis-mode-btn');
  const muteBtn = document.getElementById('mute-btn');
  const volumeSlider = document.getElementById('volume-slider');

  // Track state
  let isPlaying = false;
  let isMuted = false;
  let trackDuration = 204; // 3:24 in seconds
  let currentSec = 0;
  let visMode = 'bars'; // 'bars' | 'wave'
  let eqGains = [0, 0, 0, 0, 0]; // 60Hz, 250Hz, 1kHz, 4kHz, 12kHz

  // Web Audio Context Synthesizer (Zero external audio file dependency!)
  let audioCtx = null;
  let masterGain = null;
  let synthInterval = null;

  function initWebAudio() {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  // Soft chord progression synth generator (Lofi ambient chord cycle)
  const chordNotes = [
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [130.81, 164.81, 196.00, 246.94], // Cmaj7
    [196.00, 246.94, 293.66, 349.23]  // G7
  ];
  let chordIdx = 0;

  function playSynthChord() {
    if (!audioCtx || !isPlaying || isMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const chord = chordNotes[chordIdx % chordNotes.length];
    chordIdx++;

    chord.forEach(freq => {
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      // Lowpass cutoff modulated by EQ 1kHz slider
      const cutoff = Math.max(300, 1400 + eqGains[2] * 80 + eqGains[0] * 50);
      filter.frequency.setValueAtTime(cutoff, now);

      // Soft envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04 * (volumeSlider ? volumeSlider.value : 0.7), now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 3.0);
    });
  }

  // Play / Pause Toggle
  function togglePlayback() {
    isPlaying = !isPlaying;
    initWebAudio();

    if (isPlaying) {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      if (albumArt) albumArt.classList.add('playing');
      
      playSynthChord();
      if (!synthInterval) {
        synthInterval = setInterval(playSynthChord, 2600);
      }
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      if (albumArt) albumArt.classList.remove('playing');
      if (synthInterval) {
        clearInterval(synthInterval);
        synthInterval = null;
      }
    }
  }

  if (playBtn) {
    playBtn.addEventListener('click', togglePlayback);
  }

  // Visualizer Mode Toggle
  if (visModeBtn) {
    visModeBtn.addEventListener('click', () => {
      visMode = visMode === 'bars' ? 'wave' : 'bars';
      visModeBtn.textContent = `Mode: ${visMode === 'bars' ? 'Bars' : 'Wave'}`;
    });
  }

  // Mute Toggle
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(isMuted ? 0 : 0.3, audioCtx.currentTime);
      }
      muteBtn.style.opacity = isMuted ? '0.4' : '1';
    });
  }

  // Volume slider
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (masterGain && audioCtx && !isMuted) {
        masterGain.gain.setValueAtTime(val * 0.4, audioCtx.currentTime);
      }
    });
  }

  // Timeline Progress Scrubber
  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      currentSec = Math.floor(ratio * trackDuration);
      updateProgressDisplay();
      syncLyricsWithTime(currentSec);
    });
  }

  // Progress ticker loop
  setInterval(() => {
    if (isPlaying) {
      currentSec++;
      if (currentSec >= trackDuration) {
        currentSec = 0;
      }
      updateProgressDisplay();
      syncLyricsWithTime(currentSec);
    }
  }, 1000);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateProgressDisplay() {
    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentSec);
    if (totalTimeEl) totalTimeEl.textContent = formatTime(trackDuration);
    if (progressFill) {
      const percent = (currentSec / trackDuration) * 100;
      progressFill.style.width = `${percent}%`;
    }
  }

  // Synced Lyrics Handling
  const lyricLines = document.querySelectorAll('.lyric-line');
  const lyricsViewport = document.getElementById('lyrics-viewport');

  function syncLyricsWithTime(sec) {
    if (!lyricLines.length) return;
    
    let activeIdx = 0;
    lyricLines.forEach((line, idx) => {
      const timecode = parseInt(line.getAttribute('data-time'), 10) || 0;
      if (sec >= timecode) {
        activeIdx = idx;
      }
    });

    lyricLines.forEach((line, idx) => {
      line.classList.remove('past', 'current', 'next', 'future');
      if (idx < activeIdx) {
        line.classList.add('past');
      } else if (idx === activeIdx) {
        line.classList.add('current');
      } else if (idx === activeIdx + 1) {
        line.classList.add('next');
      } else {
        line.classList.add('future');
      }
    });
  }

  // DSP 5-Band Equalizer Sliders
  const eqBands = [0, 1, 2, 3, 4].map(i => document.getElementById(`eq-band-${i}`));
  const eqVals = [0, 1, 2, 3, 4].map(i => document.getElementById(`eq-val-${i}`));

  eqBands.forEach((slider, idx) => {
    if (!slider) return;
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      eqGains[idx] = val;
      if (eqVals[idx]) {
        eqVals[idx].textContent = `${val >= 0 ? '+' : ''}${val}dB`;
      }
      clearActivePreset();
    });
  });

  // Preset Buttons
  const presetButtons = document.querySelectorAll('.eq-preset');
  const presets = {
    audiophile: [0, 0, 0, 0, 0],
    bass: [6, 4, 1, -1, 1],
    vocal: [-2, 0, 4, 3, 1],
    vshape: [5, 2, -3, 2, 6]
  };

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-preset');
      if (presets[name]) {
        applyEqPreset(presets[name]);
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  function clearActivePreset() {
    presetButtons.forEach(b => b.classList.remove('active'));
  }

  function applyEqPreset(vals) {
    vals.forEach((v, i) => {
      eqGains[i] = v;
      if (eqBands[i]) eqBands[i].value = v;
      if (eqVals[i]) eqVals[i].textContent = `${v >= 0 ? '+' : ''}${v}dB`;
    });
  }

  // Visualizer Canvas Rendering Loop
  const numBars = 36;
  const barHeights = new Float32Array(numBars);
  for (let i = 0; i < numBars; i++) barHeights[i] = 10;

  function renderVisualizer() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.body);
    const colPrimary = style.getPropertyValue('--accent-primary').trim() || '#cba6f7';
    const colSecondary = style.getPropertyValue('--accent-secondary').trim() || '#89b4fa';
    const colCyan = style.getPropertyValue('--accent-cyan').trim() || '#89dceb';

    const energy = isPlaying ? 1.0 : 0.2;
    const t = performance.now() * 0.003;

    if (visMode === 'bars') {
      const barWidth = (w - (numBars - 1) * 3) / numBars;

      for (let i = 0; i < numBars; i++) {
        // Multi-frequency wave simulation with EQ modulation
        const bandIdx = Math.min(4, Math.floor((i / numBars) * 5));
        const eqBoost = (eqGains[bandIdx] + 12) / 24; // 0 to 1

        const target = (
          (Math.sin(t * 1.5 + i * 0.35) * 0.4 + 0.6) *
          (Math.cos(t * 0.8 + i * 0.2) * 0.3 + 0.7) *
          energy * (h * 0.8) * (0.5 + eqBoost * 0.7)
        ) + (isPlaying ? 12 : 4);

        barHeights[i] += (target - barHeights[i]) * 0.22;

        const x = i * (barWidth + 3);
        const barH = Math.max(3, Math.min(h - 6, barHeights[i]));
        const y = h - barH;

        // Gradient bar
        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, colPrimary);
        grad.addColorStop(0.5, colSecondary);
        grad.addColorStop(1, colCyan);

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barH);
        }
        ctx.fill();

        // Shimmer cap
        if (isPlaying && barH > 20) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.6;
          ctx.fillRect(x, y - 2, barWidth, 2);
          ctx.globalAlpha = 1.0;
        }
      }
    } else {
      // Oscilloscope wave mode
      ctx.lineWidth = 3;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, colPrimary);
      grad.addColorStop(0.5, colCyan);
      grad.addColorStop(1, colSecondary);
      ctx.strokeStyle = grad;

      ctx.beginPath();
      for (let x = 0; x < w; x += 4) {
        const normX = x / w;
        const wave = Math.sin(t * 4 + normX * 18) * Math.cos(t * 2 + normX * 8) * (energy * 35);
        const y = (h / 2) + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Subtle glow
      ctx.lineWidth = 8;
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    requestAnimationFrame(renderVisualizer);
  }

  requestAnimationFrame(renderVisualizer);

  // Global control hook for CLI
  window.arcyControl = {
    toggle: togglePlayback,
    play: () => { if (!isPlaying) togglePlayback(); },
    pause: () => { if (isPlaying) togglePlayback(); },
    getStatus: () => ({
      status: isPlaying ? 'Playing' : 'Paused',
      track: 'Acheronia — Nocturne in Rust',
      engine: '100% Rust / Slint OpenGL Native',
      memory: '< 24.2 MB RAM',
      cpu: isPlaying ? '0.2%' : '0.0%',
      eq: `[${eqGains.map(g => `${g >= 0 ? '+' : ''}${g}dB`).join(', ')}]`
    })
  };
}

/* ==========================================================================
   4. INTERACTIVE TERMINAL CLI (acheronia-sh)
   ========================================================================== */
function initTerminalCLI() {
  const input = document.getElementById('term-input');
  const output = document.getElementById('term-output');
  const clearBtn = document.getElementById('term-clear-btn');
  const chips = document.querySelectorAll('.chip-cmd');

  if (!input || !output) return;

  const history = [];
  let histIdx = -1;

  function printLine(html) {
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = html;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function execute(cmdStr) {
    const clean = cmdStr.trim();
    if (!clean) return;

    // Echo command
    printLine(`<span class="term-prompt-echo">acheronia@theacheronia:~$</span> <span class="cmd-echo">${escapeHtml(clean)}</span>`);

    history.push(clean);
    histIdx = history.length;

    const parts = clean.split(' ').filter(Boolean);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        printLine(`
<span class="text-cyan">Available commands in acheronia-sh:</span>
  <span class="term-hl">arcy</span> [status|play|pause|toggle|theme] &bull; Query or control Arcy Music player
  <span class="term-hl">niri-x11</span> [--bench|--info]        &bull; Inspect pure-Rust window manager
  <span class="term-hl">projects</span> [--all|--rust|--audio]    &bull; List featured projects &amp; architecture
  <span class="term-hl">skills</span>                             &bull; Display technical capabilities matrix
  <span class="term-hl">cat</span> [about.txt|philosophy.md]     &bull; Read developer notes &amp; bio
  <span class="term-hl">theme</span> [mocha|tokyo|nord|cyberpunk] &bull; Switch global website palette
  <span class="term-hl">clear</span>                             &bull; Clear terminal screen
  <span class="term-hl">contact</span>                           &bull; Show GitHub and author info
`);
        break;

      case 'arcy':
        handleArcyCommand(args);
        break;

      case 'niri-x11':
      case 'niri':
        printLine(`
<span class="text-green">🚀 niri-x11 Engine Diagnostics:</span>
  Architecture   : 100% Native Rust (via direct x11rb socket)
  Latency/Frame  : <span class="term-hl">&lt; 0.05 milliseconds</span> (&lt; 50µs event loop)
  Frame Delivery : <span class="term-hl">120 FPS</span> deterministic (zero GC pauses)
  Target Hardware: Isolated X11 / GT 710 Kepler driver 470.xx optimization
  Mechanics      : Infinite horizontal scrollable ribbon with cubic ease-out
`);
        break;

      case 'projects':
        printLine(`
<span class="text-cyan">📦 Featured Repositories by TheAcheronia:</span>
  1. <span class="term-hl">Arcy Music</span> [Rust/Audio]     : High-performance audiophile daemon &amp; Slint GUI
  2. <span class="term-hl">niri-x11</span> [Rust/X11]       : 120 FPS infinite horizontal scrollable WM
  3. <span class="term-hl">Theme Engine</span> [Lua/Cairo]   : Modular AwesomeWM live desktop morpher
  4. <span class="term-hl">Spicetify Veloce</span> [CSS]    : Zero-lag high-perf Spotify theme with containment
  5. <span class="term-hl">Destiny 2.0</span> [Python/AI]   : Modular voice+GUI assistant engine
`);
        break;

      case 'skills':
        printLine(`
<span class="text-yellow">🛠️ Technical Matrix:</span>
  • <span class="term-hl">Languages</span>: Rust (100% safe), C/C++, Lua, TypeScript, Python, Shell
  • <span class="term-hl">Systems</span>  : Linux Kernel Epoll, X11 (x11rb), Wayland, MPRIS2 D-Bus
  • <span class="term-hl">Audio DSP</span>: RBJ Biquad Equalizer, PipeWire/ALSA, Web Audio, LRCLIB
  • <span class="term-hl">UI/Design</span>: Slint Native GUI, Cairo/LGI, CSS Layer Containment, Catppuccin
`);
        break;

      case 'cat':
        if (args[0] === 'about.txt' || !args[0]) {
          printLine(`
<span class="text-magenta">About TheAcheronia:</span>
Systems developer, Linux ricing craftsman, and audiophile creator.
Obsessed with making software that executes in microseconds and respects
user hardware instead of wasting cycles on bloated runtimes.
`);
        } else if (args[0] === 'philosophy.md') {
          printLine(`
<span class="text-cyan">Engineering Principles:</span>
1. Native compiled binaries over Electron wrappers.
2. Sub-millisecond event loops with epoll blocking when idle.
3. Zero telemetry, local SQLite storage, strict privacy.
`);
        } else {
          printLine(`<span class="text-muted">cat: ${escapeHtml(args[0])}: No such file</span>`);
        }
        break;

      case 'theme':
        if (args[0] && window.setWebsiteTheme) {
          const val = args[0].toLowerCase();
          const valid = ['catppuccin', 'mocha', 'tokyo', 'nord', 'cyberpunk', 'oled'];
          const target = val === 'mocha' ? 'catppuccin' : val;
          if (valid.includes(target)) {
            window.setWebsiteTheme(target);
            printLine(`<span class="text-green">✓ Switched palette to: <strong>${target}</strong></span>`);
          } else {
            printLine(`<span class="text-yellow">Usage: theme [mocha | tokyo | nord | cyberpunk | oled]</span>`);
          }
        } else {
          printLine(`<span class="text-yellow">Usage: theme [mocha | tokyo | nord | cyberpunk | oled]</span>`);
        }
        break;

      case 'clear':
        output.innerHTML = '';
        break;

      case 'contact':
      case 'whoami':
        printLine(`
<span class="text-cyan">TheAcheronia</span> &bull; Systems Craftsman
GitHub   : <a href="https://github.com/TheAcheronia" target="_blank" class="term-hl">https://github.com/TheAcheronia</a>
Projects : <a href="https://github.com/TheAcheronia/arcy-music" target="_blank" class="term-hl">https://github.com/TheAcheronia/arcy-music</a>
Site Repo: <a href="https://github.com/TheAcheronia/page" target="_blank" class="term-hl">https://github.com/TheAcheronia/page</a>
`);
        break;

      case 'sudo':
        if (clean.includes('rm -rf')) {
          printLine(`<span class="text-magenta">🛡️ Access Denied: 100% Rust memory safety and Linux sandboxing prevented self-destruction.</span>`);
        } else {
          printLine(`<span class="text-muted">Nice try! Password prompt rejected.</span>`);
        }
        break;

      default:
        printLine(`<span class="text-muted">acheronia-sh: command not found: ${escapeHtml(cmd)}. Type <span class="term-hl">help</span> for assistance.</span>`);
        break;
    }
  }

  function handleArcyCommand(args) {
    const sub = (args[0] || 'status').toLowerCase();
    const ctrl = window.arcyControl;

    if (sub === 'status') {
      const s = ctrl ? ctrl.getStatus() : { status: 'Active', track: 'Nocturne in Rust', memory: '<25 MB' };
      printLine(`
<span class="text-green">♫ Arcy Music Daemon Status (PID 13338):</span>
  State       : <span class="term-hl">${s.status}</span>
  Active Track: <span class="text-cyan">${s.track}</span>
  Engine      : Rust 2024 / Slint OpenGL
  Memory Footprint: <span class="term-hl">${s.memory}</span> (vs 600MB+ Electron)
  Equalizer   : 5-Band RBJ Biquad ${s.eq || '[Flat]'}
  D-Bus MPRIS2: org.mpris.MediaPlayer2.ArcyMusic
`);
    } else if (sub === 'toggle') {
      if (ctrl) ctrl.toggle();
      printLine(`<span class="text-cyan">♫ Sent toggle signal to Arcy Music daemon.</span>`);
    } else if (sub === 'play') {
      if (ctrl) ctrl.play();
      printLine(`<span class="text-green">♫ Arcy Music: Playback resumed.</span>`);
    } else if (sub === 'pause') {
      if (ctrl) ctrl.pause();
      printLine(`<span class="text-yellow">♫ Arcy Music: Playback paused.</span>`);
    } else if (sub === 'theme') {
      const th = args[1] || 'mocha';
      if (window.setWebsiteTheme) window.setWebsiteTheme(th === 'mocha' ? 'catppuccin' : th);
      printLine(`<span class="text-green">♫ Arcy Music UI theme set to: ${th}</span>`);
    } else {
      printLine(`<span class="text-yellow">Usage: arcy [status | toggle | play | pause | theme &lt;name&gt;]</span>`);
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value;
      input.value = '';
      execute(val);
    } else if (e.key === 'ArrowUp') {
      if (history.length > 0) {
        if (histIdx > 0) histIdx--;
        input.value = history[histIdx] || '';
      }
    } else if (e.key === 'ArrowDown') {
      if (history.length > 0) {
        if (histIdx < history.length - 1) {
          histIdx++;
          input.value = history[histIdx];
        } else {
          histIdx = history.length;
          input.value = '';
        }
      }
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      output.innerHTML = '';
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      if (cmd) {
        input.value = cmd;
        execute(cmd);
        input.value = '';
      }
    });
  });

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

/* ==========================================================================
   5. PROJECT CATEGORY FILTERS
   ========================================================================== */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const categories = card.getAttribute('data-category') || '';
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   6. NAVIGATION & MOBILE MENU
   ========================================================================== */
function initNavigation() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('show');
      });
    });
  }

  // Active scrollspy
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(sec => {
      const sectionHeight = sec.offsetHeight;
      const sectionTop = sec.offsetTop - 100;
      const sectionId = sec.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  });
}

/* ==========================================================================
   7. COPY ACTIONS WITH VISUAL FEEDBACK
   ========================================================================== */
function initCopyActions() {
  const copyBtn = document.getElementById('copy-install-btn');
  const cmdEl = document.getElementById('install-cmd');

  if (copyBtn && cmdEl) {
    copyBtn.addEventListener('click', () => {
      const text = cmdEl.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        const textSpan = copyBtn.querySelector('.copy-text');
        const orig = textSpan ? textSpan.textContent : 'Copy';
        if (textSpan) textSpan.textContent = 'Copied!';
        copyBtn.style.background = 'var(--accent-tertiary)';
        copyBtn.style.color = '#11111b';

        setTimeout(() => {
          if (textSpan) textSpan.textContent = orig;
          copyBtn.style.background = '';
          copyBtn.style.color = '';
        }, 2000);
      });
    });
  }
}
