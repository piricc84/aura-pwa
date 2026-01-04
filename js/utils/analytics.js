/**
 * Analytics e tracking interno (privacy-first)
 */

export class Analytics {
  constructor(stateManager) {
    this.state = stateManager;
  }

  // Statistiche check-in
  getCheckInStats(days = 7) {
    const checkins = this.state.get('checkins') || [];
    const cutoff = Date.now() - days * 24 * 3600 * 1000;

    const recent = checkins.filter(c => new Date(c.ts).getTime() >= cutoff);

    if (!recent.length) {
      return {
        count: 0,
        avgMood: null,
        avgStress: null,
        avgEnergy: null,
        trend: null
      };
    }

    const sum = (key) => recent.reduce((acc, c) => acc + (c[key] || 0), 0);

    return {
      count: recent.length,
      avgMood: sum('mood') / recent.length,
      avgStress: sum('stress') / recent.length,
      avgEnergy: sum('energy') / recent.length,
      trend: this.calculateTrend(recent, 'mood')
    };
  }

  // Calcola trend (up/down/stable)
  calculateTrend(data, key) {
    if (data.length < 2) return 'stable';

    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid);
    const secondHalf = data.slice(mid);

    const avgFirst = firstHalf.reduce((acc, d) => acc + (d[key] || 0), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((acc, d) => acc + (d[key] || 0), 0) / secondHalf.length;

    const diff = avgSecond - avgFirst;

    if (diff > 0.5) return 'up';
    if (diff < -0.5) return 'down';
    return 'stable';
  }

  // Pattern detection
  detectPatterns() {
    const checkins = this.state.get('checkins') || [];

    // Orari peak stress
    const stressHours = checkins.map(c => ({
      hour: new Date(c.ts).getHours(),
      stress: c.stress
    }));

    const hourlyStress = {};
    stressHours.forEach(({ hour, stress }) => {
      if (!hourlyStress[hour]) hourlyStress[hour] = [];
      hourlyStress[hour].push(stress);
    });

    const avgByHour = Object.entries(hourlyStress).map(([hour, values]) => ({
      hour: parseInt(hour),
      avgStress: values.reduce((a, b) => a + b, 0) / values.length
    }));

    const peakStressHour = avgByHour.sort((a, b) => b.avgStress - a.avgStress)[0];

    // Giorni migliori/peggiori
    const byDay = {};
    checkins.forEach(c => {
      const day = new Date(c.ts).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(c.mood);
    });

    const avgByDay = Object.entries(byDay).map(([day, moods]) => ({
      day,
      avgMood: moods.reduce((a, b) => a + b, 0) / moods.length
    }));

    const bestDay = avgByDay.sort((a, b) => b.avgMood - a.avgMood)[0];
    const worstDay = avgByDay.sort((a, b) => a.avgMood - b.avgMood)[0];

    return {
      peakStressHour,
      bestDay,
      worstDay,
      totalDays: Object.keys(byDay).length
    };
  }

  // Insights personalizzati
  generateInsights() {
    const stats = this.getCheckInStats(7);
    const patterns = this.detectPatterns();
    const insights = [];

    if (stats.count === 0) {
      insights.push({
        type: 'info',
        title: 'Inizia ora',
        message: 'Fai il tuo primo check-in per ricevere insights personalizzati.',
        action: { label: 'Check-in', route: '/checkin' }
      });
      return insights;
    }

    // Stress alto
    if (stats.avgStress >= 7) {
      insights.push({
        type: 'warning',
        title: 'Stress elevato',
        message: `Media stress: ${stats.avgStress.toFixed(1)}/10. Considera pause frequenti.`,
        action: { label: 'Respiro guidato', route: '/breath' }
      });
    }

    // Energia bassa
    if (stats.avgEnergy <= 4) {
      insights.push({
        type: 'info',
        title: 'Energia bassa',
        message: 'Ricorda: movimento leggero, idratazione e pause aiutano.',
        action: { label: 'Imposta reminder', route: '/settings' }
      });
    }

    // Trend positivo
    if (stats.trend === 'up') {
      insights.push({
        type: 'success',
        title: 'Ottimo progresso',
        message: `Umore in miglioramento negli ultimi ${stats.count} check-in!`,
        action: { label: 'Continua così', route: '/rewards' }
      });
    }

    // Peak stress hour
    if (patterns.peakStressHour) {
      insights.push({
        type: 'tip',
        title: 'Pattern rilevato',
        message: `Picco stress verso le ${patterns.peakStressHour.hour}:00. Pianifica una pausa preventiva.`,
        action: null
      });
    }

    // Costanza
    if (stats.count >= 5) {
      insights.push({
        type: 'success',
        title: 'Ottima costanza',
        message: `${stats.count} check-in questa settimana. Keep it up!`,
        action: null
      });
    }

    return insights;
  }

  // Dati per grafici
  getChartData(days = 7) {
    const checkins = this.state.get('checkins') || [];
    const cutoff = Date.now() - days * 24 * 3600 * 1000;
    const recent = checkins.filter(c => new Date(c.ts).getTime() >= cutoff);

    const byDay = {};
    recent.forEach(c => {
      const day = new Date(c.ts).toISOString().slice(0, 10);
      if (!byDay[day]) {
        byDay[day] = { mood: [], stress: [], energy: [] };
      }
      byDay[day].mood.push(c.mood);
      byDay[day].stress.push(c.stress);
      byDay[day].energy.push(c.energy);
    });

    const labels = [];
    const moodData = [];
    const stressData = [];
    const energyData = [];

    Object.entries(byDay).forEach(([day, values]) => {
      labels.push(new Date(day).toLocaleDateString('it-IT', { weekday: 'short' }));
      moodData.push(values.mood.reduce((a, b) => a + b, 0) / values.mood.length);
      stressData.push(values.stress.reduce((a, b) => a + b, 0) / values.stress.length);
      energyData.push(values.energy.reduce((a, b) => a + b, 0) / values.energy.length);
    });

    return {
      labels,
      datasets: [
        { label: 'Umore', data: moodData, color: '#6fbf9f' },
        { label: 'Stress', data: stressData, color: '#f59e0b' },
        { label: 'Energia', data: energyData, color: '#3b82f6' }
      ]
    };
  }
}
