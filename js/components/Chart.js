/**
 * Chart - Mini chart component (senza dipendenze esterne)
 */
export class Chart {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.options = {
      width: 400,
      height: 200,
      padding: 20,
      type: 'line', // line, bar
      showGrid: true,
      showAxes: true,
      showPoints: true,
      strokeWidth: 2,
      ...options
    };

    this.data = null;
  }

  setData(data) {
    this.data = data;
    this.render();
  }

  render() {
    if (!this.data || !this.container) return;

    const { labels, datasets } = this.data;
    const { width, height, padding, type } = this.options;

    const svg = this.createSVG(width, height);
    this.container.innerHTML = '';
    this.container.appendChild(svg);

    // Calcola scale
    const maxValue = Math.max(...datasets.flatMap(d => d.data));
    const minValue = Math.min(...datasets.flatMap(d => d.data));
    const range = maxValue - minValue || 1;

    const xStep = (width - padding * 2) / (labels.length - 1 || 1);
    const yScale = (height - padding * 2) / range;

    // Grid
    if (this.options.showGrid) {
      this.drawGrid(svg, width, height, padding);
    }

    // Datasets
    datasets.forEach((dataset, idx) => {
      const color = dataset.color || this.getColor(idx);

      if (type === 'line') {
        this.drawLine(svg, dataset.data, xStep, yScale, minValue, padding, color);
      } else if (type === 'bar') {
        this.drawBars(svg, dataset.data, xStep, yScale, minValue, padding, color, idx, datasets.length);
      }
    });

    // Labels
    this.drawLabels(svg, labels, xStep, height, padding);

    // Legend
    this.drawLegend(svg, datasets, width, padding);
  }

  createSVG(width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.cssText = 'max-width:100%;height:auto;';
    return svg;
  }

  drawGrid(svg, width, height, padding) {
    const gridLines = 5;
    const step = (height - padding * 2) / gridLines;

    for (let i = 0; i <= gridLines; i++) {
      const y = padding + step * i;
      const line = this.createLine(padding, y, width - padding, y, '#e5e7eb', 1, '2,2');
      svg.appendChild(line);
    }
  }

  drawLine(svg, data, xStep, yScale, minValue, padding, color) {
    const points = data.map((value, i) => {
      const x = padding + i * xStep;
      const y = padding + (svg.getAttribute('height') - padding * 2) - ((value - minValue) * yScale);
      return `${x},${y}`;
    }).join(' ');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', color);
    polyline.setAttribute('stroke-width', this.options.strokeWidth);
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(polyline);

    // Points
    if (this.options.showPoints) {
      data.forEach((value, i) => {
        const x = padding + i * xStep;
        const y = padding + (svg.getAttribute('height') - padding * 2) - ((value - minValue) * yScale);
        const circle = this.createCircle(x, y, 4, color);
        svg.appendChild(circle);
      });
    }
  }

  drawBars(svg, data, xStep, yScale, minValue, padding, color, datasetIndex, totalDatasets) {
    const barWidth = (xStep * 0.8) / totalDatasets;
    const offsetX = datasetIndex * barWidth - (barWidth * totalDatasets) / 2;

    data.forEach((value, i) => {
      const x = padding + i * xStep + offsetX;
      const barHeight = (value - minValue) * yScale;
      const y = padding + (svg.getAttribute('height') - padding * 2) - barHeight;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', color);
      rect.setAttribute('rx', 4);

      svg.appendChild(rect);
    });
  }

  drawLabels(svg, labels, xStep, height, padding) {
    labels.forEach((label, i) => {
      const x = padding + i * xStep;
      const y = height - padding / 2;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#6b7280');
      text.textContent = label;

      svg.appendChild(text);
    });
  }

  drawLegend(svg, datasets, width, padding) {
    datasets.forEach((dataset, i) => {
      const x = width - padding - 100;
      const y = padding + i * 20;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y - 10);
      rect.setAttribute('width', 16);
      rect.setAttribute('height', 3);
      rect.setAttribute('fill', dataset.color || this.getColor(i));
      rect.setAttribute('rx', 2);
      svg.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + 20);
      text.setAttribute('y', y - 4);
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#6b7280');
      text.textContent = dataset.label;
      svg.appendChild(text);
    });
  }

  createLine(x1, y1, x2, y2, stroke, strokeWidth = 1, strokeDasharray = null) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', strokeWidth);
    if (strokeDasharray) line.setAttribute('stroke-dasharray', strokeDasharray);
    return line;
  }

  createCircle(cx, cy, r, fill) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', fill);
    return circle;
  }

  getColor(index) {
    const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  }
}
