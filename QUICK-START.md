# 🚀 Quick Start - AURA Zen v2.0

## Avvio Immediato (2 minuti)

### 1. Apri il progetto in VS Code

```bash
cd aura-zen-pwa
code .
```

### 2. Rinomina i file

```bash
# Windows (PowerShell)
Rename-Item index.html index-old.html
Rename-Item index-new.html index.html
Rename-Item app.js app-old.js

# Mac/Linux
mv index.html index-old.html
mv index-new.html index.html
mv app.js app-old.js
```

### 3. Avvia con Live Server

1. Installa estensione "Live Server" in VS Code
2. Click destro su `index.html`
3. Seleziona "Open with Live Server"

**OPPURE** usa Python:

```bash
python -m http.server 8000
# Apri http://localhost:8000
```

### 4. Testa l'app!

L'app si aprirà automaticamente. Segui il flow:

1. **Onboarding** → Scegli obiettivo → "Inizia"
2. **Login** → Inserisci nome → "Continua"
3. **Home** → Esplora il pet e le azioni
4. **Check-in** → Fai il primo check-in
5. **Insights** → Vedi i grafici (dopo qualche check-in)
6. **Settings** → Prova dark mode!

## ✅ Checklist Veloce

- [ ] L'app si carica senza errori
- [ ] Onboarding funziona
- [ ] Check-in salva i dati
- [ ] Dark mode funziona
- [ ] Grafici si visualizzano
- [ ] Export dati funziona

## ⚠️ Troubleshooting

### Errore "Cannot find module"
→ Verifica che tutti i file in `js/` esistano
→ Controlla la console del browser

### Pagina bianca
→ Apri DevTools Console (F12)
→ Controlla errori in rosso
→ Assicurati di usare un server HTTP (non `file://`)

### Dati vecchi non caricati
→ Normale! La v2 usa `aura_zen_v2` come chiave
→ Puoi esportare dalla v1 e importare in v2

## 🎨 Personalizzazione Rapida

### Cambia colori primari

Apri `css/design-system.css` e modifica:

```css
:root {
  --color-primary-500: #22c55e;  /* Cambia questo */
  --color-primary-600: #16a34a;  /* E questo */
}
```

### Cambia nome app

1. `index.html` → `<title>`
2. `js/config.js` → `APP_CONFIG.name`
3. `manifest.webmanifest` → `name` e `short_name`

## 📱 Test su Mobile

1. Trova il tuo IP locale
2. Apri da mobile: `http://TUO_IP:8000`
3. Installa come PWA (Add to Home Screen)

## 🎉 Pronto!

Ora hai AURA Zen v2.0 funzionante con:
- ✅ Design moderno
- ✅ Dark mode
- ✅ Grafici
- ✅ Architettura pulita
- ✅ Performance ottimizzate

Leggi [README-V2.md](README-V2.md) per dettagli completi.
