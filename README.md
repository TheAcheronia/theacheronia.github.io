# ⟡ TheAcheronia — Systems, Rust & Audiophile Portfolio

> **Ultra-modern, high-performance personal portfolio website for [@TheAcheronia](https://github.com/TheAcheronia).**  
> Live Website: **[https://TheAcheronia.github.io/page/](https://TheAcheronia.github.io/)**.

---

## ⚡ Highlights & Features

1. **Flagship Arcy Music Showcase**:
   - Interactive live Web Audio synthesizer and procedural audio spectrum visualizer (Bars & Waveform modes).
   - Real-time 5-Band RBJ Biquad Equalizer sliders (60Hz, 250Hz, 1kHz, 4kHz, 12kHz) with instant audio presets.
   - Synchronized LRCLIB karaoke lyrics viewer with dynamic timecode tracking.
   - One-click copy installation terminal badge.
   - Deep dive into `arcy-daemon`, `arcy-gui` (Slint OpenGL), `arcy-cli`, and `arcy-web`.

2. **Interactive Linux Terminal CLI (`acheronia-sh`)**:
   - In-browser terminal supporting interactive commands:
     - `arcy [status|play|pause|toggle|theme]`
     - `niri-x11 [--bench|--info]`
     - `projects [--all]`
     - `skills`
     - `cat about.txt`
     - `theme [mocha|tokyo|nord|cyberpunk|oled]`
     - `contact`
   - Command history navigation (Up / Down arrows) and clickable quick-run chips.

3. **Featured Projects Bento Grid**:
   - **Arcy Music**: 100% Rust audiophile player & headless daemon (<25MB RAM).
   - **niri-x11**: Pure native Rust infinite scrollable window manager (120 FPS, sub-50µs event loop).
   - **Universal Desktop Theme Engine**: Modular pure-Lua theme switcher morphing AwesomeWM, Picom, Rofi, and Kitty with 0% CPU sleep.
   - **Veloce Spicetify Theme**: High-performance architectural dark Spotify theme with CSS containment.
   - **Destiny Prototype 2.0**: Cross-platform modular AI voice assistant scaffold.
   - **Vivid LED DJ Linux**: Real-time audio reactive lighting controller.
   - Interactive category filtering (`All`, `Rust & Systems`, `Audio & DSP`, `Linux & Desktop`, `AI & Automation`).

4. **Zero Bloat & Performance-First**:
   - 100% pure native web standards: semantic HTML5, modern CSS3 variables, and vanilla ES6+ JavaScript.
   - Zero heavyweight JavaScript frameworks, zero bundlers required, zero build steps.
   - 60 FPS ambient constellation canvas with automatic power saving when hidden.
   - Relative asset paths (`./style.css`, `./script.js`) ensuring seamless operation on both root domains (`username.github.io`) and project subpaths (`username.github.io/page/`).

---

## 🚀 How to Deploy to GitHub Pages

### Option 1: Automatic Setup via Git (Recommended)

1. Open your terminal in this `page` folder:
   ```bash
   cd page
   ```

2. Initialize Git (if not already done):
   ```bash
   git init
   git branch -M main
   git remote add origin https://github.com/TheAcheronia/page.git
   ```

3. Commit and push your code:
   ```bash
   git add .
   git commit -m "feat: initial release of modern portfolio & Arcy Music showcase"
   git push -u origin main
   ```

4. **Enable GitHub Pages in your Repository Settings**:
   - Go to [github.com/TheAcheronia/page/settings/pages](https://github.com/TheAcheronia/page/settings/pages).
   - Under **Build and deployment** &rarr; **Source**: select **`Deploy from a branch`**.
   - Under **Branch**: select **`main`** and folder **`/ (root)`**.
   - Click **Save**.
   - Within 1–2 minutes, your website will be live at:  
     👉 **`https://TheAcheronia.github.io/page/`**

---

### Option 2: Hosting at the Root Domain (`https://TheAcheronia.github.io/`)

If you want your website URL to be `https://TheAcheronia.github.io/` without the `/page/` suffix:
1. Create a repository named **`TheAcheronia.github.io`** on GitHub.
2. Push these files to that repository.
3. GitHub automatically publishes user repositories named `<username>.github.io` directly to `https://<username>.github.io/`!

*(Because this project uses relative paths `./style.css` and `./script.js`, it works automatically in both!)*

---

## 🛠️ Local Preview

To preview the website locally on your computer:

```bash
# Using Python 3:
python3 -m http.server 8080

# Then open in your browser:
# http://localhost:8080
```

---

## 📄 License

Released under the [MIT License](LICENSE).  
Crafted with precision by [TheAcheronia](https://github.com/TheAcheronia).
