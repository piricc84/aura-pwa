/**
 * SettingsPage - Impostazioni app
 */
import { BasePage } from './BasePage.js';
import { toast } from '../components/Toast.js';

export class SettingsPage extends BasePage {
  render() {
    const settings = this.state.get('profile.settings');
    const theme = this.state.get('profile.theme');

    this.container.innerHTML = `
      ${this.renderHeader(
        'Impostazioni',
        'Personalizza la tua esperienza'
      )}

      <!-- Theme -->
      ${this.renderCard({
        title: '🎨 Tema',
        content: `
          <div class="space-y-3">
            <button class="btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'} btn-block" data-action="theme-light">
              ☀️ Chiaro
            </button>
            <button class="btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'} btn-block" data-action="theme-dark">
              🌙 Scuro
            </button>
          </div>
        `
      })}

      <!-- Notifications -->
      ${this.renderCard({
        title: '🔔 Notifiche',
        content: `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Abilita notifiche</div>
                <div class="text-xs text-secondary">Promemoria giornalieri</div>
              </div>
              <button class="btn btn-sm ${settings.notifications ? 'btn-primary' : 'btn-ghost'}" data-action="toggle-notifications">
                ${settings.notifications ? 'ON' : 'OFF'}
              </button>
            </div>
            ${settings.notifications ? `
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">Orario promemoria</div>
                  <div class="text-xs text-secondary">Check-in giornaliero</div>
                </div>
                <input type="time" id="reminderTime" class="form-input" style="width:120px;" value="${settings.reminderTime || '09:00'}">
              </div>
            ` : ''}
          </div>
        `,
        actions: settings.notifications ? [
          { id: 'save-reminder', label: 'Salva orario', variant: 'btn-primary' }
        ] : []
      })}

      <!-- Preferences -->
      ${this.renderCard({
        title: '⚙️ Preferenze',
        content: `
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Suoni</div>
                <div class="text-xs text-secondary">Feedback audio</div>
              </div>
              <button class="btn btn-sm ${settings.sound ? 'btn-primary' : 'btn-ghost'}" data-action="toggle-sound">
                ${settings.sound ? 'ON' : 'OFF'}
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Vibrazione</div>
                <div class="text-xs text-secondary">Feedback aptico</div>
              </div>
              <button class="btn btn-sm ${settings.haptics ? 'btn-primary' : 'btn-ghost'}" data-action="toggle-haptics">
                ${settings.haptics ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        `
      })}

      <!-- Data Management -->
      ${this.renderCard({
        title: '💾 Gestione dati',
        content: `
          <div class="space-y-3">
            <button class="btn btn-outline btn-block" data-action="export">
              📤 Esporta dati (JSON)
            </button>
            <div>
              <label class="btn btn-outline btn-block cursor-pointer">
                📥 Importa backup
                <input type="file" id="importFile" accept="application/json" class="hidden">
              </label>
            </div>
          </div>
        `
      })}

      <!-- About -->
      ${this.renderCard({
        title: 'ℹ️ Informazioni',
        content: `
          <div class="text-sm text-secondary space-y-2">
            <p><strong>AURA Zen</strong> v2.0</p>
            <p>App per benessere mentale e mindfulness</p>
            <p>Tutti i dati sono salvati localmente sul tuo dispositivo</p>
            <p>Nessun tracking, nessuna pubblicità</p>
            <div class="mt-4 pt-4 border-t border-neutral-200">
              <button class="btn btn-ghost btn-sm" data-action="back">← Torna al profilo</button>
            </div>
          </div>
        `
      })}
    `;

    this.bindActions([
      { id: 'theme-light', onClick: () => this.setTheme('light') },
      { id: 'theme-dark', onClick: () => this.setTheme('dark') },
      { id: 'toggle-notifications', onClick: () => this.toggleSetting('notifications') },
      { id: 'toggle-sound', onClick: () => this.toggleSetting('sound') },
      { id: 'toggle-haptics', onClick: () => this.toggleSetting('haptics') },
      { id: 'save-reminder', onClick: () => this.saveReminderTime() },
      { id: 'export', onClick: () => this.exportData() },
      { id: 'back', onClick: () => this.router.back() }
    ]);

    // Import file handler
    const fileInput = document.getElementById('importFile');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.importData(e));
    }
  }

  setTheme(theme) {
    this.state.set('profile.theme', theme);
    toast.success(`Tema: ${theme === 'light' ? 'Chiaro' : 'Scuro'}`);
    this.render();
  }

  toggleSetting(setting) {
    const current = this.state.get(`profile.settings.${setting}`);
    this.state.set(`profile.settings.${setting}`, !current);
    toast.info(`${setting}: ${!current ? 'ON' : 'OFF'}`);
    this.render();
  }

  saveReminderTime() {
    const time = document.getElementById('reminderTime')?.value;
    if (time) {
      this.state.set('profile.settings.reminderTime', time);
      toast.success(`Promemoria impostato alle ${time}`);
    }
  }

  exportData() {
    const data = this.state.export();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-zen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dati esportati! 💾');
  }

  async importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = this.state.import(text);

      if (success) {
        toast.success('Dati importati! 🎉');
        setTimeout(() => {
          location.reload();
        }, 1500);
      } else {
        toast.error('Errore durante l\'import');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('File non valido');
    }
  }
}
