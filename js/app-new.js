/**
 * AURA Zen - Main Application v2.0
 */

import { StateManager } from './core/StateManager.js';
import { Router } from './core/Router.js';
import { BottomNav } from './components/BottomNav.js';
import { toast } from './components/Toast.js';
import { APP_CONFIG, DEFAULT_STATE } from './config.js';

// Import pages
import { OnboardingPage } from './modules/OnboardingPage.js';
import { LoginPage } from './modules/LoginPage.js';
import { HomePage } from './modules/HomePage.js';
import { CheckInPage } from './modules/CheckInPage.js';
import { BreathPage } from './modules/BreathPage.js';
import { JournalPage } from './modules/JournalPage.js';
import { InsightsPage } from './modules/InsightsPage.js';
import { ProfilePage } from './modules/ProfilePage.js';
import { SettingsPage } from './modules/SettingsPage.js';

class App {
  constructor() {
    this.state = new StateManager(APP_CONFIG.storageKey, DEFAULT_STATE);
    this.router = new Router();
    this.bottomNav = null;
    this.currentPage = null;

    this.init();
  }

  init() {
    // Applica tema
    this.applyTheme();

    // Observer tema
    this.state.subscribe('profile.theme', (theme) => {
      this.applyTheme(theme);
    });

    // Inizializza router
    this.setupRouter();

    // Inizializza bottom nav
    this.setupBottomNav();

    // Router hooks
    this.setupRouterHooks();

    // Service Worker
    this.registerServiceWorker();

    // Richiedi permessi notifiche se abilitato
    if (this.state.get('profile.settings.notifications')) {
      this.requestNotificationPermission();
    }

    // Avvia app
    this.router.start();
  }

  setupRouter() {
    this.router.registerMultiple({
      '/': async () => this.renderPage(OnboardingPage),
      '/login': async () => this.renderPage(LoginPage),
      '/home': async () => this.renderPage(HomePage),
      '/checkin': async () => this.renderPage(CheckInPage),
      '/breath': async () => this.renderPage(BreathPage),
      '/journal': async () => this.renderPage(JournalPage),
      '/insights': async () => this.renderPage(InsightsPage),
      '/profile': async () => this.renderPage(ProfilePage),
      '/settings': async () => this.renderPage(SettingsPage)
    });
  }

  setupRouterHooks() {
    // Before navigation
    this.router.beforeEach((to, from) => {
      const onboarded = this.state.get('profile.onboarded');
      const hasName = this.state.get('profile.name');

      // Redirect to onboarding if not completed
      if (!onboarded && to !== '/') {
        this.router.replace('/');
        return false;
      }

      // Redirect to login if no name
      if (onboarded && !hasName && to !== '/login' && to !== '/') {
        this.router.replace('/login');
        return false;
      }

      return true;
    });

    // After navigation
    this.router.afterEach((to) => {
      // Update bottom nav
      const mainRoutes = ['/home', '/checkin', '/breath', '/journal', '/profile'];
      if (mainRoutes.includes(to)) {
        this.bottomNav?.setActive(to);
      }

      // Scroll to top
      window.scrollTo(0, 0);

      // Update page title
      document.title = this.getPageTitle(to);
    });

    // Error handler
    this.router.onError((error) => {
      console.error('Router error:', error);
      toast.error('Si è verificato un errore. Riprova.');
    });
  }

  setupBottomNav() {
    const navRoutes = [
      { path: '/home', label: 'Casa', icon: 'home' },
      { path: '/checkin', label: 'Check-in', icon: 'checkin' },
      { path: '/breath', label: 'Respiro', icon: 'breath' },
      { path: '/journal', label: 'Diario', icon: 'journal' },
      { path: '/profile', label: 'Profilo', icon: 'profile' }
    ];

    this.bottomNav = new BottomNav('#bottom-nav', navRoutes);
    this.bottomNav.render();
  }

  async renderPage(PageClass) {
    // Cleanup pagina precedente
    if (this.currentPage?.unmount) {
      this.currentPage.unmount();
    }

    // Crea nuova pagina
    this.currentPage = new PageClass('#view', this.state, this.router);

    // Render
    if (this.currentPage.mount) {
      await this.currentPage.mount();
    } else {
      this.currentPage.render();
    }

    // Attach cleanup
    if (this.currentPage.render) {
      this.router.routes.get(this.router.currentRoute?.path).cleanup = () => {
        this.currentPage.unmount?.();
      };
    }
  }

  applyTheme(theme) {
    theme = theme || this.state.get('profile.theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0f172a' : '#22c55e');
    }
  }

  getPageTitle(route) {
    const titles = {
      '/': 'Benvenuto - AURA Zen',
      '/login': 'Accesso - AURA Zen',
      '/home': 'Casa - AURA Zen',
      '/checkin': 'Check-in - AURA Zen',
      '/breath': 'Respiro - AURA Zen',
      '/journal': 'Diario - AURA Zen',
      '/insights': 'Insights - AURA Zen',
      '/profile': 'Profilo - AURA Zen',
      '/settings': 'Impostazioni - AURA Zen'
    };
    return titles[route] || 'AURA Zen';
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

// Avvia app quando DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
