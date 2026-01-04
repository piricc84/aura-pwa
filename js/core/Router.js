/**
 * Router - SPA routing con transizioni e lifecycle hooks
 */
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeHooks = [];
    this.afterHooks = [];
    this.errorHandler = null;
  }

  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  registerMultiple(routes) {
    Object.entries(routes).forEach(([path, handler]) => {
      this.register(path, handler);
    });
    return this;
  }

  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  onError(handler) {
    this.errorHandler = handler;
    return this;
  }

  async navigate(path, data = {}) {
    const route = this.routes.get(path);

    if (!route) {
      console.warn(`Route not found: ${path}`);
      return this.handleError(new Error(`Route not found: ${path}`));
    }

    // Before hooks
    for (const hook of this.beforeHooks) {
      const result = await hook(path, this.currentRoute);
      if (result === false) return; // Blocca navigazione
    }

    try {
      // Cleanup route precedente
      if (this.currentRoute?.cleanup) {
        await this.currentRoute.cleanup();
      }

      // Esegui nuova route
      await route(data);

      this.currentRoute = { path, handler: route, cleanup: route.cleanup };

      // After hooks
      for (const hook of this.afterHooks) {
        await hook(path);
      }

      // Aggiorna hash
      if (location.hash !== `#${path}`) {
        location.hash = path;
      }

    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error('Router error:', error);
    if (this.errorHandler) {
      this.errorHandler(error);
    }
  }

  start() {
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1) || '/';
      this.navigate(hash);
    });

    // Navigazione iniziale
    const initialRoute = location.hash.slice(1) || '/';
    this.navigate(initialRoute);
  }

  push(path) {
    location.hash = path;
  }

  replace(path) {
    history.replaceState(null, '', `#${path}`);
    this.navigate(path);
  }

  back() {
    history.back();
  }
}
