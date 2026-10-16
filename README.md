# AquaFarm Command - 3D Interactive Aquaculture Dashboard

An interactive, single-file 3D aquaculture farming management dashboard built with Three.js. Features low-poly isometric aquaculture ponds, animated workers patrolling pond embankments, working paddlewheel aerators, day/night cycles, weather simulation, and live farm telemetry.

![AquaFarm Command Dashboard](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)
![HTML5](https://img.shields.io/badge/HTML5-Single--File-orange?logo=html5)
![CSS3](https://img.shields.io/badge/CSS3-Frosted--Glass-blue?logo=css3)

---

## 🌟 Key Features

- **Low-Poly 3D Isometric World**: 4 rectangular earthen aquaculture ponds with realistic water shaders, paddlewheel aerators with water spray particles, feeder barges, sluice gates, and generator sheds.
- **Animated Embankment Workers**: Humanoid 3D worker models patrolling the earthen dykes and walkways between ponds with walking animations.
- **Interactive Controls**:
  - **Pan**: Left-click drag (desktop) / 1-finger drag.
  - **Rotate**: Right-click drag (desktop).
  - **Zoom**: Mouse wheel / Smooth two-finger pinch-to-zoom (pinch outward to zoom in, inward to zoom out on touchscreens/mobile).
  - **Camera Glide**: Click any pond or building to smoothly glide camera focus to it.
- **Dynamic Atmosphere**:
  - **Day & Night Cycles**: Toggle between daylight sun and nocturnal moonlight with spotlight effects.
  - **4 Weather Modes**: Clear, Rain, Overcast, Storm with dynamic particle systems and lighting changes.
  - **Quick Camera Locations**: Switch focus between Ponds 01–04, Hatchery, and Processing Station.
- **Glassmorphism UI**:
  - Top bar with farm stats, live clock, weather selector, and day/night toggles.
  - 3 Real-time KPI Cards (Dissolved Oxygen, Water Temp, Biomass Index).
  - Detailed side inspection panel showing live telemetry and active devices.
  - 6-stage operational cycle progress tracker (Stocking, Feeding, Aeration, Sampling, Harvesting, Purging).
  - Multi-tab data tables for Pond Water Quality, Feeding Schedules, Sensor Readings, and Alert Logs.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser, or serve it using any HTTP server:

```bash
# Python 3
python3 -m http.server 8080

# Node / npx
npx serve .
```

Then visit:
```
http://localhost:8080
```

---

## 🛠️ Tech Stack

- **Three.js (r128)** via CDN
- **OrbitControls** with customized smooth touch-gesture pinch zooming
- **Vanilla JavaScript & CSS** (No external build tools or dependencies required)
