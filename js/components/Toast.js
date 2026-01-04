/**
 * Toast - Sistema notifiche toast
 */
import { fadeIn, fadeOut } from '../utils/helpers.js';

export class Toast {
  constructor() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:9999;';
      document.body.appendChild(this.container);
    }
    this.queue = [];
    this.isShowing = false;
  }

  show(message, type = 'info', duration = 3000) {
    this.queue.push({ message, type, duration });
    if (!this.isShowing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const { message, type, duration } = this.queue.shift();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    // Animazione entrata
    await fadeIn(toast, 300).finished;
    toast.classList.add('toast-show');

    // Attendi durata
    await new Promise(resolve => setTimeout(resolve, duration));

    // Animazione uscita
    toast.classList.remove('toast-show');
    await fadeOut(toast, 300).finished;

    toast.remove();

    // Processa prossimo
    this.processQueue();
  }

  success(message, duration) {
    this.show(message, 'success', duration);
  }

  error(message, duration) {
    this.show(message, 'error', duration);
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }

  info(message, duration) {
    this.show(message, 'info', duration);
  }
}

// Singleton
export const toast = new Toast();
