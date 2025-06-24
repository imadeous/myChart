// Updated ChartCore to support multiple Y axes (left & right)
class ChartCore {
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
        this._lastParentWidth = null; // Track last parent width
        this.init();
    }

    init() {
        // this.resize(); // REMOVE this line to prevent repeated resizing
        requestAnimationFrame(this.animate.bind(this));
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', this.handleHover.bind(this));
    }

    resize() {
        const parentWidth = this.canvas.parentElement.clientWidth;
        if (this._lastParentWidth === parentWidth) return; // Only resize if parent width changed
        this._lastParentWidth = parentWidth;
        this.canvas.width = parentWidth;
        this.canvas.height = parentWidth * 0.6;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.graphWidth = this.width - 2 * this.padding;
        this.graphHeight = this.height - 2 * this.padding;
        requestAnimationFrame(this.animate.bind(this));
    }

    animate(timestamp) {
        if (!this.animationStart) this.animationStart = timestamp;
        const elapsed = timestamp - this.animationStart;
        this.animationProgress = Math.min(elapsed / this.animationDuration, 1);
        this.draw(this.animationProgress);
        if (this.animationProgress < 1) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    // Calculates max for left and right axes
    getAxisMaxValues() {
        let datasets = this.config.data.datasets;
        const options = this.config.options || {};
        let leftMax = 0, rightMax = 0;
        // Stacked bar: max is the sum of all bar values at each X
        if (options.stacked) {
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
            datasets.forEach(ds => {
                if (!ds || !Array.isArray(ds.data)) return;
                const maxVal = Math.max(...ds.data);
                if (ds.yAxis === 'right') rightMax = Math.max(rightMax, maxVal);
                else leftMax = Math.max(leftMax, maxVal);
            });
        }
        return { leftMax, rightMax };
    }

    drawAxes(maxLeft, maxRight, labels, spacingX) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#E5E7EB';
        ctx.fillStyle = '#4B5563';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';

        // Calculate a 'nice' yStep for the axis
        function niceStep(max, targetSteps = 7) {
            if (!max || max < 1) return 1;
            const rough = max / targetSteps;
            const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
            const nice = [1, 2, 5, 10];
            let step = pow10;
            for (let n of nice) {
                if (rough <= n * pow10) {
                    step = n * pow10;
                    break;
                }
            }
            return step;
        }
        const yStep = niceStep(maxLeft);
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
            const yStepR = niceStep(maxRight);
            for (let y = 0; y <= maxRight; y += yStepR) {
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

        // Y-axis label (if provided)
        const yAxisLabel = this.config.options && this.config.options.yAxisLabel;
        if (yAxisLabel) {
            ctx.save();
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.translate(this.padding - 40, this.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(yAxisLabel, 0, 0);
            ctx.restore();
        }

        // X-axis labels
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'center';
        labels.forEach((label, i) => {
            const x = this.padding + i * spacingX;
            ctx.fillText(label, x, this.height - this.padding + 20);
        });
    }

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

    exportPNG() {
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

/**
 * Chart dataset color configuration:
 * - backgroundColor: string | string[] (any valid CSS color, including rgba/hex with alpha)
 * - borderColor: string (any valid CSS color)
 * - pointColor: string (any valid CSS color)
 *
 * Example:
 * {
 *   label: 'My Series',
 *   data: [1,2,3],
 *   backgroundColor: 'rgba(59,130,246,0.5)',
 *   borderColor: '#3b82f6',
 *   pointColor: '#3b82f6cc'
 * }
 */

// Additional work: LineChart and BarChart will be updated to use getAxisMaxValues() and respect yAxis config.
// Stacked bar + SVG export will follow in next commits.

class LineChart extends ChartCore {
    draw(progress) {
        const { labels, datasets } = this.config.data;
        const spacingX = this.graphWidth / (labels.length - 1);
        const ctx = this.ctx;
        const allPoints = [];
        const { leftMax, rightMax } = this.getAxisMaxValues();
        ctx.clearRect(0, 0, this.width, this.height);
        this.drawAxes(leftMax, rightMax, labels, spacingX);

        const smoothness = (this.config.options && this.config.options.smoothness) ? this.config.options.smoothness : 1;
        // Clamp smoothness between 1 and 10
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
                    // Calculate control points
                    const prevVal = ds.data[i - 1];
                    const prevX_ = this.padding + (i - 1) * spacingX;
                    const prevY_ = this.height - this.padding - (prevVal / leftMax) * this.graphHeight * progress;
                    // Tension: 0 (pointy) to 0.5 (very curvy)
                    const t = (s - 1) / 18; // max 0.5 at s=10
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

class BarChart extends ChartCore {
    draw(progress) {
        const { labels, datasets } = this.config.data;
        const options = this.config.options || {};
        const stacked = options.stacked || false;
        const ctx = this.ctx;

        // Dynamically calculate spacingX so all bar groups fit
        const spacingX = this.graphWidth / labels.length;
        const groupSpacing = 0; // No extra group spacing needed with dynamic spacing
        const barSpacing = 10;

        const { leftMax, rightMax } = this.getAxisMaxValues();

        ctx.clearRect(0, 0, this.width, this.height);
        this.drawAxes(leftMax, rightMax, labels, spacingX + groupSpacing);

        // Prepare cumulative heights for stacked bars on each axis
        let cumHeightsLeft = new Array(labels.length).fill(0);
        let cumHeightsRight = new Array(labels.length).fill(0);

        // Filter bar datasets for grouped spacing calculation
        const barDatasets = datasets.filter(ds => ds.type === 'bar');
        const numBarDatasets = barDatasets.length;

        labels.forEach((label, i) => {
            const baseX = this.padding + i * spacingX;

            datasets.forEach(ds => {
                if (!ds || !Array.isArray(ds.data)) return; // Prevent undefined errors
                const val = ds.data[i];
                if (val == null) return;

                const axis = ds.yAxis === 'right' ? 'right' : 'left';
                const maxValue = axis === 'right' ? rightMax : leftMax;

                if (ds.type === 'bar') {
                    if (stacked) {
                        const cumHeight = axis === 'right' ? cumHeightsRight[i] : cumHeightsLeft[i];
                        const height = (val / maxValue) * this.graphHeight * progress;
                        const x = baseX + barSpacing;
                        const y = this.height - this.padding - height - cumHeight;
                        const w = spacingX - 2 * barSpacing;

                        ctx.fillStyle = Array.isArray(ds.backgroundColor)
                            ? ds.backgroundColor[i % ds.backgroundColor.length]
                            : ds.backgroundColor || ds.borderColor;

                        ctx.fillRect(x, y, w, height);

                        if (progress === 1) {
                            ctx.fillStyle = '#1F2937';
                            ctx.textAlign = 'center';
                            ctx.fillText(val, x + w / 2, y - 6);
                        }

                        if (axis === 'right') cumHeightsRight[i] += height;
                        else cumHeightsLeft[i] += height;
                    } else {
                        // Grouped bars
                        const barIndex = barDatasets.indexOf(ds);
                        const w = (spacingX / numBarDatasets) - 2 * barSpacing;
                        const x = baseX + barIndex * (spacingX / numBarDatasets) + barSpacing;
                        const height = (val / maxValue) * this.graphHeight * progress;
                        const y = this.height - this.padding - height;

                        ctx.fillStyle = Array.isArray(ds.backgroundColor)
                            ? ds.backgroundColor[i % ds.backgroundColor.length]
                            : ds.backgroundColor || ds.borderColor;

                        ctx.fillRect(x, y, w, height);

                        if (progress === 1) {
                            ctx.fillStyle = '#1F2937';
                            ctx.textAlign = 'center';
                            ctx.fillText(val, x + w / 2, y - 6);
                        }
                    }
                } else if (ds.type === 'line') {
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

class PieChart extends ChartCore {
    constructor(canvas, config) {
        super(canvas, config);
        this._pieSegments = [];
    }

    draw(progress) {
        const { labels, datasets } = this.config.data;
        const options = this.config.options || {};
        // Donut: percent of radius (0-80)
        const donutPercent = Math.max(0, Math.min(80, options.donut || 0));
        const gapDeg = Math.max(0, Math.min(20, options.gap || 0));
        const gapRad = gapDeg * Math.PI / 180;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        const data = datasets[0].data;
        // Ensure colors array for each slice
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
        // Donut: inner radius as percent of outer radius
        const innerRadius = donutPercent > 0 ? radius * (donutPercent / 100) : 0;
        this._pieSegments = [];

        data.forEach((value, i) => {
            let angle = (value / total) * 2 * Math.PI * progress;
            // Limit gap to not exceed slice angle
            const actualGap = Math.min(gapRad, angle * 0.8);
            const sliceStart = startAngle + actualGap / 2;
            const sliceEnd = startAngle + angle - actualGap / 2;
            ctx.beginPath();
            if (innerRadius > 0) {
                // Draw donut slice
                ctx.arc(cx, cy, radius, sliceStart, sliceEnd, false);
                ctx.arc(cx, cy, innerRadius, sliceEnd, sliceStart, true);
            } else {
                // Draw pie slice
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, sliceStart, sliceEnd, false);
            }
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            // Store segment for tooltip
            this._pieSegments.push({
                label: labels[i],
                value,
                color: colors[i % colors.length],
                startAngle: sliceStart,
                endAngle: sliceEnd
            });
            startAngle += angle;
        });

        // Draw legend: one entry per slice
        this.drawLegend(labels.map((label, i) => ({ label, borderColor: colors[i % colors.length] })));
    }

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
            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            const tooltip = `${found.label}: ${found.value}`;
            const tw = ctx.measureText(tooltip).width + 16;
            const th = 28;
            let tx = mouseX + 10;
            let ty = mouseY - th / 2;
            if (tx + tw > this.width) tx = this.width - tw - 10;
            if (ty < 0) ty = 10;
            ctx.beginPath();
            ctx.rect(tx, ty, tw, th);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(tooltip, tx + 8, ty + 19);
            ctx.restore();
        }
    }
}

// Extend ChartCore with multi-axis support as done earlier (not repeated here)

// MixedChart implementation
class MixedChart extends ChartCore {
    draw(progress) {
        const { labels, datasets } = this.config.data;
        const options = this.config.options || {};
        const stacked = options.stacked || false;
        const ctx = this.ctx;

        const spacingX = 80;
        const groupSpacing = 40;
        const barSpacing = 10;

        const { leftMax, rightMax } = this.getAxisMaxValues();

        ctx.clearRect(0, 0, this.width, this.height);
        this.drawAxes(leftMax, rightMax, labels, spacingX + groupSpacing);

        // Prepare cumulative heights for stacked bars on each axis
        let cumHeightsLeft = new Array(labels.length).fill(0);
        let cumHeightsRight = new Array(labels.length).fill(0);

        // Filter bar datasets for grouped spacing calculation
        const barDatasets = datasets.filter(ds => ds.type === 'bar');
        const numBarDatasets = barDatasets.length;

        labels.forEach((label, i) => {
            const baseX = this.padding + i * (spacingX + groupSpacing);

            datasets.forEach(ds => {
                if (!ds || !Array.isArray(ds.data) || typeof ds.data[i] === 'undefined') return; // Robust guard
                const val = ds.data[i];
                if (val == null) return;

                const axis = ds.yAxis === 'right' ? 'right' : 'left';
                const maxValue = axis === 'right' ? rightMax : leftMax;

                if (ds.type === 'bar') {
                    if (stacked) {
                        const cumHeight = axis === 'right' ? cumHeightsRight[i] : cumHeightsLeft[i];
                        const height = (val / maxValue) * this.graphHeight * progress;
                        const x = baseX + barSpacing;
                        const y = this.height - this.padding - height - cumHeight;
                        const w = spacingX - 2 * barSpacing;

                        ctx.fillStyle = Array.isArray(ds.backgroundColor)
                            ? ds.backgroundColor[i % ds.backgroundColor.length]
                            : ds.backgroundColor || ds.borderColor;

                        ctx.fillRect(x, y, w, height);

                        if (progress === 1) {
                            ctx.fillStyle = '#1F2937';
                            ctx.textAlign = 'center';
                            ctx.fillText(val, x + w / 2, y - 6);
                        }

                        if (axis === 'right') cumHeightsRight[i] += height;
                        else cumHeightsLeft[i] += height;
                    } else {
                        // Grouped bars
                        const barIndex = barDatasets.indexOf(ds);
                        const w = (spacingX / numBarDatasets) - 2 * barSpacing;
                        const x = baseX + barIndex * (spacingX / numBarDatasets) + barSpacing;
                        const height = (val / maxValue) * this.graphHeight * progress;
                        const y = this.height - this.padding - height;

                        ctx.fillStyle = Array.isArray(ds.backgroundColor)
                            ? ds.backgroundColor[i % ds.backgroundColor.length]
                            : ds.backgroundColor || ds.borderColor;

                        ctx.fillRect(x, y, w, height);

                        if (progress === 1) {
                            ctx.fillStyle = '#1F2937';
                            ctx.textAlign = 'center';
                            ctx.fillText(val, x + w / 2, y - 6);
                        }
                    }
                } else if (ds.type === 'line') {
                    ctx.strokeStyle = ds.borderColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    for (let k = 0; k < ds.data.length; k++) {
                        // Align line X to center of bar group
                        const x = this.padding + k * (spacingX + groupSpacing) + (spacingX + groupSpacing) / 2;
                        const yVal = ds.data[k];
                        if (yVal == null) continue;
                        const y = this.height - this.padding - (yVal / maxValue) * this.graphHeight * progress;
                        if (k === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    // Draw points
                    for (let k = 0; k < ds.data.length; k++) {
                        const x = this.padding + k * (spacingX + groupSpacing) + (spacingX + groupSpacing) / 2;
                        const yVal = ds.data[k];
                        if (yVal == null) continue;
                        const y = this.height - this.padding - (yVal / maxValue) * this.graphHeight * progress;
                        ctx.fillStyle = ds.pointColor;
                        ctx.beginPath();
                        ctx.arc(x, y, 5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });
        });

        this.drawLegend(datasets);
    }
}

// Updated ChartFactory
class ChartFactory {
    static create(canvas, config) {
        switch (config.type) {
            case 'line':
                return new LineChart(canvas, config);
            case 'bar':
                return new BarChart(canvas, config);
            case 'pie':
                return new PieChart(canvas, config);
            case 'mixed':
                return new MixedChart(canvas, config);
            default:
                throw new Error('Unknown chart type: ' + config.type);
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
                    backgroundColor: ds.backgroundColor || (palette[i % palette.length] + '88'),
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
