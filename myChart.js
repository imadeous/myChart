/**
 * ChartCore - Base class for all chart types.
 * Handles canvas setup, resizing, animation, axes, legend, and tooltips.
 * Extend this class to implement custom chart types.
 */
class ChartCore {
    /**
     * @param {HTMLCanvasElement} canvas - The canvas element to render the chart on.
     * @param {Object} config - Chart configuration (data, options).
     */
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.padding = 60;
        this.animationDuration = 1000;
        this.animationStart = null;
        this.animationProgress = 0;
        this.width = canvas.width;
        this.height = canvas.height;
        this.graphWidth = this.width - 2 * this.padding;
        this.graphHeight = this.height - 2 * this.padding;
        this.allPoints = [];
        this._lastParentWidth = null;
        this.init();
    }

    /**
     * Initialize chart: set up resize and mouse events, start animation.
     */
    init() {
        requestAnimationFrame(this.animate.bind(this));
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', this.handleHover.bind(this));
    }

    /**
     * Resize canvas to fit parent container and redraw chart.
     */
    resize() {
        const parentWidth = this.canvas.parentElement.clientWidth;
        if (this._lastParentWidth === parentWidth) return;
        this._lastParentWidth = parentWidth;
        this.canvas.width = parentWidth;
        this.canvas.height = parentWidth * 0.6;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.graphWidth = this.width - 2 * this.padding;
        this.graphHeight = this.height - 2 * this.padding;
        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Animate chart drawing (used for initial load and redraw).
     * @param {number} timestamp
     */
    animate(timestamp) {
        if (!this.animationStart) this.animationStart = timestamp;
        const elapsed = timestamp - this.animationStart;
        this.animationProgress = Math.min(elapsed / this.animationDuration, 1);
        this.draw(this.animationProgress);
        if (this.animationProgress < 1) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    /**
     * Calculate max Y values for left and right axes (supports stacked charts).
     * @returns {{leftMax: number, rightMax: number}}
     */
    getAxisMaxValues() {
        let datasets = this.config.data.datasets;
        const options = this.config.options || {};
        let leftMax = 0, rightMax = 0;
        if (options.stacked) {
            // For stacked charts, sum values at each X
            const numPoints = datasets[0]?.data?.length || 0;
            for (let i = 0; i < numPoints; i++) {
                let sumLeft = 0, sumRight = 0;
                datasets.forEach(ds => {
                    if (!ds || !Array.isArray(ds.data)) return;
                    const val = ds.data[i] || 0;
                    if (ds.yAxis === 'right') sumRight += val;
                    else sumLeft += val;
                });
                leftMax = Math.max(leftMax, sumLeft);
                rightMax = Math.max(rightMax, sumRight);
            }
        } else {
            // For non-stacked, just take max of each dataset
            datasets.forEach(ds => {
                if (!ds || !Array.isArray(ds.data)) return;
                const maxVal = Math.max(...ds.data);
                if (ds.yAxis === 'right') rightMax = Math.max(rightMax, maxVal);
                else leftMax = Math.max(leftMax, maxVal);
            });
        }
        return { leftMax, rightMax };
    }

    /**
     * Draw chart axes and X/Y labels.
     * @param {number} maxLeft - Max value for left Y axis
     * @param {number} maxRight - Max value for right Y axis
     * @param {string[]} labels - X axis labels
     * @param {number} spacingX - Space between X ticks
     */
    drawAxes(maxLeft, maxRight, labels, spacingX) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#E5E7EB';
        ctx.fillStyle = '#4B5563';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        const yStep = 50;
        for (let y = 0; y <= maxLeft; y += yStep) {
            const yPos = this.height - this.padding - (y / maxLeft) * this.graphHeight;
            ctx.beginPath();
            ctx.moveTo(this.padding, yPos);
            ctx.lineTo(this.width - this.padding, yPos);
            ctx.stroke();
            ctx.fillText(y, this.padding - 10, yPos + 4);
        }
        if (maxRight > 0) {
            ctx.textAlign = 'left';
            for (let y = 0; y <= maxRight; y += yStep) {
                const yPos = this.height - this.padding - (y / maxRight) * this.graphHeight;
                ctx.fillText(y, this.width - this.padding + 10, yPos + 4);
            }
        }
        // Draw base axis lines
        ctx.strokeStyle = '#374151';
        ctx.beginPath();
        ctx.moveTo(this.padding, this.padding);
        ctx.lineTo(this.padding, this.height - this.padding);
        ctx.lineTo(this.width - this.padding, this.height - this.padding);
        ctx.stroke();
        // X-axis labels
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        labels.forEach((label, i) => {
            const x = this.padding + i * spacingX;
            ctx.fillText(label, x, this.height - this.padding + 20);
        });
    }

    /**
     * Draw chart legend for all datasets.
     * @param {Array<{label: string, borderColor?: string, backgroundColor?: string}>} datasets
     */
    drawLegend(datasets) {
        const ctx = this.ctx;
        let legendX = this.padding;
        const legendY = this.padding / 2;
        datasets.forEach(ds => {
            ctx.fillStyle = ds.borderColor || ds.backgroundColor;
            ctx.fillRect(legendX, legendY - 8, 20, 10);
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'left';
            ctx.fillText(ds.label, legendX + 25, legendY);
            legendX += ctx.measureText(ds.label).width + 60;
        });
    }

    /**
     * Handle mouse hover for tooltips (for line/bar charts).
     * @param {MouseEvent} e
     */
    handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const ctx = this.ctx;
        this.draw(this.animationProgress);
        if (!this.allPoints) return;
        for (let p of this.allPoints) {
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < 6) {
                ctx.fillStyle = 'black';
                ctx.fillRect(p.x + 10, p.y - 30, 100, 24);
                ctx.fillStyle = 'white';
                ctx.font = '12px sans-serif';
                ctx.fillText(`${p.label}: ${p.value}`, p.x + 15, p.y - 13);
                break;
            }
        }
    }

    /**
     * Export chart as PNG image.
     */
    exportPNG() {
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

/**
 * LineChart - Renders animated, interactive line charts with optional smooth curves.
 * Supports multi-series, per-point tooltips, and smoothness modifier.
 */
class LineChart extends ChartCore {
    /**
     * Draw the line chart.
     * @param {number} progress - Animation progress (0 to 1)
     */
    draw(progress) {
        const { labels, datasets } = this.config.data;
        const spacingX = this.graphWidth / (labels.length - 1);
        const ctx = this.ctx;
        const allPoints = [];
        const { leftMax, rightMax } = this.getAxisMaxValues();
        ctx.clearRect(0, 0, this.width, this.height);
        this.drawAxes(leftMax, rightMax, labels, spacingX);
        // Smoothness: 1 (pointy) to 10 (curvy)
        const smoothness = (this.config.options && this.config.options.smoothness) ? this.config.options.smoothness : 1;
        const s = Math.max(1, Math.min(10, smoothness));
        datasets.forEach(ds => {
            ctx.strokeStyle = ds.borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            let prevX = null, prevY = null;
            ds.data.forEach((val, i) => {
                const x = this.padding + i * spacingX;
                const y = this.height - this.padding - (val / leftMax) * this.graphHeight * progress;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else if (s > 1) {
                    // Cubic Bezier for smooth lines
                    const prevVal = ds.data[i - 1];
                    const prevX_ = this.padding + (i - 1) * spacingX;
                    const prevY_ = this.height - this.padding - (prevVal / leftMax) * this.graphHeight * progress;
                    const t = (s - 1) / 18; // Tension: 0 (pointy) to 0.5 (curvy)
                    const cp1x = prevX_ + spacingX * t;
                    const cp1y = prevY_;
                    const cp2x = x - spacingX * t;
                    const cp2y = y;
                    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                allPoints.push({ x, y, value: val, label: ds.label, color: ds.pointColor });
                prevX = x; prevY = y;
            });
            ctx.stroke();
            // Draw points
            ds.data.forEach((val, i) => {
                const x = this.padding + i * spacingX;
                const y = this.height - this.padding - (val / leftMax) * this.graphHeight * progress;
                ctx.fillStyle = ds.pointColor;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        this.allPoints = allPoints;
        this.drawLegend(datasets);
    }
}

/**
 * BarChart - Renders animated, interactive bar charts (grouped or stacked).
 * Supports multi-series, left/right axes, and tooltips.
 */
class BarChart extends ChartCore {
    /**
     * Draw the bar chart.
     * @param {number} progress - Animation progress (0 to 1)
     */
    draw(progress) {
        const { labels, datasets } = this.config.data;
        const options = this.config.options || {};
        const stacked = options.stacked || false;
        const ctx = this.ctx;
        // Calculate spacing for bar groups
        const spacingX = this.graphWidth / labels.length;
        const groupSpacing = 0;
        const barSpacing = 10;
        const { leftMax, rightMax } = this.getAxisMaxValues();
        ctx.clearRect(0, 0, this.width, this.height);
        this.drawAxes(leftMax, rightMax, labels, spacingX + groupSpacing);
        // Prepare cumulative heights for stacked bars
        let cumHeightsLeft = new Array(labels.length).fill(0);
        let cumHeightsRight = new Array(labels.length).fill(0);
        const barDatasets = datasets.filter(ds => ds.type === 'bar');
        const numBarDatasets = barDatasets.length;
        labels.forEach((label, i) => {
            const baseX = this.padding + i * spacingX;
            datasets.forEach(ds => {
                if (!ds || !Array.isArray(ds.data)) return;
                const val = ds.data[i];
                if (val == null) return;
                const axis = ds.yAxis === 'right' ? 'right' : 'left';
                const maxValue = axis === 'right' ? rightMax : leftMax;
                if (ds.type === 'bar') {
                    if (stacked) {
                        // Stacked bars: draw on top of previous
                        const cumHeight = axis === 'right' ? cumHeightsRight[i] : cumHeightsLeft[i];
                        const height = (val / maxValue) * this.graphHeight * progress;
                        const x = baseX + barSpacing;
                        const y = this.height - this.padding - height - cumHeight;
                        const w = spacingX - 2 * barSpacing;
                        ctx.fillStyle = ds.backgroundColor;
                        ctx.fillRect(x, y, w, height);
                        if (axis === 'right') cumHeightsRight[i] += height;
                        else cumHeightsLeft[i] += height;
                    } else {
                        // Grouped bars
                        const barIndex = barDatasets.indexOf(ds);
                        const barWidth = (spacingX - 2 * barSpacing) / numBarDatasets;
                        const x = baseX + barSpacing + barIndex * barWidth;
                        const height = (val / maxValue) * this.graphHeight * progress;
                        const y = this.height - this.padding - height;
                        ctx.fillStyle = ds.backgroundColor;
                        ctx.fillRect(x, y, barWidth, height);
                    }
                    // Value label
                    if (progress === 1) {
                        ctx.fillStyle = '#1F2937';
                        ctx.textAlign = 'center';
                        ctx.fillText(val, x + (stacked ? w / 2 : barWidth / 2), y - 6);
                    }
                } else if (ds.type === 'line') {
                    // Draw line on top of bars (for mixed charts)
                    ctx.strokeStyle = ds.borderColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    for (let k = 0; k <= i; k++) {
                        const x = this.padding + k * spacingX;
                        const yVal = ds.data[k];
                        if (yVal == null) continue;
                        const y = this.height - this.padding - (yVal / maxValue) * this.graphHeight * progress;
                        if (k === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    // Draw points
                    const xPoint = this.padding + i * spacingX;
                    const yPoint = this.height - this.padding - (val / maxValue) * this.graphHeight * progress;
                    ctx.fillStyle = ds.pointColor;
                    ctx.beginPath();
                    ctx.arc(xPoint, yPoint, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        });
        this.drawLegend(datasets);
    }
}

/**
 * PieChart - Renders animated, interactive pie charts with tooltips and legend.
 * Supports per-slice color, auto palette, and live editing.
 * TODO: Donut and gap modifiers (see code comments).
 */
class PieChart extends ChartCore {
    constructor(canvas, config) {
        super(canvas, config);
        this._pieSegments = [];
    }
    /**
     * Draw the pie chart.
     * @param {number} progress - Animation progress (0 to 1)
     */
    draw(progress) {
        const { labels, datasets } = this.config.data;
        // TODO: Donut and gap modifiers for pie charts (see previous implementation)
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        const data = datasets[0].data;
        let colors = datasets[0].backgroundColor;
        if (!Array.isArray(colors) || colors.length < data.length) {
            // Generate a default palette
            colors = [];
            for (let i = 0; i < data.length; i++) {
                const hue = Math.round((i * 360) / data.length);
                colors.push(`hsl(${hue}, 70%, 55%)`);
            }
        }
        const total = data.reduce((a, b) => a + b, 0);
        let startAngle = 0;
        const cx = this.width / 2;
        const cy = this.height / 2;
        const radius = Math.min(this.width, this.height) / 3;
        this._pieSegments = [];
        data.forEach((value, i) => {
            let angle = (value / total) * 2 * Math.PI * progress;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, startAngle + angle, false);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            // Store segment for tooltip
            this._pieSegments.push({
                label: labels[i],
                value,
                color: colors[i % colors.length],
                startAngle: startAngle,
                endAngle: startAngle + angle
            });
            startAngle += angle;
        });
        // Draw legend: one entry per slice
        this.drawLegend(labels.map((label, i) => ({ label, borderColor: colors[i % colors.length] })));
    }
    /**
     * Handle mouse hover for pie tooltips.
     * @param {MouseEvent} e
     */
    handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const cx = this.width / 2;
        const cy = this.height / 2;
        const radius = Math.min(this.width, this.height) / 3;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) {
            this.draw(this.animationProgress);
            return;
        }
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += 2 * Math.PI;
        let found = null;
        for (const seg of this._pieSegments) {
            if (angle >= seg.startAngle && angle <= seg.endAngle) {
                found = seg;
                break;
            }
        }
        this.draw(this.animationProgress);
        if (found) {
            const ctx = this.ctx;
            ctx.save();
            ctx.fillStyle = 'black';
            ctx.fillRect(cx + radius + 10, cy - 20, 100, 24);
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.fillText(`${found.label}: ${found.value}`, cx + radius + 15, cy - 5);
            ctx.restore();
        }
    }
}

/**
 * ChartFactory - Instantiates the correct chart type based on config.
 * Supports: bar, line, pie, mixed.
 */
class ChartFactory {
    /**
     * Create a chart instance.
     * @param {HTMLCanvasElement} canvas
     * @param {Object} config
     * @returns {ChartCore}
     */
    static create(canvas, config) {
        let type = config.type;
        let data = config.data;
        // Map multi-line to line for multi-series line charts
        if (type === 'multi-line') type = 'line';
        // Multi-series for line/bar: data is array of datasets
        if ((type === 'line' || type === 'bar') && Array.isArray(data) && typeof data[0] === 'object' && Array.isArray(data[0].data)) {
            config.data = { labels: config.labels, datasets: data };
        } else if (type === 'pie') {
            // Pie expects a single dataset with .data and .backgroundColor
            config.data = { labels: config.labels, datasets: [{ data: data, backgroundColor: config.backgroundColor }] };
        } else {
            config.data = { labels: config.labels, datasets: [{ data: data }] };
        }
        switch (type) {
            case 'bar':
                return new BarChart(canvas, config);
            case 'line':
                return new LineChart(canvas, config);
            case 'pie':
                return new PieChart(canvas, config);
            case 'mixed':
                // Mixed: bar and line datasets
                return new BarChart(canvas, config);
            default:
                throw new Error('Unknown chart type: ' + type);
        }
    }
}

// Export library
window.MyChart = ChartFactory;

// Add global drawChart function for index.html demo
typeof window.drawChart === 'undefined' && (window.drawChart = (type, labels, data, canvasId, options) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    // Simple color palette
    const palette = ['#3b82f6', '#ef4444', '#f59e42', '#10b981', '#6366f1', '#f43f5e'];
    let config;
    // Map multi-line to line for multi-series line charts
    if (type === 'multi-line') type = 'line';
    // Multi-series for line/bar: data is array of datasets
    if ((type === 'line' || type === 'bar') && Array.isArray(data) && typeof data[0] === 'object' && Array.isArray(data[0].data)) {
        config = {
            type: type,
            data: {
                labels: labels,
                datasets: data.map((ds, i) => ({
                    ...ds,
                    borderColor: ds.borderColor || palette[i % palette.length],
                    backgroundColor: ds.backgroundColor || palette[i % palette.length] + '88',
                    pointColor: ds.pointColor || palette[i % palette.length],
                    type: ds.type || type
                }))
            },
            options: options || undefined
        };
    } else if (type === 'stacked-bar') {
        config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: data.map((ds, i) => ({
                    ...ds,
                    backgroundColor: ds.backgroundColor || palette[i % palette.length],
                    type: 'bar',
                }))
            },
            options: options || { stacked: true }
        };
    } else if (type === 'mixed') {
        config = {
            type: 'mixed',
            data: {
                labels: labels,
                datasets: data.map((ds, i) => ({
                    ...ds,
                    backgroundColor: ds.backgroundColor || palette[i % palette.length],
                    borderColor: ds.borderColor || palette[i % palette.length],
                    pointColor: ds.pointColor || palette[i % palette.length],
                }))
            }
        };
    } else if (type === 'pie') {
        config = {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: palette,
                    borderColor: '#fff',
                    label: 'Pie',
                }]
            }
        };
    } else {
        config = {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    type: type,
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    data: data,
                    borderColor: palette[0],
                    backgroundColor: palette[0] + '88',
                    pointColor: palette[0],
                }]
            }
        };
    }
    // Clear previous chart
    if (canvas._chartInstance && typeof canvas._chartInstance.destroy === 'function') {
        canvas._chartInstance.destroy();
    }
    // Create new chart
    canvas._chartInstance = ChartFactory.create(canvas, config);
});
