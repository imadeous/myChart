# 📊 MyChart.js

A lightweight, object-oriented JavaScript charting library inspired by Chart.js. Built from scratch using the HTML5 `<canvas>` API and styled with Tailwind CSS, it supports animated and interactive Bar, Line, Pie, and Mixed charts.

---

## 🚀 Features

- ✅ Bar, Line, Pie, and Mixed (bar+line) charts
- 📊 Multi-series and stacked bar/line support
- 🖱 Interactive tooltips (including pie charts)
- 🖌 Per-series color pickers
- 🌀 Smooth animations with toggle
- 🌙 Dark mode toggle
- 🖼 Export as PNG image
- 📐 Auto-resizing and fully responsive (mobile-first)
- 🧱 Extensible OOP architecture
- 📝 Live dataset editing: add/remove/rename series and labels
- 🎨 Modern UI with Tailwind CSS
- 📋 Pie chart: color legend for each slice
- ⚠️ Donut and gap modifiers for pie charts: **TODO** (see code comments)

---

## 📦 Installation

### Option A: Via CDN (recommended)
Upload `mychart.min.js` to GitHub and use with jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/gh/yourusername/mychart/mychart.min.js"></script>
```

### Option B: Local
Copy `myChart.js` and include in your HTML:

```html
<script src="myChart.js"></script>
```

---

## 🛠 Usage

Open `index.html` in your browser. Use the UI to:
- Select chart type (Bar, Line, Pie, Mixed)
- Edit data, labels, and colors live
- Toggle dark mode and animation
- Export the chart as PNG
- See tooltips and legends for all chart types

---

## 📝 Development Notes
- Donut and gap modifiers for pie charts are a TODO (see code comments for future implementation).
- All chart and UI updates are live and immediate.

---

## 📄 License
MIT
