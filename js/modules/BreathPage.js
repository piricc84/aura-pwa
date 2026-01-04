/**
 * BreathPage - Esercizi di respirazione guidata
 */
import { BasePage } from './BasePage.js';
import { toast } from '../components/Toast.js';
import { vibrate } from '../utils/helpers.js';
import { BREATH_PATTERNS } from '../config.js';

export class BreathPage extends BasePage {
  constructor(container, state, router) {
    super(container, state, router);
    this.timer = null;
    this.currentPhase = 0;
    this.totalTime = 0;
    this.currentPattern = BREATH_PATTERNS[0];
  }

  render() {
    const hapticsEnabled = this.state.get('profile.settings.haptics');

    this.container.innerHTML = `
      ${this.renderHeader(
        'Respiro Guidato',
        'Scegli un pattern e inizia'
      )}

      <!-- Pattern Selection -->
      ${this.renderCard({
        title: 'Scegli il pattern',
        content: `
          <div class="space-y-3">
            ${BREATH_PATTERNS.map((pattern, idx) => `
              <button
                class="btn ${idx === 0 ? 'btn-primary' : 'btn-outline'} btn-block text-left"
                data-pattern="${pattern.id}"
                style="justify-content:flex-start;"
              >
                <div>
                  <div class="font-bold">${pattern.name}</div>
                  <div class="text-xs opacity-75">${pattern.description}</div>
                </div>
              </button>
            `).join('')}
          </div>
        `
      })}

      <!-- Breathing Display -->
      <div class="card card-gradient text-center mb-4 animate-fade-in">
        <div class="py-12">
          <div id="breathPhase" class="text-4xl font-bold mb-4">Pronto</div>
          <div id="breathTimer" class="text-6xl font-bold mb-8">60s</div>
          <div class="flex gap-3 justify-center">
            <button class="btn btn-outline" id="startBreath" data-action="start">
              ▶ Inizia
            </button>
            <button class="btn btn-ghost" id="stopBreath" data-action="stop" style="display:none;">
              ⏹ Stop
            </button>
          </div>
        </div>

        <!-- Visual Circle Animation -->
        <div class="breath-circle" id="breathCircle" style="width:120px;height:120px;margin:20px auto;border-radius:50%;background:rgba(255,255,255,0.3);transform:scale(1);transition:transform 4s ease-in-out;"></div>
      </div>

      <!-- Settings -->
      ${this.renderCard({
        title: 'Impostazioni',
        content: `
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">Feedback aptico</div>
              <div class="text-xs text-secondary">Vibrazione durante le fasi</div>
            </div>
            <button class="btn btn-sm ${hapticsEnabled ? 'btn-primary' : 'btn-ghost'}" data-action="toggle-haptics">
              ${hapticsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        `
      })}
    `;

    this.bindPatternSelection();
    this.bindBreathingControls();

    this.bindActions([
      {
        id: 'toggle-haptics',
        onClick: () => this.toggleHaptics()
      }
    ]);
  }

  bindPatternSelection() {
    const buttons = this.container.querySelectorAll('[data-pattern]');
    buttons.forEach(btn => {
      this.addEventListener(btn, 'click', (e) => {
        // Remove active from all
        buttons.forEach(b => b.classList.replace('btn-primary', 'btn-outline'));
        // Add to clicked
        e.currentTarget.classList.replace('btn-outline', 'btn-primary');

        const patternId = e.currentTarget.dataset.pattern;
        this.currentPattern = BREATH_PATTERNS.find(p => p.id === patternId);
        toast.info(`Pattern: ${this.currentPattern.name}`);
      });
    });
  }

  bindBreathingControls() {
    this.bindActions([
      { id: 'start', onClick: () => this.startBreathing() },
      { id: 'stop', onClick: () => this.stopBreathing() }
    ]);
  }

  startBreathing() {
    if (this.timer) return;

    const startBtn = document.getElementById('startBreath');
    const stopBtn = document.getElementById('stopBreath');

    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';

    this.totalTime = 60; // 60 secondi
    this.currentPhase = 0;

    this.breathingCycle();
  }

  breathingCycle() {
    const phaseEl = document.getElementById('breathPhase');
    const timerEl = document.getElementById('breathTimer');
    const circleEl = document.getElementById('breathCircle');

    const pattern = this.currentPattern.pattern;
    const phase = pattern[this.currentPhase];

    // Update UI
    phaseEl.textContent = phase.phase;
    timerEl.textContent = `${this.totalTime}s`;

    // Visual animation
    if (phase.phase.includes('Inspira')) {
      circleEl.style.transform = 'scale(1.5)';
      circleEl.style.transition = `transform ${phase.duration}s ease-in-out`;
    } else if (phase.phase.includes('Espira')) {
      circleEl.style.transform = 'scale(0.8)';
      circleEl.style.transition = `transform ${phase.duration}s ease-in-out`;
    }

    // Haptic feedback
    const hapticsEnabled = this.state.get('profile.settings.haptics');
    if (hapticsEnabled) {
      if (phase.phase.includes('Inspira')) vibrate([10]);
      if (phase.phase.includes('Espira')) vibrate([15]);
    }

    // Timer countdown
    let phaseTime = phase.duration;
    this.timer = setInterval(() => {
      phaseTime--;
      this.totalTime--;
      timerEl.textContent = `${this.totalTime}s`;

      if (this.totalTime <= 0) {
        this.stopBreathing();
        toast.success('Ottimo lavoro! 🧘');
        this.updateStats();
        return;
      }

      if (phaseTime <= 0) {
        clearInterval(this.timer);
        this.timer = null;
        this.currentPhase = (this.currentPhase + 1) % pattern.length;
        this.breathingCycle();
      }
    }, 1000);
  }

  stopBreathing() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const startBtn = document.getElementById('startBreath');
    const stopBtn = document.getElementById('stopBreath');
    const phaseEl = document.getElementById('breathPhase');
    const timerEl = document.getElementById('breathTimer');
    const circleEl = document.getElementById('breathCircle');

    if (startBtn && stopBtn) {
      startBtn.style.display = 'inline-flex';
      stopBtn.style.display = 'none';
    }

    if (phaseEl) phaseEl.textContent = 'Pronto';
    if (timerEl) timerEl.textContent = '60s';
    if (circleEl) {
      circleEl.style.transform = 'scale(1)';
      circleEl.style.transition = 'transform 0.3s ease';
    }

    this.totalTime = 0;
    this.currentPhase = 0;
  }

  updateStats() {
    const stats = this.state.get('stats');
    stats.totalBreathingSessions = (stats.totalBreathingSessions || 0) + 1;
    this.state.set('stats', stats);
  }

  toggleHaptics() {
    const current = this.state.get('profile.settings.haptics');
    this.state.set('profile.settings.haptics', !current);
    toast.info(`Haptics: ${!current ? 'ON' : 'OFF'}`);
    this.render();
  }

  unmount() {
    this.stopBreathing();
    super.unmount();
  }
}
