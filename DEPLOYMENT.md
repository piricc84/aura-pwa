# 📱 AURA PWA - iOS & Android Installation Guide

This is a **Progressive Web App (PWA)**, not a native app. It installs like an app but runs through the browser engine.

---

## 🍎 iOS Installation (Safari)

### Requirements
- iPhone/iPad with iOS 12 or later
- Safari browser
- HTTPS URL (or localhost for testing)

### Installation Steps

1. **Open in Safari**
   - Navigate to your AURA PWA URL
   - Example: `https://your-domain.com/aura`

2. **Add to Home Screen**
   - Tap the **Share** button (square with arrow)
   - Scroll down and tap **Add to Home Screen**
   - Edit the name if desired (max 60 characters)
   - Tap **Add**

3. **Launch**
   - The app icon now appears on your home screen
   - Tap to launch—it will open in full-screen mode
   - No address bar, just the app UI

### iOS-Specific Features

✅ **Status Bar Color** – Set via `meta name="apple-mobile-web-app-status-bar-style"`
✅ **Home Screen Icon** – Supports `apple-touch-icon`
✅ **Standalone Mode** – Full-screen without Safari chrome
✅ **Safe Area** – Respects notch/bottom bar with `env(safe-area-inset-*)`
✅ **Vibration** – Haptics API supported (may be limited by iOS)
✅ **Web Audio** – All audio features work

### iOS Limitations

⚠️ **No Push Notifications** – Apple doesn't support Web Push on PWAs
⚠️ **Limited Vibration** – iOS may reduce vibration intensity
⚠️ **Camera Access** – Not available (use file upload instead)
⚠️ **Background Sync** – Not fully supported; app must be active
⚠️ **Storage Quota** – ~50MB for localStorage (varies by device)

### Updating on iOS

- **Automatic**: The Service Worker updates in background
- **Manual**: Pull down to refresh, or delete and reinstall

---

## 🤖 Android Installation (Chrome)

### Requirements
- Android 5.0 or later
- Chrome browser (or Android 10+ with WebAPK support)
- HTTPS URL (or localhost for testing)

### Installation Steps (Chrome Desktop)

1. **Open in Chrome**
   - Navigate to `https://your-domain.com/aura`
   - Wait ~3 seconds (Chrome checks install criteria)

2. **Install Prompt**
   - A banner appears or the **Install** button becomes active
   - Tap **Install**
   - Confirm

3. **Launch**
   - App appears in app drawer or on home screen
   - Tap to launch in standalone mode

### Installation Steps (Android Browser)

1. **Manual Install**
   - Open in Chrome
   - Tap menu (⋮) → **Install app** (or **Add to Home Screen**)

2. **Alternative** – Use `beforeinstallprompt` event:
   ```javascript
   window.addEventListener('beforeinstallprompt', (e) => {
     // Show custom install button
     installButton.addEventListener('click', () => e.prompt());
   });
   ```

### Android-Specific Features

✅ **WebAPK** – Chrome 84+ converts PWA to native APK automatically
✅ **App Drawer** – Installed apps appear in launcher
✅ **Adaptive Icons** – Supports modern Android icon shapes
✅ **Shortcuts** – Quick actions from home screen
✅ **Vibration** – Full Vibration API support
✅ **Share Target** – Receive shared files (if configured)
✅ **Web Audio** – All audio features work

### Android Limitations

⚠️ **WebAPK Size** – Generated APK is ~5-10MB
⚠️ **Background Sync** – Limited by Android battery optimization
⚠️ **Storage Quota** – ~50MB for localStorage (varies by device)
⚠️ **Notification Badges** – Limited by device OS
⚠️ **File Access** – Limited to picker API, no filesystem access

### Updating on Android

- **Automatic**: Chrome checks for updates every 24 hours
- **Manual**: Uninstall and reinstall for immediate update
- **Force Update**: Clear Chrome cache in Settings → Apps

---

## 🔧 Technical Configuration

### Meta Tags (Already in AURA)

```html
<!-- iOS Configuration -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="AURA">
<meta name="apple-touch-icon" href="icons/icon-192.png">

<!-- Android Configuration -->
<meta name="theme-color" content="#0e2a18">
<meta name="color-scheme" content="dark light">

<!-- Viewport for Mobile -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
```

### Manifest Configuration (Already in AURA)

```json
{
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0b1220",
  "theme_color": "#0e2a18",
  "categories": ["health", "wellness"],
  "screenshots": [...]
}
```

---

## 📊 Install Eligibility Checklist

For the install prompt to show, ensure:

- [x] HTTPS (or localhost)
- [x] Valid manifest.webmanifest with:
  - [x] `name` and `short_name`
  - [x] `icons` (192x192 and 512x512 PNG)
  - [x] `display: "standalone"`
