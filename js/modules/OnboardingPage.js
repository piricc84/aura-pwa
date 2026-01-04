/**
 * OnboardingPage - Prima schermata per nuovi utenti
 */
import { BasePage } from './BasePage.js';
import { GOALS } from '../config.js';
import { toast } from '../components/Toast.js';

export class OnboardingPage extends BasePage {
  render() {
    const selectedGoal = this.state.get('profile.goal') || 'Calma';

    this.container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center p-6" style="min-height:80vh;">
        <div class="mb-8 animate-fade-in">
          <div style="font-size:80px;margin-bottom:16px;">🧘</div>
          <h1 class="text-4xl font-bold mb-4">Benvenuto in AURA Zen</h1>
          <p class="text-lg text-secondary max-w-md mx-auto">
            Il tuo compagno personale per benessere mentale, mindfulness e crescita personale.
          </p>
        </div>

        ${this.renderCard({
          title: 'Scegli il tuo obiettivo',
          subtitle: 'Su cosa vuoi concentrarti?',
          content: this.renderChips(
            GOALS.map(g => ({ id: g.id, label: `${g.icon} ${g.label}` })),
            selectedGoal.toLowerCase()
          ),
          className: 'animate-slide-up'
        })}

        ${this.renderCard({
          title: 'Privacy garantita',
          subtitle: 'I tuoi dati, sotto il tuo controllo',
          content: `
            <div class="text-sm text-secondary space-y-2">
              <p>✅ Tutti i dati restano sul tuo dispositivo</p>
              <p>✅ Nessun account richiesto</p>
              <p>✅ Export/Import quando vuoi</p>
              <p>✅ Nessun tracking o pubblicità</p>
            </div>
          `,
          className: 'animate-slide-up'
        })}

        <button class="btn btn-primary btn-lg btn-block mt-6 animate-slide-up" data-action="start">
          Inizia il tuo percorso →
        </button>
      </div>
    `;

    this.bindChips((goalId) => {
      const goal = GOALS.find(g => g.id === goalId);
      if (goal) {
        this.state.set('profile.goal', goal.label);
        toast.success(`Obiettivo: ${goal.label}`);
      }
    });

    this.bindActions([
      {
        id: 'start',
        onClick: () => {
          this.state.set('profile.onboarded', true);
          toast.success('Benvenuto! 🎉');
          this.router.push('/login');
        }
      }
    ]);
  }
}
