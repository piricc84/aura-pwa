(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const nowISO = () => new Date().toISOString();
  const todayKey = () => nowISO().slice(0, 10);

  function safeVibrate(pattern) {
    try {
      if (navigator.vibrate && state.haptics) navigator.vibrate(pattern);
    } catch (e) {}
  }

  function vibratePulse() {
    safeVibrate([8, 6, 8]);
  }

  function vibrateSuccess() {
    safeVibrate([12, 20, 8, 10]);
  }

  function vibrateWarning() {
    safeVibrate([30, 15, 30]);
  }

  function vibrateDouble() {
    safeVibrate([10, 8, 10]);
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));
      padding:12px 14px;border-radius:18px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.14);
      backdrop-filter:blur(14px);font-weight:900;z-index:999;box-shadow:0 18px 46px rgba(0,0,0,.35);
      opacity:0;transform:translateY(8px);transition:.18s ease`;
    $('app').appendChild(t);
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
    }, 1600);
    setTimeout(() => t.remove(), 2000);
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 800);
  }

  function fmtDateShort(d) {
    const dt = new Date(d);
    return dt.toISOString().slice(0, 10);
  }

  function pdfEscape(text) {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function buildSimplePdf(lines) {
    const content = lines
      .map((line, i) => `BT /F1 12 Tf 50 ${770 - i * 16} Td (${pdfEscape(line)}) Tj ET`)
      .join('\n');
    const objects = [];
    objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj');
    objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj');
    objects.push(
      '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>endobj'
    );
    objects.push('4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj');
    objects.push(`5 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream\nendobj`);
    let offset = 0;
    const parts = ['%PDF-1.4'];
    const xref = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f '];
    parts.forEach((p) => (offset += p.length + 1));
    objects.forEach((obj) => {
      xref.push(String(offset).padStart(10, '0') + ' 00000 n ');
      parts.push(obj);
      offset += obj.length + 1;
    });
    const xrefOffset = offset;
    parts.push(xref.join('\n'));
    parts.push(`trailer<< /Size ${objects.length + 1} /Root 1 0 R >>`);
    parts.push(`startxref\n${xrefOffset}\n%%EOF`);
    return parts.join('\n');
  }

  function parseSteps(input) {
    return (input || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  // ===== STATE & STORAGE =====
  const USERS_KEY = 'aura_users_v360';
  const CURR_KEY = 'aura_current_user_v360';
  const normUser = (u) => (u || '').trim().toLowerCase();
  const keyFor = (base) => `${base}::${normUser(localStorage.getItem(CURR_KEY) || 'guest')}`;
  const STATE_KEY = () => keyFor('aura_state_v360');
  const SEC_KEY = () => keyFor('aura_sec_v360');
  const PIN_META = () => keyFor('aura_pin_meta_v360');

  const defaultState = () => ({
    v: 360,
    createdAt: nowISO(),
    name: '',
    theme: 'ember',
    soundEnabled: true,
    haptics: true,
    pinEnabled: false,
    lockEnabled: false,
    remindersEnabled: false,
    routines: {
      morning: { enabled: true, time: '08:30', steps: ['Respiro', 'Umore', 'Intenzione'], lastDone: '' },
      evening: { enabled: true, time: '21:30', steps: ['Diario', 'Gratitudine', 'Chiudi la giornata'], lastDone: '' },
      lastReminder: { morning: '', evening: '' },
    },
    audio: { env: 'forest', vol: 0.4, on: false },
    moods: [],
    journal: [],
  });

  let state = defaultState();
  let sessionPin = null;

  function normalizeState(s) {
    const base = defaultState();
    const merged = { ...base, ...s };
    merged.audio = { ...base.audio, ...(s?.audio || {}) };
    merged.routines = { ...base.routines, ...(s?.routines || {}) };
    merged.routines.morning = { ...base.routines.morning, ...(s?.routines?.morning || {}) };
    merged.routines.evening = { ...base.routines.evening, ...(s?.routines?.evening || {}) };
    merged.routines.lastReminder = { ...base.routines.lastReminder, ...(s?.routines?.lastReminder || {}) };
    return merged;
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function setUsers(u) {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  }
  function setCurrentUser(u) {
    if (!u) localStorage.removeItem(CURR_KEY);
    else localStorage.setItem(CURR_KEY, normUser(u));
  }
  function getCurrentUser() {
    return (localStorage.getItem(CURR_KEY) || '').trim();
  }

  // ===== CRYPTO =====
  async function pwHash(user, pass, saltB64) {
    const enc = new TextEncoder();
    const salt = saltB64
      ? Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0))
      : crypto.getRandomValues(new Uint8Array(16));
    const data = enc.encode(`AURA|${normUser(user)}|${pass}`);
    const merged = new Uint8Array(salt.length + data.length);
    merged.set(salt, 0);
    merged.set(data, salt.length);
    const dig = await crypto.subtle.digest('SHA-256', merged);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(dig)));
    return { hash: b64, saltB64: saltB64 || btoa(String.fromCharCode(...salt)) };
  }

  async function deriveKey(pin, saltB64) {
    const enc = new TextEncoder();
    const salt = saltB64
      ? Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0))
      : crypto.getRandomValues(new Uint8Array(16));
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(pin), { name: 'PBKDF2' }, false, [
      'deriveKey',
    ]);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    return { key, saltB64: saltB64 || btoa(String.fromCharCode(...salt)) };
  }

  async function encryptJSON(obj, pin) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const secMeta = JSON.parse(localStorage.getItem(SEC_KEY()) || '{}');
    const { key, saltB64 } = await deriveKey(pin, secMeta.saltB64);
    const enc = new TextEncoder();
    const pt = enc.encode(JSON.stringify(obj));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt);
    localStorage.setItem(SEC_KEY(), JSON.stringify({ saltB64 }));
    return {
      enc: true,
      ivB64: btoa(String.fromCharCode(...iv)),
      ctB64: btoa(String.fromCharCode(...new Uint8Array(ct))),
    };
  }

  async function decryptJSON(payload, pin) {
    const secMeta = JSON.parse(localStorage.getItem(SEC_KEY()) || '{}');
    if (!secMeta.saltB64) throw new Error('NO_SALT');
    const { key } = await deriveKey(pin, secMeta.saltB64);
    const iv = Uint8Array.from(atob(payload.ivB64), (c) => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(payload.ctB64), (c) => c.charCodeAt(0));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(new Uint8Array(pt)));
  }

  async function pinHash(pin) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode('AURA|PIN|v360|' + pin));
    return btoa(String.fromCharCode(...new Uint8Array(buf))).slice(0, 44);
  }

  function getPinMeta() {
    try {
      return JSON.parse(localStorage.getItem(PIN_META()) || 'null');
    } catch (e) {
      return null;
    }
  }
  function setPinMeta(meta) {
    localStorage.setItem(PIN_META(), JSON.stringify(meta));
  }

  async function saveState() {
    if (state.pinEnabled && sessionPin) {
      localStorage.setItem(STATE_KEY(), JSON.stringify(await encryptJSON(state, sessionPin)));
    } else {
      localStorage.setItem(STATE_KEY(), JSON.stringify(state));
    }
  }

  async function loadState() {
    const raw = localStorage.getItem(STATE_KEY());
    if (!raw) return defaultState();
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return defaultState();
    }
    if (parsed && parsed.enc) {
      if (!sessionPin) throw new Error('LOCKED');
      return await decryptJSON(parsed, sessionPin);
    }
    return parsed || defaultState();
  }

  // ===== THEMES =====
  const themes = {
    ember: {
      '--bg0': '#f4efe6',
      '--bg1': '#efe6d8',
      '--bg2': '#e5d8c7',
      '--bg3': '#d6c7b0',
      '--accent': '#1f7f78',
      '--accent2': '#e08a4f',
      '--text': '#1d1c1a',
      '--dim': 'rgba(29, 28, 26, 0.7)',
      '--dim2': 'rgba(29, 28, 26, 0.5)',
    },
    tide: {
      '--bg0': '#eef5f7',
      '--bg1': '#e3eef2',
      '--bg2': '#d7e6ec',
      '--bg3': '#c6d8e0',
      '--accent': '#2e7fa1',
      '--accent2': '#4bb3d3',
      '--text': '#162028',
      '--dim': 'rgba(22, 32, 40, 0.7)',
      '--dim2': 'rgba(22, 32, 40, 0.5)',
    },
    meadow: {
      '--bg0': '#f0f5ec',
      '--bg1': '#e4ede0',
      '--bg2': '#d7e3d0',
      '--bg3': '#c5d4be',
      '--accent': '#4b8c66',
      '--accent2': '#d9a44f',
      '--text': '#1f2a21',
      '--dim': 'rgba(31, 42, 33, 0.7)',
      '--dim2': 'rgba(31, 42, 33, 0.5)',
    },
    dusk: {
      '--bg0': '#f6eff4',
      '--bg1': '#efe3ee',
      '--bg2': '#e5d5e7',
      '--bg3': '#d7c2dc',
      '--accent': '#8b5fbf',
      '--accent2': '#e07aa3',
      '--text': '#231823',
      '--dim': 'rgba(35, 24, 35, 0.7)',
      '--dim2': 'rgba(35, 24, 35, 0.5)',
    },
  };

  function applyTheme() {
    const t = themes[state.theme] ? state.theme : 'ember';
    state.theme = t;
    const root = document.documentElement;
    Object.entries(themes[t]).forEach(([k, v]) => root.style.setProperty(k, v));
  }

  // ===== AUDIO =====
  const audio = { ctx: null, master: null, nodes: null, on: false, env: 'forest', vol: 0.4 };

  function ensureAudioCtx() {
    if (audio.ctx) return audio.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.12;
    audio.master.connect(audio.ctx.destination);
    return audio.ctx;
  }

  function softClick() {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(740, t);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g);
    g.connect(audio.master || ctx.destination);
    o.start(t);
    o.stop(t + 0.16);
  }

  function successBeep() {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g);
    g.connect(audio.master || ctx.destination);
    o.start(t);
    o.stop(t + 0.2);
  }

  function buildAmbience(ctx, env) {
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(audio.master);
    const noiseLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * 0.18;
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    ns.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    const envConfig = {
      forest: { lpFreq: 950, nsGain: 0.22, base: 207.65, lfoVal: 5 },
      rain: { lpFreq: 850, nsGain: 0.32, base: 196, lfoVal: 9 },
      river: { lpFreq: 1700, nsGain: 0.28, base: 220, lfoVal: 5 },
      night: { lpFreq: 1100, nsGain: 0.22, base: 196, lfoVal: 5 },
      ocean: { lpFreq: 780, nsGain: 0.28, base: 185, lfoVal: 4 },
      thunderstorm: { lpFreq: 650, nsGain: 0.38, base: 164, lfoVal: 12 },
      mountain: { lpFreq: 920, nsGain: 0.24, base: 233, lfoVal: 6 },
      insects: { lpFreq: 1400, nsGain: 0.18, base: 261.6, lfoVal: 8 },
    };
    const config = envConfig[env] || envConfig.forest;
    lp.frequency.value = config.lpFreq;
    lp.Q.value = 0.65;
    const nsGain = ctx.createGain();
    nsGain.gain.value = config.nsGain;
    ns.connect(lp);
    lp.connect(nsGain);
    nsGain.connect(g);
    const base = config.base;
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = base;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = base * 1.5;
    const o3 = ctx.createOscillator();
    o3.type = 'triangle';
    o3.frequency.value = base * 2;
    const pGain = ctx.createGain();
    pGain.gain.value = 0.095;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 110;
    o1.connect(pGain);
    o2.connect(pGain);
    o3.connect(pGain);
    pGain.connect(hp);
    hp.connect(g);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = config.lfoVal;
    lfo.connect(lfoGain);
    lfoGain.connect(o1.frequency);
    const t = ctx.currentTime;
    ns.start(t);
    o1.start(t);
    o2.start(t);
    o3.start(t);
    lfo.start(t);
    return {
      stop: () => {
        const now = ctx.currentTime;
        try {
          g.gain.cancelScheduledValues(now);
        } catch (e) {}
        try {
          g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
        } catch (e) {}
        try {
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        } catch (e) {}
        setTimeout(() => {
          [ns, o1, o2, o3, lfo].forEach((x) => {
            try {
              x.stop();
            } catch (e) {}
          });
          try {
            g.disconnect();
          } catch (e) {}
        }, 420);
      },
    };
  }

  function setAudioUI() {
    const env = $('audioEnv');
    const vol = $('audioVol');
    const volLbl = $('volLbl');
    const status = $('audioStatus');
    const toggle = $('audioToggle');
    if (env) env.value = audio.env;
    if (vol) vol.value = Math.round(audio.vol * 100);
    if (volLbl) volLbl.textContent = Math.round(audio.vol * 100) + '%';
    if (toggle) toggle.textContent = audio.on ? 'Pausa' : 'Avvia';
    if (status) {
      status.textContent = audio.on
        ? `In riproduzione, volume ${Math.round(audio.vol * 100)}%`
        : 'Pronto. Tocca Avvia per iniziare.';
    }
  }

  async function audioStart() {
    if (!state.soundEnabled) {
      toast('Audio disattivato nelle impostazioni');
      return;
    }
    const ctx = ensureAudioCtx();
    if (!ctx) {
      toast('Audio non supportato');
      return;
    }
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {}
    }
    if (audio.nodes) {
      try {
        audio.nodes.stop();
      } catch (e) {}
      audio.nodes = null;
    }
    audio.nodes = buildAmbience(ctx, audio.env);
    const t = ctx.currentTime;
    audio.master.gain.setValueAtTime(0.0001, t);
    audio.master.gain.exponentialRampToValueAtTime(clamp(audio.vol, 0.05, 1), t + 0.8);
    audio.on = true;
    setAudioUI();
  }

  function audioStop() {
    if (audio.nodes) {
      try {
        audio.nodes.stop();
      } catch (e) {}
      audio.nodes = null;
    }
    if (audio.ctx && audio.master) {
      const t = audio.ctx.currentTime;
      try {
        audio.master.gain.cancelScheduledValues(t);
      } catch (e) {}
      try {
        audio.master.gain.setValueAtTime(Math.max(0.0001, audio.master.gain.value), t);
      } catch (e) {}
      try {
        audio.master.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      } catch (e) {}
    }
    audio.on = false;
    setAudioUI();
  }

  // ===== ADVICE & TAGS =====
  const advice = {
    calm: [
      'Fai 3 respiri lenti: espira piu a lungo.',
      'Metti una mano sul petto: "Sono qui."',
      'Scegli una cosa semplice da fare con calma.',
    ],
    tense: [
      'Sciogli mascella e spalle. Ripeti 3 volte.',
      'Micro-obiettivo: 10 minuti su una cosa.',
      'Respiro 4-2-6 per 6 cicli.',
    ],
    tired: ['Luce naturale per 60s, poi acqua.', 'Occhi chiusi 30s: espira lungo.', 'Silenzia notifiche per 10 minuti.'],
    down: ['3 cose che vedi, 2 suoni, 1 sensazione.', 'Gratitudine minuscola. Vale.', 'Gesto gentile: doccia breve o tisana.'],
  };
  const quotes = [
    '"Niente e\' troppo piccolo per meritare cura."',
    '"Un passo gentile e\' sempre un passo."',
    '"La calma e\' forza che non urla."',
    '"Il respiro e\' un ponte: torna qui."',
    '"Oggi scegli morbidezza."',
  ];
  const moodLabels = { calm: 'Calmo', tense: 'Teso', tired: 'Stanco', down: 'Giu' };
  const moodTags = [
    'sonno',
    'stress',
    'lavoro',
    'relazioni',
    'salute',
    'energia',
    'calma',
    'ansia',
    'focalizzazione',
    'gratitudine',
  ];

  // ===== BREATH TIMER =====
  let breathTimer = null;
  let breathEndsAt = 0;
  let breathDuration = 180;

  function stopBreathTimer() {
    if (breathTimer) clearInterval(breathTimer);
    breathTimer = null;
    breathEndsAt = 0;
  }

  function updateBreathTimerUI() {
    const timerEl = modal?.querySelector('#breathTimer');
    const phaseEl = modal?.querySelector('#breathPhase');
    if (!timerEl || !phaseEl) return;
    if (!breathEndsAt) {
      timerEl.textContent = `${String(Math.floor(breathDuration / 60)).padStart(2, '0')}:${String(
        breathDuration % 60
      ).padStart(2, '0')}`;
      phaseEl.textContent = 'Pronto';
      return;
    }
    const remaining = Math.max(0, Math.ceil((breathEndsAt - Date.now()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const elapsed = breathDuration - remaining;
    const phase = elapsed % 12;
    if (phase < 4) phaseEl.textContent = 'Inspira';
    else if (phase < 6) phaseEl.textContent = 'Pausa';
    else phaseEl.textContent = 'Espira';
    if (remaining === 0) {
      stopBreathTimer();
      phaseEl.textContent = 'Sessione completata';
      vibrateSuccess();
      successBeep();
      toast('Respiro completato');
    }
  }

  function startBreathTimer(durationSec) {
    stopBreathTimer();
    breathDuration = durationSec;
    breathEndsAt = Date.now() + durationSec * 1000;
    updateBreathTimerUI();
    breathTimer = setInterval(updateBreathTimerUI, 250);
  }

  // ===== RENDER =====
  function setTime() {
    const el = $('heroTime');
    if (el) {
      const d = new Date();
      el.textContent = d.toLocaleString('it-IT', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
  }

  function computeStreak() {
    const days = new Set(state.moods.map((m) => m.date));
    let streak = 0;
    const cur = new Date();
    while (true) {
      const k = cur.toISOString().slice(0, 10);
      if (days.has(k)) streak++;
      else break;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  function todayMood() {
    const k = todayKey();
    return state.moods.find((m) => m.date === k) || null;
  }

  function render() {
    applyTheme();
    setTime();
    const streak = computeStreak();
    const streakBadge = $('streakBadge');
    const streakCount = $('streakCount');
    if (streakBadge && streakCount) {
      streakCount.textContent = streak;
      streakBadge.style.display = streak > 0 ? 'flex' : 'none';
    }
    const last = state.moods[state.moods.length - 1];
    const mood = last ? last.mood : 'calm';
    const hintEl = $('hint');
    if (hintEl) {
      const a = advice[mood] || advice.calm;
      hintEl.textContent = a[Math.floor(Math.random() * a.length)];
    }
    const nameEl = $('userName');
    if (nameEl) nameEl.textContent = state.name ? state.name : 'amico';

    const today = todayMood();
    const moodLabel = today ? moodLabels[today.mood] || 'Non registrato' : 'Non registrato';
    const moodEl = $('todayMoodLabel');
    if (moodEl) moodEl.textContent = moodLabel;
    const energyEl = $('todayEnergy');
    if (energyEl) energyEl.textContent = today ? `${clamp(today.energy ?? 55, 0, 100)}%` : '-';
    const journalEl = $('todayJournal');
    if (journalEl) journalEl.textContent = state.journal.find((j) => j.date === todayKey()) ? 'Compilato' : 'Vuoto';

    const welcomeSub = $('welcomeSub');
    if (welcomeSub) {
      const hasMood = !!today;
      const hasJournal = !!state.journal.find((j) => j.date === todayKey());
      let text = 'Un check-in rapido ti aspetta.';
      if (hasMood && hasJournal) text = 'Umore e diario di oggi sono gia registrati.';
      else if (hasMood) text = 'Umore registrato. Vuoi aggiungere una nota?';
      else if (hasJournal) text = 'Diario pronto. Vuoi registrare anche l\'umore?';
      welcomeSub.textContent = text;
    }

    const lockStatus = $('lockStatus');
    if (lockStatus) lockStatus.textContent = state.lockEnabled ? 'Attivo al prossimo avvio' : 'Disattivato';
    setAudioUI();
  }

  // ===== MODAL =====
  const modal = $('modal');
  const mTitle = $('mTitle');
  const mBody = $('mBody');
  const mContent = $('mContent');
  let modalResolve = null;

  function openModal({ title, body, contentHTML = '', okText = 'Ok', cancelText = 'Chiudi' } = {}) {
    if (mTitle) mTitle.textContent = title || '';
    if (mBody) mBody.innerHTML = body || '';
    if (mContent) mContent.innerHTML = contentHTML || '';
    const mOk = $('mOk');
    const mCancel = $('mCancel');
    if (mOk) mOk.textContent = okText;
    if (mCancel) mCancel.textContent = cancelText;
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
    return new Promise((res) => (modalResolve = res));
  }

  function closeModal(val = false) {
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    if (modalResolve) {
      modalResolve(val);
      modalResolve = null;
    }
  }

  $('mCancel')?.addEventListener('click', () => closeModal(false));
  $('mOk')?.addEventListener('click', () => closeModal(true));

  // ===== INSIGHTS =====
  function moodsSince(days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return state.moods.filter((m) => new Date(m.date).getTime() >= cutoff);
  }

  function topTags(limit = 5) {
    const counts = {};
    state.moods.forEach((m) => {
      (m.tags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => `${tag} (${count})`);
  }

  function exportMoodCsv() {
    const headers = ['date', 'mood', 'energy', 'tags', 'gratitude', 'note'];
    const rows = state.moods.map((m) => [
      m.date,
      m.mood,
      m.energy ?? '',
      (m.tags || []).join('|'),
      (m.gratitude || '').replace(/\n/g, ' '),
      (m.note || '').replace(/\n/g, ' '),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `AURA_mood_${todayKey()}.csv`);
    toast('Export CSV creato');
  }

  function exportInsightsPdf() {
    const last7 = moodsSince(7);
    const last30 = moodsSince(30);
    const avgEnergy7 = last7.length ? Math.round(last7.reduce((s, m) => s + (m.energy ?? 55), 0) / last7.length) : 0;
    const avgEnergy30 = last30.length ? Math.round(last30.reduce((s, m) => s + (m.energy ?? 55), 0) / last30.length) : 0;
    const tags = topTags(6);
    const lines = [
      'AURA - Riepilogo locale',
      `Data: ${fmtDateShort(new Date())}`,
      '',
      `Check-in totali: ${state.moods.length}`,
      `Energia media 7 giorni: ${avgEnergy7}%`,
      `Energia media 30 giorni: ${avgEnergy30}%`,
      '',
      'Tag piu frequenti:',
      ...(tags.length ? tags : ['Nessun tag']),
      '',
      'Nota: dati solo locali, nessuna sincronizzazione.',
    ];
    const pdf = buildSimplePdf(lines);
    downloadBlob(new Blob([pdf], { type: 'application/pdf' }), `AURA_insights_${todayKey()}.pdf`);
    toast('Export PDF creato');
  }

  // ===== DIALOGS =====
  async function moodDialog() {
    const tm = todayMood();
    const current = tm ? tm.mood : null;
    const currentLabel = current ? moodLabels[current] || current : null;
    let picked = current || 'calm';
    const selectedTags = new Set((tm?.tags || []).filter(Boolean));
    const html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px">
        <button class="ghost" data-mood="calm" style="padding:12px">Calmo</button>
        <button class="ghost" data-mood="tense" style="padding:12px">Teso</button>
        <button class="ghost" data-mood="tired" style="padding:12px">Stanco</button>
        <button class="ghost" data-mood="down" style="padding:12px">Giu</button>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-size:14px; color:var(--dim); margin-bottom:8px">Tag rapidi</div>
        <div class="chipRow">
          ${moodTags.map((tag) => `<button class="chip" data-tag="${tag}">${tag}</button>`).join('')}
        </div>
      </div>
      <div style="margin-bottom:12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px">
        <div style="font-weight:700; margin-bottom:8px">Energia (0-100)</div>
        <input id="mEnergy" type="range" min="0" max="100" value="${tm ? clamp(tm.energy ?? 55, 0, 100) : 55}" style="width:100%">
        <div style="display:flex; justify-content:space-between; margin-top:6px; color:var(--dim2); font-weight:900; font-size:12px">
          <span>Scarico</span><span>Carico</span>
        </div>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-size:14px; color:var(--dim); margin-bottom:8px">Una nota (opzionale)</div>
        <textarea id="mNote" placeholder="Scrivi senza giudizio..." style="width:100%; min-height:80px; padding:10px; border:1px solid rgba(255,255,255,.1); border-radius:12px; background:rgba(255,255,255,.06); color:var(--text); font-family:inherit; resize:vertical">${
          tm ? (tm.note ? tm.note.replace(/</g, '&lt;') : '') : ''
        }</textarea>
      </div>
      <div>
        <div style="font-size:14px; color:var(--dim); margin-bottom:8px">Gratitudine (opzionale)</div>
        <input id="mGrat" type="text" placeholder="Anche una cosa minuscola..." value="${
          tm ? (tm.gratitude ? tm.gratitude.replace(/</g, '&lt;') : '') : ''
        }">
      </div>
    `;
    const confirmP = openModal({
      title: 'Come ti senti oggi?',
      body: current ? `Oggi risulta gia registrato: <b>${currentLabel}</b>. Puoi aggiornare.` : 'Scegli una parola semplice.',
      contentHTML: html,
      okText: 'Salva',
      cancelText: 'Annulla',
    });
    const buttons = [...(modal?.querySelectorAll('[data-mood]') || [])];
    const tagButtons = [...(modal?.querySelectorAll('[data-tag]') || [])];
    const paint = () =>
      buttons.forEach((b) => {
        const on = b.getAttribute('data-mood') === picked;
        b.style.borderColor = on ? 'rgba(245,182,108,.7)' : 'rgba(255,255,255,.14)';
        b.style.background = on ? 'rgba(245,182,108,.16)' : 'rgba(255,255,255,.06)';
      });
    const paintTags = () =>
      tagButtons.forEach((b) => {
        const on = selectedTags.has(b.getAttribute('data-tag'));
        b.classList.toggle('is-on', on);
      });
    paint();
    paintTags();
    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        softClick();
        picked = b.getAttribute('data-mood');
        paint();
      })
    );
    tagButtons.forEach((b) =>
      b.addEventListener('click', () => {
        softClick();
        const tag = b.getAttribute('data-tag');
        if (selectedTags.has(tag)) selectedTags.delete(tag);
        else selectedTags.add(tag);
        paintTags();
      })
    );
    const confirmed = await confirmP;
    if (!confirmed) return;
    const energy = Number(modal?.querySelector('#mEnergy')?.value ?? 55);
    const note = (modal?.querySelector('#mNote')?.value ?? '').trim().slice(0, 500);
    const grat = (modal?.querySelector('#mGrat')?.value ?? '').trim().slice(0, 120);
    const entry = {
      date: todayKey(),
      mood: picked,
      energy,
      note,
      gratitude: grat,
      tags: [...selectedTags],
      t: Date.now(),
    };
    const idx = state.moods.findIndex((m) => m.date === entry.date);
    if (idx >= 0) state.moods[idx] = entry;
    else state.moods.push(entry);
    state.moods = state.moods.slice(-400);
    await saveState();
    vibrateSuccess();
    successBeep();
    toast('Salvato');
    render();
  }

  async function breathDialog() {
    const html = `
      <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px">
        <div style="font-weight:700; margin-bottom:6px">Respiro guidato</div>
        <div style="font-family:var(--font-title); font-size:22px; margin-top:6px">4 - 2 - 6</div>
        <div style="font-size:14px; color:var(--dim); margin-top:10px">Inspira 4 - Pausa 2 - Espira 6. Ripeti per 6 cicli.</div>
      </div>
      <div class="timerBox" style="margin-top:12px">
        <div class="timerValue" id="breathTimer">03:00</div>
        <div class="timerPhase" id="breathPhase">Pronto</div>
      </div>
      <div style="font-size:12px; color:var(--dim); margin-top:10px">Suggerimento: abbassa le spalle e lascia andare la mascella.</div>
      <div style="margin-top:12px">
        <div style="font-size:14px; color:var(--dim); margin-bottom:8px">Sessioni rapide</div>
        <div class="chipRow">
          <button class="chip" data-breath="60">1 min</button>
          <button class="chip is-on" data-breath="180">3 min</button>
          <button class="chip" data-breath="300">5 min</button>
        </div>
      </div>
      <div class="inlineActions" style="margin-top:12px">
        <button class="primary" id="breathStart" style="flex:1">Avvia</button>
        <button class="ghost" id="breathStop" style="flex:1">Ferma</button>
      </div>
    `;
    const p = openModal({
      title: 'Respiro',
      body: 'Un minuto per te.',
      contentHTML: html,
      okText: 'Ok',
      cancelText: 'Chiudi',
    });
    const breathButtons = [...(modal?.querySelectorAll('[data-breath]') || [])];
    const paintBreathButtons = () =>
      breathButtons.forEach((b) => {
        const on = Number(b.getAttribute('data-breath')) === breathDuration;
        b.classList.toggle('is-on', on);
      });
    paintBreathButtons();
    breathButtons.forEach((b) =>
      b.addEventListener('click', () => {
        softClick();
        breathDuration = Number(b.getAttribute('data-breath'));
        stopBreathTimer();
        updateBreathTimerUI();
        paintBreathButtons();
      })
    );
    modal?.querySelector('#breathStart')?.addEventListener('click', () => {
      softClick();
      startBreathTimer(breathDuration);
    });
    modal?.querySelector('#breathStop')?.addEventListener('click', () => {
      softClick();
      stopBreathTimer();
      updateBreathTimerUI();
    });
    updateBreathTimerUI();
    await p;
    stopBreathTimer();
  }

  async function adviceDialog() {
    const last = state.moods[state.moods.length - 1];
    const mood = last ? last.mood : 'calm';
    const a = advice[mood] || advice.calm;
    const tip = a[Math.floor(Math.random() * a.length)];
    const html = `<div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px">
      <div style="font-weight:700; margin-bottom:6px">Consiglio dell'elfo</div>
      <div style="font-family:var(--font-title); font-size:20px; margin-top:6px">${tip}</div>
    </div><div style="font-size:12px; color:var(--dim); margin-top:10px">Piccolo, gentile, fattibile.</div>`;
    await openModal({
      title: 'Consiglio',
      body: 'Una cosa sola, ma vera.',
      contentHTML: html,
      okText: 'Ok',
      cancelText: 'Chiudi',
    });
  }

  async function journalDialog() {
    const existing = state.journal.find((j) => j.date === todayKey());
    const html = `
      <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
        <div style="font-weight:700; margin-bottom:4px">Diario</div>
        <div style="font-size:12px; color:var(--dim)">Scrivi libero. Nessun invio a server.</div>
      </div>
      <textarea id="jText" placeholder="Oggi..." style="width:100%; min-height:120px; padding:10px; border:1px solid rgba(255,255,255,.1); border-radius:12px; background:rgba(255,255,255,.06); color:var(--text); font-family:inherit; resize:vertical; margin-bottom:12px">${
        existing ? (existing.text ? existing.text.replace(/</g, '&lt;') : '') : ''
      }</textarea>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px">
        <button class="ghost" id="jExport" style="padding:12px">Export</button>
        <button class="ghost" id="jClear" style="padding:12px">Pulisci</button>
      </div>
      <div style="font-size:12px; color:var(--dim)">Export crea un file .txt sul dispositivo.</div>
    `;
    const p = openModal({
      title: 'Diario',
      body: 'Qui puoi essere te stesso.',
      contentHTML: html,
      okText: 'Salva',
      cancelText: 'Chiudi',
    });
    const ta = () => modal?.querySelector('#jText');
    modal?.querySelector('#jExport')?.addEventListener('click', () => {
      softClick();
      const text = (ta()?.value ?? '').trim();
      if (!text) {
        toast('Niente da esportare');
        return;
      }
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, `AURA_diario_${todayKey()}.txt`);
      toast('Export creato');
    });
    modal?.querySelector('#jClear')?.addEventListener('click', () => {
      softClick();
      if (ta()) ta().value = '';
      toast('Pulito.');
    });
    const ok = await p;
    if (!ok) return;
    const text = (ta()?.value ?? '').trim().slice(0, 5000);
    if (!text) {
      toast('Nessun testo');
      return;
    }
    const idx = state.journal.findIndex((j) => j.date === todayKey());
    if (idx >= 0) state.journal[idx] = { date: todayKey(), t: Date.now(), text };
    else state.journal.push({ date: todayKey(), t: Date.now(), text });
    state.journal = state.journal.slice(-180);
    await saveState();
    vibrateSuccess();
    successBeep();
    toast('Salvato');
  }

  async function journeyDialog() {
    const steps = new Set(state.moods.map((m) => m.date)).size;
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const html = `<div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
      <div style="font-weight:700; margin-bottom:6px">Passi nella foresta</div>
      <div style="font-family:var(--font-title); font-size:34px">${steps}</div>
      <div style="font-size:12px; color:var(--dim)">Un passo = un giorno con umore registrato.</div>
    </div>
    <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
      <div style="font-weight:700; margin-bottom:6px">Rituale rapido</div>
      <div style="font-size:14px; color:var(--dim)">1) Umore - 2) 30s Respiro - 3) Micro-obiettivo gentile.</div>
    </div>
    <div style="font-size:13px; color:var(--dim)">${quote}</div>`;
    await openModal({
      title: 'Percorso',
      body: 'Ogni giorno e un passo nella foresta.',
      contentHTML: html,
      okText: 'Ok',
      cancelText: 'Chiudi',
    });
  }

  async function statsDialog() {
    if (state.moods.length === 0) {
      await openModal({
        title: 'Statistiche',
        body: 'Ancora nessun dato.',
        contentHTML:
          '<div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px"><div style="font-weight:700; margin-bottom:6px">Suggerimento</div><div style="font-family:var(--font-title); font-size:18px">Registra l\'umore oggi. Bastano 10 secondi.</div></div>',
        okText: 'Ok',
        cancelText: 'Chiudi',
      });
      return;
    }
    const last = state.moods.slice(-14);
    const counts = { calm: 0, tense: 0, tired: 0, down: 0 };
    last.forEach((x) => (counts[x.mood] = (counts[x.mood] || 0) + 1));
    const avgEnergy = Math.round(last.reduce((s, x) => s + (x.energy ?? 55), 0) / last.length);
    const max = Math.max(1, ...Object.values(counts));
    const row = (label, val) => `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:10px">
      <div><div style="font-weight:700">${label}</div><div style="font-size:12px; color:var(--dim)">${val} / ${last.length}</div></div>
      <div style="width:100px; height:8px; border-radius:999px; background:rgba(255,255,255,.08); overflow:hidden"><div style="height:100%; width:${Math.round((val / max) * 100)}%; background:linear-gradient(135deg,var(--accent),var(--accent2))"></div></div></div>`;
    const last7 = moodsSince(7);
    const prev7 = moodsSince(14).filter((m) => new Date(m.date).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000);
    const avgEnergy7 = last7.length ? Math.round(last7.reduce((s, m) => s + (m.energy ?? 55), 0) / last7.length) : 0;
    const avgEnergyPrev7 = prev7.length ? Math.round(prev7.reduce((s, m) => s + (m.energy ?? 55), 0) / prev7.length) : 0;
    const deltaEnergy = prev7.length ? avgEnergy7 - avgEnergyPrev7 : 0;
    const tags = topTags(4).join(', ') || 'Nessuno';
    const html = `<div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
      <div style="font-weight:700; margin-bottom:6px">Energia media (ultimi ${last.length})</div>
      <div style="font-family:var(--font-title); font-size:34px">${avgEnergy}%</div>
    </div>
    <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
      <div style="font-weight:700; margin-bottom:6px">Insight locali</div>
      <div style="font-size:13px; color:var(--dim)">Energia 7 giorni: ${avgEnergy7}% (${deltaEnergy >= 0 ? '+' : ''}${deltaEnergy}% vs settimana precedente)</div>
      <div style="font-size:13px; color:var(--dim); margin-top:6px">Tag piu frequenti: ${tags}</div>
    </div>
    <div>${row('Calmo', counts.calm)}${row('Teso', counts.tense)}${row('Stanco', counts.tired)}${row('Giu', counts.down)}</div>
    <div class="inlineActions" style="margin-top:12px">
      <button class="ghost" id="statsCsv" style="flex:1">Export CSV</button>
      <button class="ghost" id="statsPdf" style="flex:1">Export PDF</button>
    </div>
    <div style="font-size:12px; color:var(--dim)">Dati solo locali. Nessun tracciamento.</div>`;
    await openModal({
      title: 'Statistiche',
      body: 'Uno sguardo gentile.',
      contentHTML: html,
      okText: 'Ok',
      cancelText: 'Chiudi',
    });
    modal?.querySelector('#statsCsv')?.addEventListener('click', () => {
      softClick();
      exportMoodCsv();
    });
    modal?.querySelector('#statsPdf')?.addEventListener('click', () => {
      softClick();
      exportInsightsPdf();
    });
  }

  async function settingsDialog() {
    const html = `
      <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
        <div style="font-weight:700; margin-bottom:10px">Tema</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
          <button class="ghost" data-theme="ember" style="padding:12px">Ember</button>
          <button class="ghost" data-theme="tide" style="padding:12px">Tide</button>
          <button class="ghost" data-theme="meadow" style="padding:12px">Meadow</button>
          <button class="ghost" data-theme="dusk" style="padding:12px">Dusk</button>
        </div>
      </div>
      <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
        <div style="font-weight:700; margin-bottom:10px">Azioni</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
          <button class="ghost" id="sLogout" style="padding:12px">Logout</button>
          <button class="ghost" id="sSound" style="padding:12px">${state.soundEnabled ? 'Audio attivo' : 'Audio disattivo'}</button>
          <button class="ghost" id="sHaptics" style="padding:12px">${state.haptics ? 'Haptics attivi' : 'Haptics disattivi'}</button>
        </div>
        <div style="font-size:12px; color:var(--dim); margin-top:10px">Su iPhone la vibrazione puo essere limitata da iOS.</div>
      </div>
      <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
        <div style="font-weight:700; margin-bottom:10px">Privacy</div>
        <button class="ghost" id="sPin" style="width:100%; padding:12px">${state.pinEnabled ? 'PIN impostato' : 'Imposta PIN'}</button>
        <div style="font-size:12px; color:var(--dim); margin-top:10px">Il PIN cifra localmente umore, note e diario (AES-GCM).</div>
      </div>
      <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; margin-bottom:12px">
        <div style="font-weight:700; margin-bottom:10px">Routine e promemoria</div>
        <button class="ghost" id="sReminders" style="width:100%; padding:12px">${state.remindersEnabled ? 'Promemoria attivi' : 'Promemoria disattivi'}</button>
        <div style="font-size:12px; color:var(--dim); margin-top:10px">I promemoria funzionano solo se l'app e aperta.</div>
        <div style="margin-top:12px; display:grid; gap:10px">
          <div style="background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:10px">
            <div style="font-weight:700; margin-bottom:8px">Mattina</div>
            <div style="display:grid; gap:8px">
              <button class="ghost" id="rMorningToggle" style="padding:10px">${state.routines.morning.enabled ? 'Routine attiva' : 'Routine disattiva'}</button>
              <input id="rMorningTime" type="time" value="${state.routines.morning.time}">
              <input id="rMorningSteps" type="text" value="${state.routines.morning.steps.join(', ')}" placeholder="Passi separati da virgola">
              <button class="ghost" id="rMorningDone" style="padding:10px">Segna completata oggi</button>
            </div>
          </div>
          <div style="background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:10px">
            <div style="font-weight:700; margin-bottom:8px">Sera</div>
            <div style="display:grid; gap:8px">
              <button class="ghost" id="rEveningToggle" style="padding:10px">${state.routines.evening.enabled ? 'Routine attiva' : 'Routine disattiva'}</button>
              <input id="rEveningTime" type="time" value="${state.routines.evening.time}">
              <input id="rEveningSteps" type="text" value="${state.routines.evening.steps.join(', ')}" placeholder="Passi separati da virgola">
              <button class="ghost" id="rEveningDone" style="padding:10px">Segna completata oggi</button>
            </div>
          </div>
        </div>
      </div>
      <div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px">
        <div style="font-weight:700; margin-bottom:10px">Dati</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
          <button class="ghost" id="sExport" style="padding:12px">Export</button>
          <button class="ghost" id="sReset" style="padding:12px">Reset</button>
        </div>
        <div style="font-size:12px; color:var(--dim); margin-top:10px">Reset cancella i dati dell'utente corrente.</div>
      </div>
    `;
    const p = openModal({
      title: 'Impostazioni',
      body: 'Personalizza AURA senza stress.',
      contentHTML: html,
      okText: 'Fatto',
      cancelText: 'Chiudi',
    });
    [...(modal?.querySelectorAll('[data-theme]') || [])].forEach((b) =>
      b.addEventListener('click', async () => {
        softClick();
        state.theme = b.getAttribute('data-theme');
        applyTheme();
        await saveState();
        toast('Tema applicato');
      })
    );
    modal?.querySelector('#sHaptics')?.addEventListener('click', async () => {
      softClick();
      state.haptics = !state.haptics;
      const btn = modal.querySelector('#sHaptics');
      if (btn) btn.textContent = state.haptics ? 'Haptics attivi' : 'Haptics disattivi';
      await saveState();
    });
    modal?.querySelector('#sSound')?.addEventListener('click', async () => {
      softClick();
      state.soundEnabled = !state.soundEnabled;
      const btn = modal.querySelector('#sSound');
      if (btn) btn.textContent = state.soundEnabled ? 'Audio attivo' : 'Audio disattivo';
      if (!state.soundEnabled && audio.on) audioStop();
      await saveState();
    });
    modal?.querySelector('#sReminders')?.addEventListener('click', async () => {
      softClick();
      state.remindersEnabled = !state.remindersEnabled;
      const btn = modal.querySelector('#sReminders');
      if (btn) btn.textContent = state.remindersEnabled ? 'Promemoria attivi' : 'Promemoria disattivi';
      await saveState();
    });
    modal?.querySelector('#rMorningToggle')?.addEventListener('click', async () => {
      softClick();
      state.routines.morning.enabled = !state.routines.morning.enabled;
      const btn = modal.querySelector('#rMorningToggle');
      if (btn) btn.textContent = state.routines.morning.enabled ? 'Routine attiva' : 'Routine disattiva';
      await saveState();
    });
    modal?.querySelector('#rEveningToggle')?.addEventListener('click', async () => {
      softClick();
      state.routines.evening.enabled = !state.routines.evening.enabled;
      const btn = modal.querySelector('#rEveningToggle');
      if (btn) btn.textContent = state.routines.evening.enabled ? 'Routine attiva' : 'Routine disattiva';
      await saveState();
    });
    modal?.querySelector('#rMorningTime')?.addEventListener('change', async (e) => {
      state.routines.morning.time = e.target.value;
      await saveState();
    });
    modal?.querySelector('#rEveningTime')?.addEventListener('change', async (e) => {
      state.routines.evening.time = e.target.value;
      await saveState();
    });
    modal?.querySelector('#rMorningSteps')?.addEventListener('change', async (e) => {
      state.routines.morning.steps = parseSteps(e.target.value);
      await saveState();
    });
    modal?.querySelector('#rEveningSteps')?.addEventListener('change', async (e) => {
      state.routines.evening.steps = parseSteps(e.target.value);
      await saveState();
    });
    modal?.querySelector('#rMorningDone')?.addEventListener('click', async () => {
      softClick();
      state.routines.morning.lastDone = todayKey();
      await saveState();
      toast('Routine mattina completata');
    });
    modal?.querySelector('#rEveningDone')?.addEventListener('click', async () => {
      softClick();
      state.routines.evening.lastDone = todayKey();
      await saveState();
      toast('Routine sera completata');
    });
    modal?.querySelector('#sExport')?.addEventListener('click', () => {
      softClick();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json;charset=utf-8' });
      downloadBlob(blob, `AURA_export_${getCurrentUser() || 'guest'}_${todayKey()}.json`);
      toast('Export creato');
    });
    modal?.querySelector('#sReset')?.addEventListener('click', async () => {
      softClick();
      if (!confirm('Vuoi cancellare TUTTI i dati locali di AURA per questo utente?')) return;
      localStorage.removeItem(STATE_KEY());
      localStorage.removeItem(SEC_KEY());
      localStorage.removeItem(PIN_META());
      sessionPin = null;
      state = defaultState();
      await saveState();
      toast('Reset completato');
      render();
    });
    modal?.querySelector('#sLogout')?.addEventListener('click', () => {
      softClick();
      setCurrentUser('');
      location.reload();
    });
    modal?.querySelector('#sPin')?.addEventListener('click', async () => {
      softClick();
      if (state.pinEnabled) {
        if (!confirm('Vuoi rimuovere il PIN? I dati torneranno in chiaro (sempre locali).')) return;
        state.pinEnabled = false;
        state.lockEnabled = false;
        sessionPin = null;
        setPinMeta({ enabled: false, hash: '' });
        await saveState();
        toast('PIN rimosso');
        render();
        return;
      }
      const html2 = `<div style="background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px">
        <div style="font-weight:700; margin-bottom:10px">Imposta un PIN (4-8 cifre)</div>
        <input id="p1" type="password" inputmode="numeric" maxlength="8" placeholder="PIN" style="margin-bottom:10px">
        <input id="p2" type="password" inputmode="numeric" maxlength="8" placeholder="Ripeti PIN" style="margin-bottom:10px">
        <div style="font-size:12px; color:var(--dim)">Se dimentichi il PIN non potrai decrittare i dati.</div>
      </div>`;
      const ok = await openModal({
        title: 'PIN',
        body: 'Proteggi i contenuti sensibili.',
        contentHTML: html2,
        okText: 'Salva',
        cancelText: 'Annulla',
      });
      if (!ok) return;
      const p1 = (modal?.querySelector('#p1')?.value || '').trim();
      const p2 = (modal?.querySelector('#p2')?.value || '').trim();
      if (!/^\d{4,8}$/.test(p1) || p1 !== p2) {
        toast('PIN non valido o non coincide');
        return;
      }
      sessionPin = p1;
      state.pinEnabled = true;
      state.lockEnabled = true;
      setPinMeta({ enabled: true, hash: await pinHash(p1) });
      await saveState();
      vibrateSuccess();
      successBeep();
      toast('PIN impostato');
      render();
    });
    await p;
  }

  async function runDemo() {
    const steps = [
      { id: 'bMood', text: '1/3 Tocca "Check-in ora" per iniziare.' },
      { id: 'bBreath', text: '2/3 Prova "Respiro".' },
      { id: 'btnAudio', text: '3/3 Attiva "Audio" per un ambiente piu rilassante.' },
    ];
    const hint = $('hint');
    for (const s of steps) {
      if (hint) hint.textContent = s.text;
      const el = $(s.id);
      if (el) {
        el.style.animation = 'pulse 0.5s';
        safeVibrate(18);
      }
      await new Promise((r) => setTimeout(r, 520));
      if (el) el.style.animation = '';
      await new Promise((r) => setTimeout(r, 620));
    }
    if (hint) hint.textContent = 'Demo finita. Ora registra l\'umore di oggi.';
  }

  // ===== AUTH =====
  function setupAuthUI() {
    let mode = 'login';
    const tabLogin = $('authTabLogin');
    const tabReg = $('authTabReg');
    const extra = $('authExtra');
    const hint = $('authHint');
    const authPass = $('authPass');
    const paint = () => {
      const on = mode === 'login';
      if (tabLogin) {
        tabLogin.style.borderColor = on ? 'rgba(245,182,108,.7)' : 'rgba(255,255,255,.14)';
        tabLogin.style.background = on ? 'rgba(245,182,108,.16)' : 'rgba(255,255,255,.06)';
      }
      if (tabReg) {
        tabReg.style.borderColor = !on ? 'rgba(245,182,108,.7)' : 'rgba(255,255,255,.14)';
        tabReg.style.background = !on ? 'rgba(245,182,108,.16)' : 'rgba(255,255,255,.06)';
      }
      if (extra) extra.style.display = mode === 'reg' ? 'block' : 'none';
      if (authPass) authPass.setAttribute('autocomplete', mode === 'reg' ? 'new-password' : 'current-password');
      if (hint)
        hint.textContent = mode === 'reg'
          ? 'Registrazione locale: credenziali solo sul dispositivo.'
          : 'Accesso locale: nessun invio a server.';
    };
    paint();
    tabLogin?.addEventListener('click', () => {
      softClick();
      mode = 'login';
      paint();
    });
    tabReg?.addEventListener('click', () => {
      softClick();
      mode = 'reg';
      paint();
    });
    $('authGuest')?.addEventListener('click', () => {
      softClick();
      setCurrentUser('guest');
      location.reload();
    });
    $('authGo')?.addEventListener('click', async () => {
      softClick();
      const user = normUser($('authUser')?.value);
      const pass = $('authPass')?.value || '';
      if (!user || pass.length < 6) {
        if (hint) hint.textContent = 'Inserisci username/email e password (min 6).';
        safeVibrate([12, 40, 12]);
        return;
      }
      const users = getUsers();
      const existing = users.find((x) => x.user === user);
      if (mode === 'reg') {
        const pass2 = $('authPass2')?.value || '';
        if (pass !== pass2) {
          if (hint) hint.textContent = 'Le password non coincidono.';
          safeVibrate([12, 40, 12]);
          return;
        }
        if (existing) {
          if (hint) hint.textContent = 'Utente gia presente su questo dispositivo.';
          safeVibrate([12, 40, 12]);
          return;
        }
        const { hash, saltB64 } = await pwHash(user, pass, null);
        users.push({ user, hash, saltB64, createdAt: nowISO() });
        setUsers(users);
        setCurrentUser(user);
        toast('Registrato');
        setTimeout(() => location.reload(), 350);
      } else {
        if (!existing) {
          if (hint) hint.textContent = 'Utente non trovato. Usa "Registrati".';
          safeVibrate([12, 40, 12]);
          return;
        }
        const { hash } = await pwHash(user, pass, existing.saltB64);
        if (hash !== existing.hash) {
          if (hint) hint.textContent = 'Password errata.';
          safeVibrate([12, 40, 12]);
          return;
        }
        setCurrentUser(user);
        toast('Accesso OK');
        setTimeout(() => location.reload(), 300);
      }
    });
  }

  // ===== INTRO =====
  function setupIntroUI() {
    $('introStart')?.addEventListener('click', async () => {
      softClick();
      const name = ($('nameInput')?.value || '').trim().slice(0, 24);
      const pin = ($('pinInput')?.value || '').trim();
      state = defaultState();
      state.name = name;
      if (pin) {
        if (!/^\d{4,8}$/.test(pin)) {
          alert('PIN non valido: usa 4-8 cifre.');
          return;
        }
        state.pinEnabled = true;
        state.lockEnabled = true;
        sessionPin = pin;
        setPinMeta({ enabled: true, hash: await pinHash(pin) });
      } else {
        setPinMeta({ enabled: false, hash: '' });
      }
      await saveState();
      const intro = $('intro');
      if (intro) intro.style.display = 'none';
      render();
      setTimeout(runDemo, 450);
    });
    $('introSkip')?.addEventListener('click', async () => {
      softClick();
      state = defaultState();
      setPinMeta({ enabled: false, hash: '' });
      await saveState();
      const intro = $('intro');
      if (intro) intro.style.display = 'none';
      render();
      setTimeout(runDemo, 450);
    });
  }

  // ===== LOCK =====
  function setupLockUI() {
    $('unlockBtn')?.addEventListener('click', async () => {
      softClick();
      const pin = ($('unlockPin')?.value || '').trim();
      const meta = getPinMeta();
      if (!meta?.enabled) {
        const lock = $('lock');
        if (lock) lock.style.display = 'none';
        return;
      }
      if (!/^\d{4,8}$/.test(pin)) {
        const hint = $('lockHint');
        if (hint) hint.textContent = 'PIN non valido.';
        safeVibrate([12, 40, 12]);
        return;
      }
      if ((await pinHash(pin)) !== meta.hash) {
        const hint = $('lockHint');
        if (hint) hint.textContent = 'PIN errato.';
        safeVibrate([12, 40, 12]);
        return;
      }
      sessionPin = pin;
      try {
        state = normalizeState(await loadState());
        audio.env = state.audio?.env || 'forest';
        audio.vol = state.audio?.vol ?? 0.4;
        const lock = $('lock');
        if (lock) lock.style.display = 'none';
        vibrateSuccess();
        successBeep();
        toast('Sbloccato');
        render();
        setupRoutineReminders();
      } catch (e) {
        const hint = $('lockHint');
        if (hint) hint.textContent = 'Impossibile decrittare i dati.';
      }
    });
  }

  // ===== ROUTINE REMINDERS =====
  let reminderTimer = null;

  function checkRoutineReminder() {
    if (!state.remindersEnabled) return;
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const today = todayKey();
    const routines = [
      { key: 'morning', label: 'Routine mattina' },
      { key: 'evening', label: 'Routine sera' },
    ];
    routines.forEach(({ key, label }) => {
      const routine = state.routines[key];
      if (!routine?.enabled) return;
      if (routine.time !== time) return;
      if (state.routines.lastReminder[key] === today) return;
      if (routine.lastDone === today) return;
      state.routines.lastReminder[key] = today;
      saveState().catch(() => {});
      toast(`${label}: e il tuo momento`);
      vibratePulse();
    });
  }

  function setupRoutineReminders() {
    if (reminderTimer) clearInterval(reminderTimer);
    reminderTimer = setInterval(checkRoutineReminder, 60000);
    checkRoutineReminder();
  }

  // ===== EVENTS =====
  $('elfWrap')?.addEventListener('click', () => {
    softClick();
    vibratePulse();
    const elf = $('elfWrap');
    if (elf) {
      elf.classList.add('happy');
      setTimeout(() => elf.classList.remove('happy'), 520);
    }
    const last = state.moods[state.moods.length - 1];
    const mood = last ? last.mood : 'calm';
    const a = advice[mood] || advice.calm;
    const hint = $('hint');
    if (hint) hint.textContent = a[Math.floor(Math.random() * a.length)];
  });

  $('bMood')?.addEventListener('click', async () => {
    softClick();
    await moodDialog();
  });
  $('bBreath')?.addEventListener('click', async () => {
    softClick();
    await breathDialog();
  });
  $('bAdvice')?.addEventListener('click', async () => {
    softClick();
    await adviceDialog();
  });
  $('bJournal')?.addEventListener('click', async () => {
    softClick();
    await journalDialog();
  });
  $('bJourney')?.addEventListener('click', async () => {
    softClick();
    await journeyDialog();
  });
  $('bHelp')?.addEventListener('click', async () => {
    softClick();
    await runDemo();
  });

  $('btnStats')?.addEventListener('click', async () => {
    softClick();
    await statsDialog();
  });
  $('btnSettings')?.addEventListener('click', async () => {
    softClick();
    await settingsDialog();
  });

  $('btnLock')?.addEventListener('click', async () => {
    softClick();
    const meta = getPinMeta();
    if (meta?.enabled) {
      state.lockEnabled = !state.lockEnabled;
      await saveState();
      render();
      toast(state.lockEnabled ? 'Blocco attivo (al prossimo avvio chiede PIN).' : 'Blocco disattivato.');
      safeVibrate(state.lockEnabled ? [10, 20, 10] : 12);
    } else {
      toast('Imposta un PIN da Impostazioni per proteggere i dati.');
      safeVibrate([12, 40, 12]);
    }
  });

  const audioPanel = $('audioPanel');
  $('btnAudio')?.addEventListener('click', () => {
    softClick();
    if (audioPanel) audioPanel.classList.toggle('open');
    safeVibrate(10);
  });
  $('audioClose')?.addEventListener('click', () => {
    softClick();
    if (audioPanel) audioPanel.classList.remove('open');
  });
  $('audioToggle')?.addEventListener('click', async () => {
    softClick();
    if (audio.on) audioStop();
    else await audioStart();
    state.audio.on = audio.on;
    await saveState();
  });
  $('audioEnv')?.addEventListener('change', async (e) => {
    softClick();
    audio.env = e.target.value;
    if (audio.on) await audioStart();
    state.audio.env = audio.env;
    await saveState();
  });
  $('audioVol')?.addEventListener('input', async (e) => {
    audio.vol = clamp(Number(e.target.value) / 100, 0.05, 1);
    const volLbl = $('volLbl');
    if (volLbl) volLbl.textContent = Math.round(audio.vol * 100) + '%';
    if (audio.ctx && audio.master) {
      const t = audio.ctx.currentTime;
      try {
        audio.master.gain.cancelScheduledValues(t);
      } catch (err) {}
      try {
        audio.master.gain.setValueAtTime(Math.max(0.0001, audio.master.gain.value), t);
      } catch (err) {}
      try {
        audio.master.gain.exponentialRampToValueAtTime(audio.vol, t + 0.15);
      } catch (err) {}
    }
    state.audio.vol = audio.vol;
    await saveState();
    setAudioUI();
  });

  setTime();
  setInterval(setTime, 15000);

  // ===== BOOT =====
  async function boot() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./sw.js');
      } catch (e) {}
    }

    const user = getCurrentUser();
    if (!user) {
      const auth = $('auth');
      if (auth) auth.style.display = 'block';
      setupAuthUI();
      return;
    }

    const hasState = !!localStorage.getItem(STATE_KEY());
    if (!hasState) {
      const intro = $('intro');
      if (intro) intro.style.display = 'block';
      setupIntroUI();
      return;
    }

    const meta = getPinMeta();
    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(STATE_KEY()) || 'null');
    } catch (e) {}
    if (meta?.enabled && parsed?.enc) {
      const lock = $('lock');
      if (lock) lock.style.display = 'block';
      setupLockUI();
      return;
    }

    sessionPin = null;
    state = normalizeState(await loadState().catch(() => defaultState()));
    audio.env = state.audio?.env || 'forest';
    audio.vol = state.audio?.vol ?? 0.4;
    audio.on = false;
    const mainUI = $('main-ui');
    if (mainUI) mainUI.classList.remove('hidden');
    render();
    setupRoutineReminders();
  }

  boot().catch(() => {});
})();
