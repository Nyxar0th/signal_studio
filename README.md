# Signal Studio

A tiny control room for live signals.

Signal Studio is an internal-style monitoring dashboard that visualizes system signals as motion and color instead of plain logs.
It focuses on low-noise realtime updates, lightweight animations, and clear patterns.

## Features

Live or Mock Data:
- Mock mode: local simulated signals with smooth motion updates
- Live mode: WebSocket live stream (Node server)
- Toggle instantly from the header

Realtime Dashboard:
- Animated metric transitions
- Mini sparkline charts
- Load, latency, and error rate visualization
- Per-service trend history
- Status pills (Healthy / Degraded / Down)

Alerts:
- Configurable alert thresholds
- Card-level alert highlighting
- Centralized Alerts tab with active alert list
- Per-signal detail page showing state transitions

Event Timeline:
- Detects spikes: load, latency, error
- Detects status changes
- Timeline appears inside signal detail modal
- Tracks recent service behavior

Streams View:
- Update interval analytics
- Messages per second
- Average update interval
- Interval sparkline
- Live/Mock mode detection
- Shows warnings if WebSocket is not receiving data

Settings Panel:
- Adjustable alert thresholds
- Adjustable timeline spike thresholds
- Auto-saves to localStorage
- Affects both Alerts & Event Timeline

Dashboard Shell:
- Sidebar navigation
- Overview / Streams / Alerts / Settings
- Responsive layout
- Clean dark-muted UI theme

## Architecture

client/ - Vite + React + Tailwind + Framer Motion
server/ - Node WebSocket server (mock signal stream)

## Local Development

Start WebSocket server:
cd server
npm install
npm run dev

Start client:
cd client
npm install
npm run dev

## Build

cd client
npm run build

## Deployment

Client:
- Deploy client/ to Vercel
- Set env var VITE_WS_URL=wss://yourserver.com

Server:
- Deploy server/ to Railway or Render
- Expose WebSocket port 8080