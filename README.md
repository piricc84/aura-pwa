# AURA 3.6.0 • Elfo nella Foresta

**A privacy-first PWA for mental wellness and self-care.**

![Version](https://img.shields.io/badge/version-3.6.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![PWA](https://img.shields.io/badge/PWA-Progressive-success)

---

## 🌿 What is AURA?

AURA is a beautiful, minimalist Progressive Web App that guides you through mindfulness, breathing exercises, and mood tracking—all while keeping your data **100% private and local**.

### Features

✨ **Generative Ambient Audio** – Forest, rain, river, and night soundscapes with soothing oscillators and low-pass filters

💨 **Guided Breathing Exercises** – 4·2·6 breathing pattern with gentle cues

📊 **Mood Tracking** – Log your daily mood, energy levels, gratitude, and notes

📔 **Private Journal** – Write freely; everything stays on your device

🔐 **Optional AES-GCM Encryption** – Protect sensitive data with a PIN (local only, no server)

🎨 **3 Themes** – Forest (default), Night, and Dawn color schemes

🐛 **No Tracking, No Ads** – All data remains local; no Firebase, no analytics

📱 **Installable on iOS & Android** – Works offline as a standalone app

---

## 🚀 Quick Start

### Development

```bash
# Clone and navigate
git clone https://github.com/yourusername/aura-pwa.git
cd aura-pwa

# Install dependencies (optional, for build tools only)
npm install

# Start dev server
npm run dev
# Open http://localhost:8000
```

### Production Build

```bash
npm run build
# Creates optimized dist/ folder ready for deployment
```

### Testing

```bash
npm run test
# Runs code quality and structure validation
```

---

## 📦 Project Structure

```
aura-pwa/
├── src/
│   ├── index.html          # Single-file app (CSS/JS inlined after build)
│   ├── manifest.webmanifest
│   ├── sw.js               # Service Worker
│   ├── css/
│   │   └── main.css        # Optimized stylesheet
│   ├── js/
│   │   └── app.js          # ~40KB optimized app logic
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── dist/                   # Production build (generated)
├── tests/
│   └── test.js             # Quality assurance
├── scripts/
│   └── build.js            # Build minification script
├── package.json
└── README.md
```

---

## 🔧 Installation on Devices

### iOS (Safari)

1. Open the app in Safari
2. Tap the **Share** icon
3. Tap **Add to Home Screen**
4. Tap **Add**

### Android (Chrome)

1. Open the app in Chrome
2. Tap the **menu** icon (three dots)
3. Tap **Install app** (or **Add to Home Screen**)
4. Tap **Install**

---

## 🔐 Privacy & Security

- **Zero Server Tracking** – No external APIs, no analytics, no Firebase
- **Local Storage** – All data is stored in your browser's `localStorage`
- **Optional Encryption** – Enable PIN protection to encrypt sensitive data with AES-GCM (PBKDF2 + 120k iterations)
- **Export Your Data** – Download your moods and journal as `.json` or `.txt` anytime

### How PIN Protection Works

When you set a PIN:
- Your name, theme, settings are **always in plaintext** for quick access
- Your mood entries, journal, and notes are **encrypted with AES-GCM**
- PIN is hashed with SHA-256 + salt, not stored
- Encryption key is derived from PIN using PBKDF2 (120k iterations)
- **If you forget your PIN, data is unrecoverable**

---

## 🎨 Customization

### Change Colors

Edit `src/css/main.css`:

```css
:root {
  --bg0: #070b10;
  --bg1: #0b1220;
  --accent: #6fe3a6;
  /* ... */
}
```

### Add Themes

In `src/js/app.js`, add to the `themes` object:

```javascript
const themes = {
  forest: { /* ... */ },
  custom: {
    '--bg0': '#yourcolor',
    '--accent': '#yourcolor',
    /* ... */
  }
};
```

### Modify Audio Ambience

The `buildAmbience()` function creates dynamic soundscapes using Web Audio API. Tweak frequencies, gain, and filter values to customize the sound.

---

## 🧪 Testing

The test suite validates:
- ✓ File existence and structure
- ✓ HTML5 compliance
- ✓ CSS and JavaScript syntax
- ✓ PWA manifest validity
- ✓ Service Worker implementation
- ✓ Performance metrics
- ✓ Accessibility (ARIA labels)

Run tests:
```bash
npm run test
```

---

## 📊 Performance

- **Single-file HTML** → Reduced HTTP requests
- **Minified CSS** → ~12KB
- **Optimized JavaScript** → ~35KB (gzipped: ~10KB)
- **Service Worker** → Offline-first caching strategy
- **No external dependencies** → Pure vanilla JS + Web APIs

**Lighthouse Score:** 95+ (PWA, Performance, Accessibility, Best Practices)

---

## 🌐 Deployment

### Option 1: GitHub Pages

```bash
# Build
npm run build

# Push dist/ to gh-pages branch
git subtree push --prefix dist origin gh-pages
```

### Option 2: Netlify

```bash
npm run build
# Drag dist/ folder to Netlify
```

### Option 3: Self-Hosted (Nginx/Apache)

```bash
npm run build
# Upload dist/ contents to your server
# Ensure HTTPS is enabled (required for PWA)
# Add headers for service worker caching
```

**Important:** PWA features require **HTTPS** (except localhost for development).

---

## 📝 API Reference

### State Model

```javascript
state = {
  v: 360,
  createdAt: "2025-01-01T00:00:00Z",
  name: "User",
  theme: "forest",
  soundEnabled: true,
  haptics: true,
  pinEnabled: false,
  lockEnabled: false,
  audio: { env: "forest", vol: 0.4, on: false },
  moods: [
    { date: "2025-01-01", mood: "calm", energy: 75, note: "", gratitude: "", t: 1234567890 }
  ],
  journal: [
    { date: "2025-01-01", text: "...", t: 1234567890 }
  ]
}
```

### Key Functions

- `saveState()` – Persist state to localStorage (encrypted if PIN enabled)
- `loadState()` – Retrieve state (auto-decrypts if needed)
- `audioStart()` / `audioStop()` – Control ambient sound
- `openModal({title, body, contentHTML, okText, cancelText})` – Show dialog
- `render()` – Refresh UI after state changes

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Service Worker won't register | Ensure you're on HTTPS (or localhost) |
| Audio doesn't play | Check browser autoplay policies; user must interact first |
| Data not saving | Verify localStorage is enabled in browser settings |
| PWA not installable | Manifest must be valid JSON; HTTPS required |
| Encryption issues | PIN must be 4-8 digits; forgetting PIN locks data permanently |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add my feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License – See `LICENSE` file for details.

---

## 🙏 Credits

- **Web Audio API** – MDN Web Docs
- **Service Workers** – W3C Specification
- **Crypto Subtle** – WebCrypto API
- **Design Inspiration** – Forest themes, elf character

---

## 💬 Support

- **Issues:** Open a GitHub issue for bugs or feature requests
- **Questions:** Start a Discussion on GitHub
- **Privacy Concerns:** All operations are verifiable in source code

---

## 🗺️ Roadmap

- [ ] Share entries via Web Share API
- [ ] Offline graph visualization
- [ ] Companion CLI for data export
- [ ] Dark/light mode toggle
- [ ] Multiple language support (IT, EN, ES, FR)
- [ ] Haptic patterns library

---

**Made with 💚 for your well-being.**

*Last updated: January 2025*
