/**
 * Configurazione app
 */

export const APP_CONFIG = {
  name: 'AURA Zen',
  version: '2.0.0',
  storageKey: 'aura_zen_v2',
  defaultTheme: 'light',
  features: {
    notifications: true,
    darkMode: true,
    haptics: true,
    sounds: true
  }
};

export const DEFAULT_STATE = {
  version: 2,
  profile: {
    name: '',
    email: '',
    goal: 'Calma',
    theme: 'light',
    onboarded: false,
    settings: {
      notifications: true,
      sound: true,
      haptics: true,
      reminders: true,
      reminderTime: '09:00'
    }
  },
  pet: {
    level: 1,
    mood: 6,
    energy: 6,
    happiness: 6,
    streak: 0,
    lastCheckInDay: null,
    totalCheckIns: 0,
    experience: 0
  },
  checkins: [],
  journal: [],
  stats: {
    totalBreathingSessions: 0,
    totalJournalEntries: 0,
    longestStreak: 0
  }
};

export const PET_LEVELS = [
  { level: 1, name: 'Seme', minExp: 0, maxExp: 10 },
  { level: 2, name: 'Germoglio', minExp: 10, maxExp: 30 },
  { level: 3, name: 'Fiore', minExp: 30, maxExp: 60 },
  { level: 4, name: 'Albero', minExp: 60, maxExp: 100 },
  { level: 5, name: 'Foresta', minExp: 100, maxExp: Infinity }
];

export const GOALS = [
  { id: 'calma', label: 'Calma', icon: '🧘', color: '#22c55e' },
  { id: 'focus', label: 'Focus', icon: '🎯', color: '#3b82f6' },
  { id: 'gentilezza', label: 'Gentilezza', icon: '💚', color: '#ec4899' },
  { id: 'sonno', label: 'Sonno', icon: '😴', color: '#8b5cf6' }
];

export const BREATH_PATTERNS = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Inspira-Trattieni-Espira-Trattieni (4-4-4-4)',
    pattern: [
      { phase: 'Inspira', duration: 4 },
      { phase: 'Trattieni', duration: 4 },
      { phase: 'Espira', duration: 4 },
      { phase: 'Trattieni', duration: 4 }
    ]
  },
  {
    id: 'calm',
    name: 'Respiro Calmante',
    description: 'Inspira-Pausa-Espira lenta (4-2-6)',
    pattern: [
      { phase: 'Inspira', duration: 4 },
      { phase: 'Pausa', duration: 2 },
      { phase: 'Espira', duration: 6 }
    ]
  },
  {
    id: 'energy',
    name: 'Respiro Energizzante',
    description: 'Inspira-Trattieni-Espira veloce (4-4-2)',
    pattern: [
      { phase: 'Inspira', duration: 4 },
      { phase: 'Trattieni', duration: 4 },
      { phase: 'Espira', duration: 2 }
    ]
  }
];
