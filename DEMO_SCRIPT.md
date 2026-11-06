# SEERPAYANAM (TN-ITIS) — Hackathon 5-Minute Presentation Script

## Pre-Demo Setup

### Option 1: Double-Click 1-Click Launcher (Easiest)
Simply double-click:
`c:\Users\acer\Downloads\SRM Hackthon\run.bat` (or `CrowdMove\run.bat`)
This opens both the Backend and Frontend in separate windows automatically!

### Option 2: Manual Terminal Commands
```powershell
# Terminal 1 — Backend (FastAPI + ML Model + Auto-Simulation)
cd "C:\Users\acer\Downloads\SRM Hackthon\CrowdMove\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Frontend (Vite + React)
cd "C:\Users\acer\Downloads\SRM Hackthon\CrowdMove\frontend"
npm.cmd run dev
```

Open `http://localhost:5173` in your browser. All 4 portals are accessible directly from the top universal navigation bar:
- 🎫 **Passenger Portal:** `http://localhost:5173/passenger`
- 📲 **Conductor Scanner:** `http://localhost:5173/scanner`
- 🚦 **Driver HUD:** `http://localhost:5173/driver`
- 🖥️ **Admin Command Center:** `http://localhost:5173/admin`

---

## ⏱️ Minute-by-Minute Pitch Script

### Minute 0:00 - 0:45: The Problem & Solution Overview
> "Judges, in Tamil Nadu and Chennai, MTC carries millions of commuters daily, but current operations are completely reactive. Buses bunch together, 15-20% of trips suffer extreme overcrowding, and conductors only know how many tickets were sold, not who is waiting at upcoming stops.
> 
> We built **TN-ITIS (Tamil Nadu Integrated Transit Intelligence System)**. Using real March 2026 ETM datasets, MTC shapefiles, and Chennai Metro networks from Theme 4, TN-ITIS predicts overcrowding 15-45 minutes ahead, monitors live occupancy, detects bunching, and automates operational responses."

---

### Minute 0:45 - 1:30: Smart Passenger Card & Conductor Scanner (Sections 2 & 3)
1. **Passenger Tab**:
   - Show the **Tamil Nadu Universal Smart Pass** (`TN-MTC-2026-0001`).
   - Mention: *"Designed for high accessibility like a ration card — citizens without smartphones carry a physical NFC/RFID card; smartphone users have this digital pass with QR code."*
2. **Conductor Scanner Tab (`/scanner`)**:
   - Select active bus `TN01-N-159-01`.
   - Click **"⚡ Priya (Pass 0001)"** (or scan camera QR).
   - Show instant ₹10 fare deduction, real-time passenger count update, and live WebSocket sync.

---

### Minute 1:30 - 2:30: Driver HUD & Operational Thresholds (Sections 3 & 10)
1. **Driver HUD Tab**:
   - Show the distraction-free driver screen.
   - Point out the circular occupancy gauge, current passengers (seats vs total capacity), and upcoming stop boarding demand.
   - Mention the safety design: *"The driver remains responsible for door operation — the system does not dangerously automate doors, but triggers a Web Audio beep and visual red warning when capacity hits 90%."*

---

### Minute 2:30 - 3:30: Real Machine Learning Model & Live Predictions (Sections 4 & 5)
1. **Admin Dashboard -> "AI/ML Model & Data" Tab**:
   - Show the trained **RandomForestRegressor**:
     - Trained on **480,000 sampled tickets from 31 daily files (68M records)** of March 2026 ETM data.
     - **MAE = 9.12 passengers/stop** (meeting the target < 10 pax KPI).
     - **Feature Importances**: Corridor (34%), Stop Stage (28%), Hour of Day (23%), Day of Week (12%).
   - Show the **Interactive ML Sandbox**: Pick Route 159, 9:00 AM peak hour, click *"Run Inference"* to show predicted stop boarding demand in real time.
2. **Admin Dashboard -> "Predictions" Tab**:
   - Point out stop-level projected occupancy:
     *"The model predicts Bus TN01-N-159-01 will reach full capacity at M.G.R. Koyambedu 3 stops before it arrives, giving operators enough time to act."*

---

### Minute 3:30 - 4:15: Bus Bunching Detection & Proactive Dispatch (Sections 6 & 11)
1. **Admin Dashboard -> "Dispatch & Bunching" Tab**:
   - Show the system recommendation: *"Hold lead bus at Stop 3 for 3 minutes to restore 8-minute headway interval."*
   - Show the dispatch recommendation: *"Deploy additional standby bus on Route 159."*
   - Click **"Dispatch Bus"** -> standby bus from depot is immediately activated and appears on the live OpenStreetMap!
2. **Configure Capacity**:
   - Switch to **"Fleet & Capacity"** tab -> click *"Config"* on any bus to demonstrate configuring total & seated capacity on the fly.

---

### Minute 4:15 - 5:00: Festival Surge & Multimodal Coordination (Sections 7 & 8)
1. **Admin Dashboard -> "Festivals" Tab**:
   - Activate **"Pongal Festival"** (2.5x multiplier).
   - Watch the surge comparison chart show +150% demand on CMBT Koyambedu & Kilambakkam corridors.
2. **Passenger App -> "Live Buses" Tab**:
   - For a full or orange bus, click **"Show nearby Metro/Rail"**.
   - App displays nearest Chennai Metro Green/Blue line stations with walking distance and estimated journey time.
3. **Closing Statement**:
   > "By unifying real ETM ticketing logs, machine learning, smart cards, and multimodal transport, TN-ITIS moves public transit from reactive firefighting to predictive intelligence. Thank you!"
