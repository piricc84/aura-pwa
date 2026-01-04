/**
 * Utilities e helpers
 */

// Selettori DOM
export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

// Date utilities
export const nowISO = () => new Date().toISOString();
export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (format === 'short') return d.toLocaleDateString('it-IT');
  if (format === 'long') return d.toLocaleDateString('it-IT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  if (format === 'time') return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('it-IT');
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    anno: 31536000,
    mese: 2592000,
    settimana: 604800,
    giorno: 86400,
    ora: 3600,
    minuto: 60
  };

  for (const [name, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `${interval} ${name}${interval > 1 ? 'i' : ''} fa`;
    }
  }
  return 'proprio ora';
};

// Validazione
export const validators = {
  required: (value, message = 'Campo obbligatorio') =>
    value?.toString().trim() ? null : message,

  minLength: (min, message) => (value) =>
    value?.length >= min ? null : message || `Minimo ${min} caratteri`,

  maxLength: (max, message) => (value) =>
    value?.length <= max ? null : message || `Massimo ${max} caratteri`,

  range: (min, max, message) => (value) => {
    const num = Number(value);
    return num >= min && num <= max ? null : message || `Valore tra ${min} e ${max}`;
  },

  email: (value, message = 'Email non valida') =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message
};

export const validate = (value, validatorList) => {
  for (const validator of validatorList) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};

// Debounce & Throttle
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, delay = 300) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn(...args);
    }
  };
};

// Animazioni
export const animate = (element, keyframes, options = {}) => {
  return element.animate(keyframes, {
    duration: 300,
    easing: 'ease-out',
    fill: 'forwards',
    ...options
  });
};

export const fadeIn = (element, duration = 300) => {
  return animate(element, [
    { opacity: 0, transform: 'translateY(10px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration });
};

export const fadeOut = (element, duration = 300) => {
  return animate(element, [
    { opacity: 1 },
    { opacity: 0 }
  ], { duration });
};

// Vibrazione
export const vibrate = (pattern = [10], enabled = true) => {
  if (enabled && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// Notifiche
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-192.png',
      ...options
    });
  }
};

// Storage helpers
export const storage = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};

// Number formatting
export const formatNumber = (num, decimals = 1) => {
  if (num === null || Number.isNaN(num)) return '-';
  return Number(num).toFixed(decimals);
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Random
export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const randomChoice = (array) => array[randomInt(0, array.length - 1)];

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = typeof key === 'function' ? key(item) : item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  });
};

// Download helpers
export const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
};

export const downloadCSV = (data, filename) => {
  const csv = arrayToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, filename);
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const arrayToCSV = (data) => {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(h => JSON.stringify(obj[h] ?? '')));
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

// Color utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};
