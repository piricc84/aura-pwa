/**
 * Component - Base class per componenti riutilizzabili
 */
export class Component {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.state = {};
    this.listeners = [];
    this.children = [];
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  render() {
    throw new Error('render() must be implemented');
  }

  mount() {
    this.render();
    this.afterMount();
  }

  afterMount() {
    // Override per logica post-mount
  }

  unmount() {
    this.removeAllListeners();
    this.children.forEach(child => child.unmount?.());
    this.children = [];
    this.beforeUnmount();
  }

  beforeUnmount() {
    // Override per cleanup
  }

  addEventListener(element, event, handler) {
    const el = typeof element === 'string'
      ? this.container.querySelector(element)
      : element;

    if (el) {
      el.addEventListener(event, handler);
      this.listeners.push({ element: el, event, handler });
    }
  }

  removeAllListeners() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }

  emit(eventName, detail) {
    const event = new CustomEvent(eventName, { detail, bubbles: true });
    this.container.dispatchEvent(event);
  }

  on(eventName, handler) {
    this.container.addEventListener(eventName, handler);
    this.listeners.push({
      element: this.container,
      event: eventName,
      handler
    });
  }

  html(strings, ...values) {
    return strings.reduce((result, string, i) => {
      const value = values[i] ?? '';
      return result + string + this.escapeHtml(value);
    }, '');
  }

  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
