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

client/ – Vite + React + Tailwind + Framer Motion  
server/ – Node WebSocket server (mock signal stream)

## Local Development

### Start WebSocket server
cd server  
npm install  
npm run dev  

Runs at: ws://localhost:8080

### Start client
cd client  
npm install  
npm run dev  

Open http://localhost:5173

### Switch between live & mock mode
Use the toggle in the header (Mock / Live).

## Build

cd client  
npm run build

Output is in client/dist.

## Deployment

### Client (Vercel)
- Deploy the client folder as a Vite project  
- Add env var: VITE_WS_URL=wss://your-production-websocket-url  

### Server (Railway or Render)
- Deploy the Node WebSocket server  
- Expose port 8080  
- This becomes your production WebSocket URL  

## Environment Variables

Create `client/.env` when deploying:

VITE_WS_URL=wss://your-production-websocket-url

If not set, the client defaults to:

ws://localhost:8080

## License

MIT License

"""