- [x] Service Worker registered
- [x] Responsive design (mobile viewport)
- [x] No mixed content (all resources HTTPS)
- [x] 2-3 interactions before prompt (Chrome policy)

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Build: `npm run build`
- [ ] Test: `npm run test`
- [ ] Icons: Verify 192x192 and 512x512 PNG files exist
- [ ] Manifest: Validate JSON syntax
- [ ] Service Worker: Check for errors in console
- [ ] HTTPS: Enable on your domain
- [ ] Performance: Run Lighthouse audit

### Server Configuration

#### Nginx
```nginx
# Force HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Service Worker caching
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }
    
    # Manifest
    location = /manifest.webmanifest {
        add_header Content-Type "application/manifest+json";
        add_header Cache-Control "max-age=3600";
    }
    
    # Assets: long-term cache
    location ~* \.(js|css|png|jpg|gif|svg|webp)$ {
        add_header Cache-Control "max-age=31536000, public, immutable";
    }
    
    # HTML: no cache (always fetch latest)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header X-Content-Type-Options "nosniff";
    }
    
    # Default
    location / {
        try_files $uri /index.html;
    }
}
```

#### Apache
```apache
<IfModule mod_ssl.c>
  <VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/aura
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # Service Worker
    <Files "sw.js">
      Header set Cache-Control "no-cache, no-store, must-revalidate"
      Header set Service-Worker-Allowed "/"
    </Files>
    
    # Manifest
    <Files "manifest.webmanifest">
      Header set Content-Type "application/manifest+json"
      Header set Cache-Control "max-age=3600"
    </Files>
    
    # HTML
    <Files "index.html">
      Header set Cache-Control "no-cache, no-store, must-revalidate"
      Header set X-Content-Type-Options "nosniff"
    </Files>
    
    <FilesMatch "\.(js|css|png|jpg|gif|svg|webp)$">
      Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>
    
    # Fallback to index.html
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /index.html [L]
    </IfModule>
  </VirtualHost>
</IfModule>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
  ServerName your-domain.com
  Redirect permanent / https://your-domain.com/
</VirtualHost>
```

---

## 🧪 Testing on Device

### Local Testing (Desktop)

```bash
npm run dev
# Open http://localhost:8000 in Chrome DevTools
# Simulate mobile: Ctrl+Shift+M (or Cmd+Shift+M on Mac)
```

### Real Device Testing

#### iOS
1. Connect device to Mac with Safari
2. Safari → Develop → [Device] → [App Name]
3. View console and debug live

#### Android
1. Connect device with USB debugging enabled
2. Open `chrome://inspect` in Chrome
3. Select device and app
4. View console and debug live

---

## 🔍 Verification

### Check Installation Status

#### iOS (Safari)
- Settings → Safari → Advanced → Website Data
- Search for your domain
- Data shows app is using storage

#### Android (Chrome)
- Chrome Settings → Apps → Manage apps
- Your AURA app should appear as installed
- Tap to view app info and uninstall

### Monitor Service Worker

```javascript
// In browser console
navigator.serviceWorker.ready.then(reg => {
  console.log('Service Worker ready:', reg);
  console.log('Scope:', reg.scope);
});
```

### Check Cache

```javascript
// List all cached files
caches.keys().then(names => {
  console.log('Cache names:', names);
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(requests => {
        console.log(`Cache '${name}':`, requests.map(r => r.url));
      });
    });
  });
});
```

---

## 📞 Troubleshooting

### App Won't Install

**iOS:**
- Ensure HTTPS is enabled
- Try a different subdomain (some devices cache rejection)
- Safari Settings → Clear History and Website Data

**Android:**
- Must visit site multiple times (Chrome waits for engagement)
- Try another profile in Chrome
- Clear Chrome cache: Settings → Privacy → Clear Browsing Data

### Data Not Persisting

- Check localStorage quota: `navigator.storage.estimate()`
- iOS: Safari Settings → Privacy → Prevent cross-site tracking (may limit storage)
- Android: Chrome Settings → Privacy → Clear Browsing Data (don't do this!)

### Audio Not Working

- Check browser autoplay policies
- User must interact (tap) before audio plays
- iOS: Mute switch may silence audio; check Settings → Sound

### Service Worker Issues

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
```

---

## 📚 Resources

- [PWA Checklist](https://www.pwachecklist.com/)
- [Web.dev Install](https://web.dev/install-criteria/)
- [iOS PWA Limitations](https://medium.com/dev-channel/pwas-on-ios-are-here-d00430dee3a7)
- [Android WebAPK](https://developers.google.com/web/android-web-apk)

---

**Happy deploying! 🚀**
