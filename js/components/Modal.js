/**
 * Modal - Dialog modale
 */
import { Component } from '../core/Component.js';

export class Modal extends Component {
  constructor() {
    super(document.body);
    this.isOpen = false;
    this.backdrop = null;
    this.modal = null;
  }

  open(options) {
    if (this.isOpen) return;

    const {
      title = '',
      content = '',
      actions = [],
      onClose = null
    } = options;

    this.isOpen = true;
    this.onClose = onClose;

    // Crea backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    this.backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h2 id="modal-title" class="card-title">${title}</h2>
          <button class="btn btn-ghost btn-icon modal-close" aria-label="Chiudi">×</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${actions.length ? `
          <div class="modal-footer flex gap-3 justify-end">
            ${actions.map(action => `
              <button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" data-action="${action.id}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(this.backdrop);
    this.modal = this.backdrop.querySelector('.modal');

    // Event listeners
    this.backdrop.querySelector('.modal-close')?.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    actions.forEach(action => {
      const btn = this.backdrop.querySelector(`[data-action="${action.id}"]`);
      btn?.addEventListener('click', () => {
        if (action.onClick) action.onClick();
        if (!action.keepOpen) this.close();
      });
    });

    // Trap focus
    this.trapFocus();

    // Animazione
    requestAnimationFrame(() => {
      this.backdrop.classList.add('modal-backdrop-show');
    });
  }

  close() {
    if (!this.isOpen) return;

    this.backdrop.classList.remove('modal-backdrop-show');

    setTimeout(() => {
      this.backdrop?.remove();
      this.backdrop = null;
      this.modal = null;
      this.isOpen = false;

      if (this.onClose) this.onClose();
    }, 300);
  }

  trapFocus() {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });

    firstElement?.focus();
  }
}
