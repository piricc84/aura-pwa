/**
 * HomePage - Schermata principale con pet e quick actions
 */
import { BasePage } from './BasePage.js';
import { toast } from '../components/Toast.js';
import { PET_LEVELS } from '../config.js';
import { formatNumber } from '../utils/helpers.js';

export class HomePage extends BasePage {
  render() {
    const pet = this.state.get('pet');
    const profile = this.state.get('profile');
    const petInfo = PET_LEVELS.find(l => l.level === pet.level) || PET_LEVELS[0];

    this.container.innerHTML = `
      ${this.renderHeader(
        `Ciao, ${profile.name || 'Ospite'}!`,
        'Il tuo compagno zen ti aspetta'
      )}

      <!-- Pet Card -->
      <div class="card card-gradient mb-6 animate-fade-in">
        <div class="flex flex-col items-center text-center">
          <div class="pet-avatar mb-4" style="width:120px;height:120px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:64px;">
            🌱
          </div>
          <h2 class="text-2xl font-bold mb-2">${petInfo.name}</h2>
          <p class="text-sm opacity-90 mb-4">Livello ${pet.level} • ${pet.experience}/${petInfo.maxExp} EXP</p>

          <!-- Progress bar -->
          <div class="progress mb-4" style="width:100%;max-width:240px;">
            <div class="progress-bar" style="width:${(pet.experience / petInfo.maxExp) * 100}%"></div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-3 gap-3 w-full mt-4">
            <div>
              <div class="text-2xl font-bold">${formatNumber(pet.mood)}</div>
              <div class="text-xs opacity-90">Umore</div>
            </div>
            <div>
              <div class="text-2xl font-bold">${formatNumber(pet.energy)}</div>
              <div class="text-xs opacity-90">Energia</div>
            </div>
            <div>
              <div class="text-2xl font-bold">${pet.streak}</div>
              <div class="text-xs opacity-90">Streak</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      ${this.renderCard({
        title: 'Azioni veloci',
        subtitle: 'Cosa vuoi fare oggi?',
        content: `
          <div class="grid grid-cols-2 gap-3">
            <button class="btn btn-primary btn-block" data-action="checkin">
              📝 Check-in
            </button>
            <button class="btn btn-outline btn-block" data-action="breath">
              🫁 Respiro
            </button>
            <button class="btn btn-outline btn-block" data-action="journal">
              📔 Diario
            </button>
            <button class="btn btn-outline btn-block" data-action="insights">
              📊 Insights
            </button>
          </div>
        `
      })}

      <!-- Daily Tip -->
      ${this.renderCard({
        title: '💡 Suggerimento del giorno',
        content: this.getDailyTip(),
        className: 'bg-accent-50'
      })}

      <!-- Today's Progress -->
      ${this.renderStats([
        { label: 'Check-in oggi', value: this.getTodayCheckIns() },
        { label: 'Respiri', value: this.state.get('stats.totalBreathingSessions') || 0 },
        { label: 'Note diario', value: this.state.get('stats.totalJournalEntries') || 0 },
        { label: 'Streak record', value: this.state.get('stats.longestStreak') || 0 }
      ])}
    `;

    this.bindActions([
      { id: 'checkin', onClick: () => this.router.push('/checkin') },
      { id: 'breath', onClick: () => this.router.push('/breath') },
      { id: 'journal', onClick: () => this.router.push('/journal') },
      { id: 'insights', onClick: () => this.router.push('/insights') }
    ]);
  }

  getTodayCheckIns() {
    const checkins = this.state.get('checkins') || [];
    const today = new Date().toISOString().slice(0, 10);
    return checkins.filter(c => c.ts.startsWith(today)).length;
  }

  getDailyTip() {
    const tips = [
      'Un check-in quotidiano vale più di lunghe sessioni sporadiche.',
      'Il respiro consapevole riduce lo stress in soli 60 secondi.',
      'Scrivi anche solo una frase al giorno nel diario.',
      'La costanza è più importante della perfezione.',
      'Celebra i piccoli progressi, non solo i grandi risultati.'
    ];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return tips[dayOfYear % tips.length];
  }
}
