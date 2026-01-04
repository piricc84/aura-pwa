/**
 * InsightsPage - Statistiche e grafici
 */
import { BasePage } from './BasePage.js';
import { Chart } from '../components/Chart.js';
import { Analytics } from '../utils/analytics.js';
import { formatNumber } from '../utils/helpers.js';

export class InsightsPage extends BasePage {
  constructor(container, state, router) {
    super(container, state, router);
    this.analytics = new Analytics(state);
    this.chart = null;
  }

  render() {
    const stats = this.analytics.getCheckInStats(7);
    const insights = this.analytics.generateInsights();

    this.container.innerHTML = `
      ${this.renderHeader(
        'Insights',
        'I tuoi progressi'
      )}

      <!-- Stats Overview -->
      ${this.renderStats([
        { label: 'Check-in (7gg)', value: stats.count },
        { label: 'Umore medio', value: formatNumber(stats.avgMood) },
        { label: 'Stress medio', value: formatNumber(stats.avgStress) },
        { label: 'Energia media', value: formatNumber(stats.avgEnergy) }
      ])}

      <!-- Chart -->
      ${stats.count > 0 ? `
        ${this.renderCard({
          title: 'Trend ultimi 7 giorni',
          content: '<div id="insightsChart" style="width:100%;height:250px;"></div>'
        })}
      ` : ''}

      <!-- Insights -->
      ${insights.length > 0 ? `
        <div class="mb-4">
          <h3 class="text-xl font-bold mb-4">💡 Consigli personalizzati</h3>
          ${insights.map((insight, idx) => `
            <div class="alert alert-${insight.type} mb-3 animate-slide-up" style="animation-delay:${idx * 100}ms;">
              <div class="font-bold mb-1">${insight.title}</div>
              <div class="text-sm">${insight.message}</div>
              ${insight.action ? `
                <button class="btn btn-sm btn-${insight.type === 'success' ? 'primary' : 'outline'} mt-3" data-action="insight-${idx}">
                  ${insight.action.label}
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Empty State -->
      ${stats.count === 0 ? `
        ${this.renderCard({
          title: 'Nessun dato ancora',
          content: `
            <p class="text-secondary mb-4">Fai almeno un check-in per vedere statistiche e insights personalizzati.</p>
            <button class="btn btn-primary" data-action="goto-checkin">Fai un check-in ora</button>
          `
        })}
      ` : ''}
    `;

    // Render chart if data exists
    if (stats.count > 0) {
      setTimeout(() => this.renderChart(), 100);
    }

    // Bind insight actions
    insights.forEach((insight, idx) => {
      if (insight.action) {
        this.bindActions([
          {
            id: `insight-${idx}`,
            onClick: () => this.router.push(insight.action.route)
          }
        ]);
      }
    });

    this.bindActions([
      { id: 'goto-checkin', onClick: () => this.router.push('/checkin') }
    ]);
  }

  renderChart() {
    const chartData = this.analytics.getChartData(7);

    if (!chartData.labels.length) return;

    const container = document.getElementById('insightsChart');
    if (!container) return;

    this.chart = new Chart(container, {
      type: 'line',
      width: container.offsetWidth || 400,
      height: 250,
      showGrid: true,
      showPoints: true
    });

    this.chart.setData(chartData);
  }

  unmount() {
    this.chart = null;
    super.unmount();
  }
}
