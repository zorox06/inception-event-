# FarmState — Hand-Drawn Living Farming City

**An autonomous AI mayor runs a living farming city in real time. No human hands on the controls — the agent decides (powered by `gemma-4-31B`), a deterministic engine resolves consequences on a Clash-of-Clans-style build timer, and Reactor renders the world as it happens.**

---

## 🎨 Hand-Drawn Design System

- **Warm Paper Background**: `#fdfbf7` with `radial-gradient` notebook dot grid.
- **Pencil Borders**: `#2d2d2d` with organic wobbly radii (`.wobbly-md`).
- **Typography**: `Kalam` (Headings) & `Patrick Hand` (Body text).
- **Hard Offset Shadows**: `box-shadow: 4px 4px 0px 0px #2d2d2d` (buttons press flat on click).
- **Physical Media Accents**: Translucent tape strips, colored thumbtacks, and multi-colored post-it note cards.
- **Active Model**: `gemma-4-31B`.

---

## 🚀 Quick Start

```bash
# Terminal 1: Backend Server (port 3001)
npm run dev:backend

# Terminal 2: Frontend App (port 5173)
npm run dev:frontend
```

Open **`http://localhost:5173/`** in your browser.
