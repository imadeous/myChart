# 📊 MyChart.js

A lightweight, object-oriented JavaScript charting library inspired by Chart.js. Built from scratch using the HTML5 `<canvas>` API and styled with Tailwind CSS, it supports animated and interactive Bar, Line, Pie, and Mixed charts.

---

## ✨ Demo

Open `index.html` in your browser for a full-featured playground UI:

![MyChart.js Demo Screenshot](demo-screenshot.png) <!-- Add a screenshot if available -->

---

## 🚀 Features

- ✅ Bar, Line, Pie, and Mixed (bar+line) charts
- 📊 Multi-series and stacked bar/line support
- 🖱 Interactive tooltips (including pie charts)
- 🖌 Per-series color pickers and alpha (opacity) sliders
- 🏷 Y-axis label support (customizable)
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
- Edit data, labels, colors, and opacity live
- Set a Y-axis label (for bar/line/mixed)
- Toggle animation
- Export the chart as PNG
- See tooltips and legends for all chart types

---

## ⚙️ Chart Configuration

Each chart is configured with a config object. Example for a multi-series bar chart:

```js
const config = {
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Product A',
        data: [30, 40, 35, 50],
        backgroundColor: 'rgba(59,130,246,0.7)', // Any CSS color, including alpha
        borderColor: '#3b82f6',
        pointColor: '#3b82f6',
        type: 'bar'
      },
      {
        label: 'Product B',
        data: [20, 25, 30, 35],
        backgroundColor: 'rgba(245,158,66,0.5)',
        borderColor: '#f59e42',
        pointColor: '#f59e42',
        type: 'bar'
      }
    ]
  },
  options: {
    stacked: true, // For stacked bar/line
    yAxisLabel: 'Revenue ($)', // Y-axis label
    // donut, gap (for pie): TODO
  }
};
```

- `backgroundColor`, `borderColor`, and `pointColor` accept any valid CSS color (hex, rgb, rgba, etc).
- `yAxisLabel` (in `options`) sets the vertical Y-axis label.
- For Pie charts, use an array for `backgroundColor` to set per-slice colors.

---

## 🧩 How It Works

- **OOP Design:** Each chart type is a class extending a common `ChartCore` base.
- **Rendering:** Uses the HTML5 Canvas API for all drawing and animation.
- **Responsive:** Canvas resizes with the container; fixed width/height for crisp rendering.
- **UI:** Built with Tailwind CSS for a modern, mobile-first look.
- **Live Editing:** All changes in the UI update the chart instantly.

---

## 🛠 Customization & Extensibility

- Add new chart types by extending `ChartCore`.
- Customize tooltips, legends, and axis rendering in the respective methods.
- Easily style the UI with Tailwind utility classes.

---

## ❓ FAQ / Troubleshooting

- **Why is my chart blurry?**
  - Make sure the canvas `width` and `height` attributes match its display size for crisp rendering.
- **How do I set opacity?**
  - Use the alpha slider in the UI, or set an `rgba()` color in your config.
- **How do I add a Y-axis label?**
  - Use the Y-axis label input in the UI, or set `options.yAxisLabel` in your config.
- **Pie chart donut/gap?**
  - Not yet implemented (see code comments for TODO).

---

## 🤝 Contributing

Pull requests and issues are welcome! Please open an issue for bugs or feature requests, or fork and submit a PR.

---

## 📄 License
MIT
