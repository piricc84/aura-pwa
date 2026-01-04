/**
 * LoginPage - Schermata di login/registrazione
 */
import { BasePage } from './BasePage.js';
import { toast } from '../components/Toast.js';
import { vibrate } from '../utils/helpers.js';

export class LoginPage extends BasePage {
  render() {
    this.container.innerHTML = `
      <div class="flex flex-col items-center justify-center" style="min-height:80vh;">
        ${this.renderHeader(
          'Accesso',
          'Come vuoi essere chiamato?'
        )}

        ${this.renderCard({
          title: 'Il tuo nome',
          content: this.renderFormGroup({
            label: 'Nome o nickname',
            id: 'userName',
            placeholder: 'Es. Pietro',
            required: true,
            helper: 'Puoi cambiarlo in seguito nelle impostazioni'
          }),
          actions: [
            {
              id: 'continue',
              label: 'Continua →',
              variant: 'btn-primary',
              block: true
            }
          ]
        })}

        ${this.renderCard({
          title: 'Demo veloce',
          content: `
            <ol class="text-sm text-secondary space-y-2" style="list-style:decimal;padding-left:20px;">
              <li>Fai un <strong>check-in rapido</strong> (10s)</li>
              <li>Prova il <strong>respiro guidato</strong> (60s)</li>
              <li>Scrivi una <strong>nota</strong> (20s)</li>
              <li>Il tuo compagno <strong>evolverà</strong>! 🌱</li>
            </ol>
          `
        })}
      </div>
    `;

    this.bindActions([
      {
        id: 'continue',
        onClick: () => {
          const nameInput = document.getElementById('userName');
          const name = nameInput.value.trim();

          if (!name) {
            toast.error('Inserisci un nome per continuare');
            nameInput.focus();
            return;
          }

          this.state.set('profile.name', name);
          vibrate([10, 30, 10]);
          toast.success(`Benvenuto, ${name}! 🎉`);
          this.router.push('/home');
        }
      }
    ]);

    // Auto-focus
    setTimeout(() => {
      document.getElementById('userName')?.focus();
    }, 300);
  }
}
