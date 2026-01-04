/**
 * BasePage - Classe base per tutte le pagine
 */
import { Component } from '../core/Component.js';

export class BasePage extends Component {
  constructor(container, state, router) {
    super(container);
    this.state = state;
    this.router = router;
  }

  renderHeader(title, subtitle = '', actions = []) {
    return `
      <header class="card mb-6 animate-fade-in">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold mb-2">${title}</h1>
            ${subtitle ? `<p class="text-secondary text-sm">${subtitle}</p>` : ''}
          </div>
          ${actions.length ? `
            <div class="flex gap-2">
              ${actions.map(action => `
                <button
                  class="btn ${action.variant || 'btn-ghost'} btn-icon"
                  data-action="${action.id}"
                  aria-label="${action.label}"
                >
                  ${action.icon}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </header>
    `;
  }

  renderCard(options) {
    const {
      title = '',
      subtitle = '',
      content = '',
      actions = [],
      variant = '',
      className = ''
    } = options;

    return `
      <div class="card ${variant} ${className} mb-4 animate-slide-up">
        ${title ? `
          <div class="card-header flex items-start justify-between">
            <div>
              <h3 class="card-title">${title}</h3>
              ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}
            </div>
            ${actions.filter(a => a.position === 'header').map(action => `
              <button
                class="btn ${action.variant || 'btn-ghost'} btn-sm"
                data-action="${action.id}"
              >
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
        <div class="card-body">
          ${content}
        </div>
        ${actions.filter(a => !a.position || a.position === 'footer').length ? `
          <div class="card-footer flex gap-3 justify-end">
            ${actions.filter(a => !a.position || a.position === 'footer').map(action => `
              <button
                class="btn ${action.variant || 'btn-primary'} ${action.block ? 'btn-block' : ''}"
                data-action="${action.id}"
              >
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderStats(stats) {
    return `
      <div class="grid grid-cols-2 gap-4 mb-6">
        ${stats.map(stat => `
          <div class="stat-card animate-slide-up">
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
            ${stat.change ? `
              <div class="stat-change ${stat.change > 0 ? 'stat-change-positive' : 'stat-change-negative'}">
                ${stat.change > 0 ? '↑' : '↓'} ${Math.abs(stat.change).toFixed(1)}%
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderFormGroup(options) {
    const {
      label = '',
      id = '',
      type = 'text',
      value = '',
      placeholder = '',
      required = false,
      error = '',
      helper = '',
      options: selectOptions = []
    } = options;

    let inputHTML = '';

    if (type === 'textarea') {
      inputHTML = `
        <textarea
          id="${id}"
          class="form-textarea ${error ? 'border-error' : ''}"
          placeholder="${placeholder}"
          ${required ? 'required' : ''}
        >${value}</textarea>
      `;
    } else if (type === 'select') {
      inputHTML = `
        <select id="${id}" class="form-select ${error ? 'border-error' : ''}" ${required ? 'required' : ''}>
          ${selectOptions.map(opt => `
            <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
      `;
    } else if (type === 'range') {
      inputHTML = `
        <input
          type="range"
          id="${id}"
          class="form-range"
          min="${options.min || 0}"
          max="${options.max || 10}"
          value="${value}"
          ${required ? 'required' : ''}
        />
        <div class="range-labels">
          <span>${options.leftLabel || ''}</span>
          <span id="${id}-value" class="font-semibold">${value}</span>
          <span>${options.rightLabel || ''}</span>
        </div>
      `;
    } else {
      inputHTML = `
        <input
          type="${type}"
          id="${id}"
          class="form-input ${error ? 'border-error' : ''}"
          placeholder="${placeholder}"
          value="${value}"
          ${required ? 'required' : ''}
        />
      `;
    }

    return `
      <div class="form-group">
        ${label ? `<label for="${id}" class="form-label ${required ? 'form-label-required' : ''}">${label}</label>` : ''}
        ${inputHTML}
        ${error ? `<span class="form-error">${error}</span>` : ''}
        ${helper ? `<span class="form-helper">${helper}</span>` : ''}
      </div>
    `;
  }

  renderChips(chips, activeId = null) {
    return `
      <div class="flex flex-wrap gap-2">
        ${chips.map(chip => `
          <button
            class="chip ${chip.id === activeId ? 'chip-active' : ''}"
            data-chip="${chip.id}"
          >
            ${chip.icon ? `<span>${chip.icon}</span>` : ''}
            ${chip.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  bindActions(actions) {
    actions.forEach(action => {
      const elements = this.container.querySelectorAll(`[data-action="${action.id}"]`);
      elements.forEach(el => {
        this.addEventListener(el, 'click', (e) => {
          e.preventDefault();
          action.onClick(e);
        });
      });
    });
  }

  bindChips(onChange) {
    const chips = this.container.querySelectorAll('[data-chip]');
    chips.forEach(chip => {
      this.addEventListener(chip, 'click', (e) => {
        const chipId = e.currentTarget.dataset.chip;
        // Remove active from all
        chips.forEach(c => c.classList.remove('chip-active'));
        // Add active to clicked
        e.currentTarget.classList.add('chip-active');
        onChange(chipId);
      });
    });
  }

  bindRangeInputs() {
    const ranges = this.container.querySelectorAll('input[type="range"]');
    ranges.forEach(range => {
      const valueDisplay = this.container.querySelector(`#${range.id}-value`);
      if (valueDisplay) {
        const updateValue = () => {
          valueDisplay.textContent = range.value;
        };
        this.addEventListener(range, 'input', updateValue);
        updateValue();
      }
    });
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="flex items-center justify-center" style="min-height: 60vh;">
        <div class="spinner"></div>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="alert alert-error">
        <strong>Errore:</strong> ${message}
      </div>
    `;
  }
}
