# 📊 MyChart.js

A lightweight, object-oriented JavaScript charting library inspired by Chart.js. Built from scratch using the HTML5 `<canvas>` API and styled with Tailwind CSS, it supports animated and interactive Bar, Line, Pie, and Mixed charts.

---

## 🚀 Features

- ✅ Bar, Line, Pie, and Mixed (bar+line) charts
- 📊 Multi-series and stacked bar/line support
- 🖱 Interactive tooltips (including pie charts)
- 🖌 Per-series color pickers
- 🌀 Smooth animations with toggle
- 🖼 Export as PNG image
- 📐 Auto-resizing and fully responsive (mobile-first)
- 🧱 Extensible OOP architecture
- 📝 Live dataset editing: add/remove/rename series and labels
- 🎨 Modern UI with Tailwind CSS
- 📋 Pie chart: color legend for each slice
- ⚠️ Donut and gap modifiers for pie charts: **TODO** (see code comments)

---

## 📦 Installation

### Option A: Use from GitHub (recommended)
Add the following script tag to your HTML to use the latest version from the official repo:

```html
<script src="https://cdn.jsdelivr.net/gh/imadeous/myChart@latest/myChart.js"></script>
```

Or, for a specific release/tag:

```html
<script src="https://cdn.jsdelivr.net/gh/imadeous/myChart@v1.0.0/myChart.js"></script>
```

### Option B: Clone or Download
Clone the repository or download the files, then include in your HTML:

```html
<script src="myChart.js"></script>
```

---

## 🛠 Usage

Open `index.html` in your browser. Use the UI to:
- Select chart type (Bar, Line, Pie, Mixed)
- Edit data, labels, and colors live
- Toggle animation
- Export the chart as PNG
- See tooltips and legends for all chart types

---

## 📝 Development Notes
- Donut and gap modifiers for pie charts are a TODO (see code comments for future implementation).
- All chart and UI updates are live and immediate.
- Dark mode has been removed for simplicity.

---

## 📄 License
MIT
