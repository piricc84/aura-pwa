# AURA PWA - Quick Reference Guide

## 🚀 Getting Started (5 minutes)

```bash
# 1. Extract & enter directory
tar -xzf aura-pwa-optimized.tar.gz
cd aura-pwa

# 2. Start development
npm run dev
# Open http://localhost:8000 in your browser

# 3. Make changes
# Edit files in src/ directory - changes reflect live

# 4. Test before commit
npm run test      # Quality assurance
npm run build     # Production build test
npm run analyze   # Performance metrics

# 5. Push to GitHub
./git-setup.sh    # First time only
git push origin main
```

---

## 📋 All NPM Commands

```bash
npm run dev              # Start local dev server (port 8000)
npm run serve            # Alternative server (port 8080)
npm run test             # Run all tests (25/25 must pass)
npm run build            # Create optimized production build
npm run analyze          # View performance & quality metrics
npm run lighthouse       # Run Lighthouse audit
npm run clean            # Delete dist/ folder
npm run reset            # Clean + delete caches
```

---

## 🔄 Git Workflow

```bash
# First time: Initialize Git
./git-setup.sh

# Daily workflow:
git status                          # Check changes
git add .                          # Stage all changes
git commit -m "feat: description"  # Commit (use conventional format)
git push origin main               # Push to GitHub

# View history:
git log --oneline                  # See commits
git diff HEAD~1                    # Compare with previous commit
git revert <commit-hash>          # Undo a commit

# Branch workflow:
git checkout -b feature/my-feature # Create feature branch
# (make changes)
git push origin feature/my-feature # Push feature branch
# (open PR on GitHub)
```

---

## 📁 File Organization

```
src/
├── index.html              # Main app (no CSS/JS inline during dev)
├── css/
│   └── main.css           # All styles (auto-inlined during build)
├── js/
│   └── app.js             # All app logic (~1,160 lines)
├── sw.js                  # Service Worker (offline caching)
├── manifest.webmanifest   # PWA metadata
└── icons/
    ├── icon-192.png       # Home screen icon
    └── icon-512.png       # Splash screen icon

dist/                       # Production build (generated)
├── index.html             # Single file (CSS/JS inlined)
├── sw.js                  # Minified
├── manifest.webmanifest
└── icons/

tests/
└── test.js                # 25 quality checks

scripts/
├── build.js               # Minification & bundling
└── analyze.js             # Performance analysis
```

---

## 🎨 Making Changes

### Add a New Theme

1. **Edit** `src/js/app.js`
2. **Find** the `themes` object (~line 350)
3. **Add** new theme:
```javascript
const themes = {
  forest: { ... },
  custom: {
    '--bg0': '#1a1a1a',
    '--accent': '#ff6b6b',
    // ... copy all color variables
  }
};
```
4. **Update** HTML dropdown in `src/index.html`
5. **Test**: `npm run dev`
6. **Commit**: `git commit -m "feat: add custom theme"`

### Add a New Mood Advice

1. **Edit** `src/js/app.js`
2. **Find** the `advice` object (~line 920)
3. **Add** to existing mood or create new category:
```javascript
const advice = {
  calm: [
    'Existing advice...',
    'Your new advice here.' // Add this line
  ]
};
```
4. **Test**: Open app → click mood → check new advice appears
5. **Commit**: `git commit -m "feat: add new mood advice"`

### Change Colors

1. **Edit** `src/css/main.css`
2. **Find** `:root { ... }` (~line 4)
3. **Change** color values:
```css
:root {
  --bg0: #000000;      /* Background dark */
  --accent: #00ff00;   /* Primary color */
  --warn: #ff0000;     /* Warning color */
  /* ... etc */
}
```
4. **Save** and refresh browser (dev server auto-reloads)
5. **Commit**: `git commit -m "style: update color scheme"`

---

## 🧪 Testing Your Changes

```bash
# Before every commit, run:
npm run test                    # Must show 25/25 passed ✓

# If tests fail:
npm run test 2>&1 | grep "✗"   # Show only failures
npm run test 2>&1 | tail -20    # Show last 20 lines

# Verify build works:
npm run build                   # Check dist/ is created

# Check performance:
npm run analyze                 # View detailed metrics
```

---

## 📱 Testing on Devices

### iOS Testing

```bash
# On Mac + iPhone:
1. npm run dev
2. Get your machine's IP: ifconfig | grep "inet "
3. Open Safari on iPhone → http://[YOUR-IP]:8000
4. Test the app fully
5. Tap Share → Add to Home Screen (to test installation)
```

### Android Testing

