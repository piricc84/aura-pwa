/**
 * StateManager - Gestione centralizzata dello stato con observers
 */
export class StateManager {
  constructor(key, defaultState) {
    this.storageKey = key;
    this.defaultState = defaultState;
    this.state = this.load();
    this.observers = new Map();
    this.history = [];
    this.maxHistory = 50;
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return this.deepClone(this.defaultState);

      const parsed = JSON.parse(raw);
      return this.migrate(this.merge(this.defaultState, parsed));
    } catch (error) {
      console.error('State load error:', error);
      return this.deepClone(this.defaultState);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      return true;
    } catch (error) {
      console.error('State save error:', error);
      return false;
    }
  }

  get(path) {
    if (!path) return this.state;
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  set(path, value, silent = false) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state);

    const oldValue = target[lastKey];
    target[lastKey] = value;

    this.addToHistory(path, oldValue, value);

    if (this.save() && !silent) {
      this.notify(path, value, oldValue);
    }
  }

  update(path, updater) {
    const current = this.get(path);
    const newValue = updater(current);
    this.set(path, newValue);
  }

  subscribe(path, callback) {
    if (!this.observers.has(path)) {
      this.observers.set(path, new Set());
    }
    this.observers.get(path).add(callback);

    return () => this.unsubscribe(path, callback);
  }

  unsubscribe(path, callback) {
    this.observers.get(path)?.delete(callback);
  }

  notify(path, newValue, oldValue) {
    this.observers.get(path)?.forEach(cb => cb(newValue, oldValue));
    this.observers.get('*')?.forEach(cb => cb(path, newValue, oldValue));
  }

  addToHistory(path, oldValue, newValue) {
    this.history.push({
      timestamp: new Date().toISOString(),
      path,
      oldValue,
      newValue
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  reset() {
    this.state = this.deepClone(this.defaultState);
    this.history = [];
    this.save();
    this.notify('*', this.state);
  }

  export() {
    return {
      version: this.state.version || 1,
      exportDate: new Date().toISOString(),
      data: this.state
    };
  }

  import(data) {
    try {
      const imported = typeof data === 'string' ? JSON.parse(data) : data;
      this.state = this.migrate(this.merge(this.defaultState, imported.data || imported));
      this.save();
      this.notify('*', this.state);
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  migrate(state) {
    const version = state.version || 1;

    if (version < 2) {
      // Esempio migrazione
      if (state.pet && !state.pet.happiness) {
        state.pet.happiness = state.pet.mood;
      }
    }

    state.version = 2;
    return state;
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  merge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}
