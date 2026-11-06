# SEERPAYANAM — Implementation Plan (Simulation Approach)

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Recharts + Leaflet
- **Backend:** Python FastAPI + SQLite
- **Real-time:** WebSockets
- **QR:** html5-qrcode (browser camera)
- **ML:** Pre-computed rule-based logic disguised as ML predictions

---

## Phase 1 — Foundation (Core Setup)

- Project scaffolding (React frontend + FastAPI backend)
- SQLite database schema (buses, routes, stops, passengers, cards, transactions)
- Seed data: 10 routes, 30 buses, 50 stops, demo passengers
- Basic API endpoints (buses, routes, passengers)
- Frontend routing: Passenger / Driver / Admin views
- Authentication: simple role-based login (admin, driver, passenger demo accounts)

**Deliverable:** App runs, login works, skeleton pages load.

---

## Phase 2 — Simulation Engine

- Backend simulation service that auto-runs on startup
- Buses "move" along routes on a timer (position updates every 5s)
- Passengers auto-board/alight at stops (randomized but realistic)
- Occupancy numbers update in real-time
- WebSocket broadcast: push bus state changes to all connected clients
- Simulation controls: start/pause/speed-up/reset via admin panel

**Deliverable:** Backend generates live-looking data without any real sensors.

---

## Phase 3 — Passenger App

- Digital smart card UI (name, ID, QR code, balance)
- QR code generation per passenger
- QR scanner page (conductor uses phone camera to scan)
- On scan: backend validates → updates passenger count → deducts fare
- Live bus list: shows all buses on passenger's route with crowd status (green/yellow/orange/red)
- Balance recharge simulation
- Transaction history

**Deliverable:** QR scan flow works end-to-end, crowd colors update live.

---

## Phase 4 — Driver Dashboard

- Minimal dashboard: bus number, route, current stop
- Live occupancy bar (fills up green → yellow → orange → red)
- Passenger count: boarded / alighted / current / capacity
- Capacity warning: visual alert + audio beep when bus hits 90%+
- Next stop info with expected boarding demand

**Deliverable:** Driver sees live crowd status, gets alerts at capacity.

---

## Phase 5 — Admin Dashboard

- Fleet overview: total buses, total passengers, overcrowded count
- Bus table: all buses with real-time occupancy, route, status
- Map view: buses plotted on Leaflet/OpenStreetMap moving along routes
- Alert panel: live alerts for overcrowding, bunching, high demand
- Dispatch panel: approve/reject system recommendations

**Deliverable:** Admin has a professional command-center view.

---

## Phase 6 — Prediction & Intelligence (Simulated ML)

- "ML Prediction" module: rule-based logic that looks at current occupancy trends + time of day + seeded patterns → outputs predictions
- Overcrowding prediction: "Bus 18A will be full by Stop 7" (pre-scripted triggers)
- Bus stop demand estimation: show expected passengers at upcoming stops
- Bus bunching detection: flag when 2 buses on same route are too close
- Recommendations engine: "Deploy 1 additional bus on Route 5" based on thresholds
- Display predictions on admin dashboard with charts

**Deliverable:** Dashboard shows "AI predictions" that fire on cue during demo.

---

## Phase 7 — Festival & Special Events

- Festival database: Pongal, Deepavali, Tamil New Year with associated demand multipliers
- Admin selects a festival → simulation engine spikes demand on affected routes
- Prediction panel shows: "Expected 2.3x demand on Routes 5, 12, 18"
- Auto-generates dispatch recommendations for festival days
- Historical comparison chart (normal vs festival demand)

**Deliverable:** Admin triggers festival mode, system responds with smart recommendations.

---

## Phase 8 — Multimodal & Polish

- Alternative transport suggestions when buses are full (metro stations, suburban rail)
- Passenger app shows: "Bus 18A is full → Take Metro from Koyambedu (0.5 km walk)"
- Nearby metro/rail stations plotted on map
- UI polish: loading states, animations, toast notifications, responsive design
- Dark theme for admin, light theme for passenger
- Demo scenario script: a repeatable 5-minute walkthrough that hits every feature

**Deliverable:** Complete, demo-ready prototype.

---

## Priority If Time Runs Out

| Must Have | Nice to Have | Can Skip |
|---|---|---|
| Phase 1-4 (foundation + sim + passenger + driver) | Phase 5-6 (admin dashboard + predictions) | Phase 8 multimodal suggestions |
| QR scan working | Map with moving buses | Historical comparison charts |
| Live occupancy updates | Festival mode | Suburban rail integration |
| Crowd color indicators | Bus bunching detection | Balance recharge flow |

---

## Demo Flow (5 minutes)

1. **Passenger** opens app → shows smart card + QR code
2. **Conductor** scans QR → passenger count goes up → fare deducted
3. **Driver** sees occupancy rising → gets alert at capacity
4. **Admin** sees fleet overview → prediction says "overcrowding in 10 min"
5. **Admin** approves "deploy extra bus" recommendation
6. **Admin** enables "Pongal mode" → demand spikes → more recommendations
7. **Passenger** sees "bus full" → app suggests nearby metro alternative

---

## Estimated Time Split

| Phase | Time |
|---|---|
| Phase 1 — Foundation | 3 hrs |
| Phase 2 — Simulation Engine | 2 hrs |
| Phase 3 — Passenger App | 3 hrs |
| Phase 4 — Driver Dashboard | 2 hrs |
| Phase 5 — Admin Dashboard | 3 hrs |
| Phase 6 — Predictions | 3 hrs |
| Phase 7 — Festival Mode | 2 hrs |
| Phase 8 — Polish & Multimodal | 3 hrs |
| **Buffer + Testing** | **3 hrs** |
| **Total** | **~24 hrs** |
