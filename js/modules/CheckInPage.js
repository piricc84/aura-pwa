/**
 * CheckInPage - Check-in giornaliero
 */
import { BasePage } from './BasePage.js';
import { toast } from '../components/Toast.js';
import { vibrate, nowISO, todayKey } from '../utils/helpers.js';

export class CheckInPage extends BasePage {
  render() {
    const lastCheckin = this.getLastCheckin();

    this.container.innerHTML = `
      ${this.renderHeader(
        'Check-in',
        'Come ti senti in questo momento?',
        [
          { id: 'history', label: 'Storico', icon: '📅', variant: 'btn-ghost' }
        ]
      )}

      ${this.renderCard({
        title: '😊 Umore',
        subtitle: 'Come ti senti emotivamente?',
        content: this.renderFormGroup({
          id: 'mood',
          type: 'range',
          value: lastCheckin?.mood || 6,
          min: 0,
          max: 10,
          leftLabel: 'Triste',
          rightLabel: 'Felice'
        })
      })}

      ${this.renderCard({
        title: '😰 Stress',
        subtitle: 'Quanto sei stressato?',
        content: this.renderFormGroup({
          id: 'stress',
          type: 'range',
          value: lastCheckin?.stress || 5,
          min: 0,
          max: 10,
          leftLabel: 'Calmo',
          rightLabel: 'Stressato'
        })
      })}

      ${this.renderCard({
        title: '⚡ Energia',
        subtitle: 'Quanto ti senti energico?',
        content: this.renderFormGroup({
          id: 'energy',
          type: 'range',
          value: lastCheckin?.energy || 6,
          min: 0,
          max: 10,
          leftLabel: 'Scarico',
          rightLabel: 'Pieno'
        })
      })}

      ${this.renderCard({
        title: '📝 Nota (opzionale)',
        content: this.renderFormGroup({
          id: 'note',
          type: 'textarea',
          placeholder: 'Cosa sta succedendo? Come ti senti? (opzionale)',
          helper: 'Scrivere aiuta a processare le emozioni'
        }),
        actions: [
          { id: 'save', label: '✓ Salva check-in', variant: 'btn-primary', block: true }
        ]
      })}
    `;

    this.bindRangeInputs();

    this.bindActions([
      {
        id: 'save',
        onClick: () => this.saveCheckin()
      },
      {
        id: 'history',
        onClick: () => this.router.push('/insights')
      }
    ]);
  }

  getLastCheckin() {
    const checkins = this.state.get('checkins') || [];
    return checkins[checkins.length - 1] || null;
  }

  saveCheckin() {
    const mood = Number(document.getElementById('mood').value);
    const stress = Number(document.getElementById('stress').value);
    const energy = Number(document.getElementById('energy').value);
    const note = document.getElementById('note').value.trim();

    const checkin = {
      ts: nowISO(),
      mood,
      stress,
      energy,
      note
    };

    // Aggiungi check-in
    const checkins = this.state.get('checkins') || [];
    checkins.push(checkin);
    this.state.set('checkins', checkins);

    // Aggiorna pet
    this.updatePet(checkin);

    // Aggiorna streak
    this.updateStreak();

    vibrate([12, 30, 12]);
    toast.success('Check-in salvato! 🎉');

    setTimeout(() => {
      this.router.push('/home');
    }, 800);
  }

  updatePet(checkin) {
    const pet = this.state.get('pet');

    // Calcola score (mood ed energia positivi, stress negativo)
    const score = (checkin.mood * 1.2 + checkin.energy * 0.8) - (checkin.stress * 1.0);

    // Aggiorna mood ed energia del pet (media mobile)
    pet.mood = Math.round((pet.mood * 0.6) + (checkin.mood * 0.4));
    pet.energy = Math.round((pet.energy * 0.6) + (checkin.energy * 0.4));
    pet.mood = Math.max(0, Math.min(10, pet.mood));
    pet.energy = Math.max(0, Math.min(10, pet.energy));

    // Aggiungi esperienza
    const expGain = Math.max(1, Math.floor(score / 2));
    pet.experience += expGain;
    pet.totalCheckIns = (pet.totalCheckIns || 0) + 1;

    // Level up check
    const currentLevel = pet.level;
    const maxExp = this.getMaxExpForLevel(currentLevel);

    if (pet.experience >= maxExp && currentLevel < 5) {
      pet.level += 1;
      pet.experience = pet.experience - maxExp;
      toast.success(`🎉 Level Up! Ora sei un ${this.getLevelName(pet.level)}!`);
    }

    this.state.set('pet', pet);
  }

  updateStreak() {
    const pet = this.state.get('pet');
    const today = todayKey();

    if (pet.lastCheckInDay === today) {
      return; // Già fatto check-in oggi
    }

    if (!pet.lastCheckInDay) {
      pet.streak = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = todayKey(yesterday);

      if (pet.lastCheckInDay === yesterdayKey) {
        pet.streak += 1;
      } else {
        pet.streak = 1;
      }
    }

    pet.lastCheckInDay = today;

    // Aggiorna longest streak
    const stats = this.state.get('stats');
    if (pet.streak > (stats.longestStreak || 0)) {
      stats.longestStreak = pet.streak;
      this.state.set('stats', stats);
    }

    this.state.set('pet', pet);
  }

  getMaxExpForLevel(level) {
    const levels = [0, 10, 30, 60, 100, Infinity];
    return levels[level] || 10;
  }

  getLevelName(level) {
    const names = ['Seme', 'Germoglio', 'Fiore', 'Albero', 'Foresta'];
    return names[level - 1] || names[0];
  }
}