```bash
# On Windows/Mac + Android:
1. npm run dev
2. Get your machine's IP: ipconfig (Windows) or ifconfig (Mac)
3. Open Chrome on Android → http://[YOUR-IP]:8000
4. Test the app fully
5. Tap menu (⋮) → Install app (to test installation)
```

---

## 🔐 Testing Encryption

```javascript
// In browser console while app is running:

// 1. Set a PIN in Settings
// 2. Create a mood entry
// 3. Check encrypted storage:
JSON.parse(localStorage.getItem('aura_state_v360::youruser'))
// Should show: { enc: true, ctB64: "...", ivB64: "..." }

// 4. Verify data is encrypted (not readable)
// 5. Add PIN → change works
// 6. Wrong PIN → decryption fails (expected)

// Export your data:
// Settings → Export JSON (should download encrypted backup)
```

---

## 🐛 Debugging

### Enable Verbose Logging

```javascript
// Add to top of src/js/app.js:
const DEBUG = true;
function log(...args) {
  if (DEBUG) console.log('[AURA]', ...args);
}

// Then use:
log('User logged in:', user);
```

### Check Service Worker

```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => {
    console.log('SW Scope:', reg.scope);
    console.log('SW State:', reg.active?.state);
  });
});
```

### View Local Storage

```javascript
// See all stored data:
Object.entries(localStorage).forEach(([k, v]) => {
  console.log(k, '→', v.slice(0, 100));
});

// Clear all data (nuclear option):
localStorage.clear();
```

### Monitor Network (for external requests)

```javascript
// Normally there should be none (except fonts)
// Open DevTools → Network tab
// All requests should be from your domain
```

---

## 🚀 Deployment Commands

```bash
# Production build:
npm run build

# Test production build locally:
npm run serve
# Open http://localhost:8080 and verify

# Upload dist/ folder to your server:
# Method 1 - FTP: Upload dist/ to web root
# Method 2 - Git: Push to GitHub Pages, Netlify, or Vercel
# Method 3 - Docker: Use provided Nginx config

# Verify deployment:
# 1. Test on https://your-domain.com
# 2. Install on iOS: Safari → Share → Add to Home Screen
# 3. Install on Android: Chrome → menu → Install app
# 4. Check DevTools → Application → Service Workers (should be active)
```

---

## 📊 Performance Benchmarking

```bash
# Full analysis:
npm run analyze

# Expected output:
# ✓ Total Bundle Size        < 100 KB        55.7 KB
# ✓ First Contentful Paint   < 1s            ~0.5s
# ✓ Time to Interactive      < 2s            ~1.2s
# ✓ Lighthouse PWA Score     >= 90           95
```

---

## 🛠️ Maintenance Tasks

### Monthly

```bash
# Update dependencies (if any):
npm audit                   # Check for vulnerabilities
npm update                  # Update packages

# Verify build integrity:
npm run clean
npm run build
npm run test
npm run analyze
```

### Before Each Release

```bash
# Full checklist:
npm run test                # All tests pass ✓
npm run build               # Build succeeds ✓
npm run analyze             # Check metrics ✓
git status                  # No uncommitted changes ✓
git log --oneline | head -5 # Review recent commits ✓

# Tag release:
git tag -a v3.6.1 -m "Release v3.6.1"
git push origin v3.6.1
```

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `npm: command not found` | Install Node.js from nodejs.org |
| Dev server won't start | Check if port 8000 is in use: `lsof -i :8000` |
| Tests fail | Run `npm run test` and read the errors carefully |
| Build fails | Check file paths: `ls src/js/app.js` |
| Service Worker issues | Clear cache: DevTools → Application → Clear Storage |
| Git error | Run `./git-setup.sh` again to configure |
| Icons not showing | Check `src/icons/` folder has PNG files |

---

## 📚 More Information

- **Full docs**: Read `README.md`
- **Deployment**: Read `DEPLOYMENT.md`
- **Contributing**: Read `CONTRIBUTING.md`
- **Web standards**: Check MDN Web Docs
- **PWA checklist**: Visit pwachecklist.com

---

## 💡 Pro Tips

1. **Use VS Code** with Live Server extension for better DX
2. **Enable DevTools Device Mode** (F12 → mobile icon) for testing
3. **Use Chrome DevTools Console** to test JavaScript directly
4. **Check Service Worker** in DevTools → Application tab
5. **Test offline** by going to DevTools → Network → Offline mode
6. **Clear cache** regularly during development
7. **Use meaningful commit messages** for better git history
8. **Create feature branches** for major changes
9. **Test on real devices** before deploying
10. **Monitor Lighthouse scores** to catch regressions

---

**Happy coding! 🎉**

For detailed help, visit the project's GitHub repository or read the comprehensive documentation files included in the package.
