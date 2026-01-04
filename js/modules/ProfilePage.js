/**
 * ProfilePage - Profilo utente e impostazioni rapide
 */
import { BasePage } from './BasePage.js';
import { GOALS } from '../config.js';
import { toast } from '../components/Toast.js';

export class ProfilePage extends BasePage {
  render() {
    const profile = this.state.get('profile');
    const pet = this.state.get('pet');
    const stats = this.state.get('stats');

    this.container.innerHTML = `
      ${this.renderHeader(
        'Profilo',
        'Le tue informazioni'
      )}

      <!-- Profile Info -->
      ${this.renderCard({
        title: 'Informazioni',
        content: `
          ${this.renderFormGroup({
            label: 'Nome',
            id: 'profileName',
            value: profile.name,
            placeholder: 'Il tuo nome'
          })}
          ${this.renderFormGroup({
            label: 'Email (opzionale)',
            id: 'profileEmail',
            type: 'email',
            value: profile.email || '',
            placeholder: 'email@esempio.com'
          })}
        `,
        actions: [
          { id: 'save-profile', label: 'Salva modifiche', variant: 'btn-primary' }
        ]
      })}

      <!-- Goal Selection -->
      ${this.renderCard({
        title: 'Il tuo obiettivo',
        subtitle: 'Su cosa vuoi concentrarti?',
        content: this.renderChips(
          GOALS.map(g => ({ id: g.id, label: `${g.icon} ${g.label}` })),
          profile.goal?.toLowerCase()
        )
      })}

      <!-- Stats -->
      ${this.renderCard({
        title: '📊 Le tue statistiche',
        content: `
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-2xl font-bold">${pet.totalCheckIns || 0}</div>
              <div class="text-sm text-secondary">Check-in totali</div>
            </div>
            <div>
              <div class="text-2xl font-bold">${stats.longestStreak || 0}</div>
              <div class="text-sm text-secondary">Streak massimo</div>
            </div>
            <div>
              <div class="text-2xl font-bold">${stats.totalBreathingSessions || 0}</div>
              <div class="text-sm text-secondary">Sessioni respiro</div>
            </div>
            <div>
              <div class="text-2xl font-bold">${stats.totalJournalEntries || 0}</div>
              <div class="text-sm text-secondary">Note diario</div>
            </div>
          </div>
        `
      })}

      <!-- Quick Actions -->
      ${this.renderCard({
        title: 'Azioni rapide',
        content: `
          <div class="space-y-2">
            <button class="btn btn-outline btn-block" data-action="settings">⚙️ Impostazioni</button>
            <button class="btn btn-outline btn-block" data-action="export">💾 Esporta dati</button>
            <button class="btn btn-danger btn-block" data-action="reset">🗑️ Reset dati</button>
          </div>
        `
      })}
    `;

    this.bindChips((goalId) => {
      const goal = GOALS.find(g => g.id === goalId);
      if (goal) {
        this.state.set('profile.goal', goal.label);
        toast.success(`Obiettivo aggiornato: ${goal.label}`);
      }
    });

    this.bindActions([
      {
        id: 'save-profile',
        onClick: () => this.saveProfile()
      },
      {
        id: 'settings',
        onClick: () => this.router.push('/settings')
      },
      {
        id: 'export',
        onClick: () => this.exportData()
      },
      {
        id: 'reset',
        onClick: () => this.resetData()
      }
    ]);
  }

  saveProfile() {
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();

    if (!name) {
      toast.error('Il nome è obbligatorio');
      return;
    }

    this.state.set('profile.name', name);
    this.state.set('profile.email', email);

    toast.success('Profilo aggiornato! ✓');
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

  resetData() {
    if (!confirm('⚠️ ATTENZIONE: Eliminare TUTTI i dati? Questa azione è irreversibile!')) {
      return;
    }

    if (!confirm('Sei davvero sicuro? Tutti i check-in, note e progressi saranno persi.')) {
      return;
    }

    this.state.reset();
    toast.info('Dati resettati');
    setTimeout(() => {
      this.router.replace('/');
    }, 1000);
  }
}
