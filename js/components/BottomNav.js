/**
 * BottomNav - Navigazione inferiore
 */
import { Component } from '../core/Component.js';

export class BottomNav extends Component {
  constructor(container, routes) {
    super(container);
    this.routes = routes;
    this.currentRoute = null;
  }

  render() {
    this.container.innerHTML = `
      <nav class="bottom-nav" role="navigation" aria-label="Navigazione principale">
        ${this.routes.map(route => `
          <a
            href="#${route.path}"
            class="bottom-nav-item ${this.currentRoute === route.path ? 'bottom-nav-item-active' : ''}"
            data-route="${route.path}"
            aria-label="${route.label}"
            aria-current="${this.currentRoute === route.path ? 'page' : 'false'}"
          >
            <svg class="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${this.getIcon(route.icon)}
            </svg>
            <span>${route.label}</span>
          </a>
        `).join('')}
      </nav>
    `;

    this.attachListeners();
  }

  attachListeners() {
    this.container.querySelectorAll('.bottom-nav-item').forEach(item => {
      this.addEventListener(item, 'click', (e) => {
        const route = e.currentTarget.dataset.route;
        this.setActive(route);
      });
    });
  }

  setActive(route) {
    this.currentRoute = route;
    this.container.querySelectorAll('.bottom-nav-item').forEach(item => {
      const isActive = item.dataset.route === route;
      item.classList.toggle('bottom-nav-item-active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  getIcon(name) {
    const icons = {
      home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
      checkin: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
      breath: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"></path><path d="M12 8v8M8 12h8"></path>',
      journal: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
      profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
      insights: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
      settings: '<circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"></path>'
    };
    return icons[name] || icons.home;
  }
}
