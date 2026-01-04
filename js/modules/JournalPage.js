/**
 * JournalPage - Diario personale
 */
import { BasePage } from './BasePage.js';
import { toast } from '../components/Toast.js';
import { nowISO, formatDate } from '../utils/helpers.js';

export class JournalPage extends BasePage {
  render() {
    const entries = this.state.get('journal') || [];

    this.container.innerHTML = `
      ${this.renderHeader(
        'Diario',
        'Scrivi i tuoi pensieri'
      )}

      ${this.renderCard({
        title: '✍️ Nuova nota',
        content: `
          ${this.renderFormGroup({
            id: 'journalNote',
            type: 'textarea',
            placeholder: 'Cosa ti è successo oggi? Come ti senti?',
            helper: 'Scrivi liberamente, nessuno leggerà'
          })}
          ${this.renderFormGroup({
            id: 'journalGratitude',
            type: 'textarea',
            placeholder: 'Per cosa sei grato oggi? (opzionale)'
          })}
        `,
        actions: [
          { id: 'save', label: '💾 Salva nota', variant: 'btn-primary', block: true }
        ]
      })}

      <!-- Recent Entries -->
      <div class="mb-4">
        <h3 class="text-xl font-bold mb-4">Note recenti</h3>
        ${entries.length === 0 ? `
          <div class="card text-center text-secondary">
            <p>Nessuna nota ancora. Inizia a scrivere!</p>
          </div>
        ` : entries.slice().reverse().slice(0, 10).map((entry, idx) => `
          <div class="card mb-3 animate-slide-up" style="animation-delay:${idx * 50}ms;">
            <div class="flex items-start justify-between mb-2">
              <div class="text-sm text-secondary">
                ${formatDate(entry.ts, 'long')} • ${formatDate(entry.ts, 'time')}
              </div>
              <button class="btn btn-ghost btn-sm btn-icon" data-action="delete-${entry.ts}">🗑️</button>
            </div>
            <div class="text-base">${this.escapeHtml(entry.note)}</div>
            ${entry.gratitude ? `
              <div class="mt-3 p-3 bg-primary-50 rounded-lg">
                <div class="text-sm font-medium text-primary-700">💚 Gratitudine</div>
                <div class="text-sm mt-1">${this.escapeHtml(entry.gratitude)}</div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    this.bindActions([
      {
        id: 'save',
        onClick: () => this.saveEntry()
      },
      ...entries.map(entry => ({
        id: `delete-${entry.ts}`,
        onClick: () => this.deleteEntry(entry.ts)
      }))
    ]);
  }

  saveEntry() {
    const note = document.getElementById('journalNote').value.trim();
    const gratitude = document.getElementById('journalGratitude').value.trim();

    if (!note && !gratitude) {
      toast.warning('Scrivi almeno qualcosa');
      return;
    }

    const entry = {
      ts: nowISO(),
      note,
      gratitude
    };

    const journal = this.state.get('journal') || [];
    journal.push(entry);
    this.state.set('journal', journal);

    // Update stats
    const stats = this.state.get('stats');
    stats.totalJournalEntries = (stats.totalJournalEntries || 0) + 1;
    this.state.set('stats', stats);

    toast.success('Nota salvata! 📝');
    this.render();
  }

  deleteEntry(timestamp) {
    if (!confirm('Eliminare questa nota?')) return;

    const journal = this.state.get('journal') || [];
    const filtered = journal.filter(e => e.ts !== timestamp);
    this.state.set('journal', filtered);

    toast.info('Nota eliminata');
    this.render();
  }
}
