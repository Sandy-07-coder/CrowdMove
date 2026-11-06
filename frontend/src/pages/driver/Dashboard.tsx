import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { busApi, type Bus } from '../../api';
import { useSimulation } from '../../hooks/useSimulation';
import CrowdBadge from '../../components/CrowdBadge';
import RoleNavbar from '../../components/RoleNavbar';
import { showToast } from '../../components/Toast';
import { AlertTriangle, LogOut, MapPin, Navigation, RefreshCw, Volume2, Plus, Minus, ShieldCheck, DoorClosed } from 'lucide-react';

interface StopInfo {
  id: number;
  name: string;
  stop_order: number;
  estimated_waiting: number;
}

interface RouteInfo {
  route_number: string;
  name: string;
  source: string;
  destination: string;
}

interface DriverBus extends Bus {
  route_info?: RouteInfo;
  stops?: StopInfo[];
}

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { buses: wsBuses } = useSimulation();
  const [bus, setBus] = useState<DriverBus | null>(null);
  const [driverBusId, setDriverBusId] = useState<number | null>(null);
  const [allBuses, setAllBuses] = useState<Bus[]>([]);
  const [error, setError] = useState('');
  const [manualDoorLock, setManualDoorLock] = useState(false);
  const alertPlayed = useRef(false);

  const playAlertSound = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.35;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.frequency.value = 660; }, 200);
      setTimeout(() => { osc.frequency.value = 880; }, 400);
      setTimeout(() => { osc.stop(); ctx.close(); }, 650);
      showToast('warning', '🔊 90% Overcrowding Audio Alarm Triggered');
    } catch {
      showToast('info', 'AudioContext is restricted or blocked by browser');
    }
  };

  const loadBusDetail = async (busId: number) => {
    try {
      const res = await busApi.get(busId);
      setBus(res.data as DriverBus);
      setDriverBusId(res.data.id);
      setError('');
    } catch {
      setError('Failed to fetch bus telemetry');
    }
  };

  const fetchBus = async () => {
    try {
      const allRes = await busApi.list(true);
      const activeList = allRes.data.filter(b => b.is_active);
      setAllBuses(activeList);
      if (activeList.length === 0) {
        setError('No active buses found in fleet');
        return;
      }

      let targetId: number = activeList[0].id;
      if (user) {
        try {
          const dRes = await busApi.byDriver(user.id);
          if (dRes.data) targetId = dRes.data.id;
        } catch {
          // Fall back gracefully to first active bus
        }
      }

      if (driverBusId) targetId = driverBusId;
      loadBusDetail(targetId);
    } catch {
      setError('Transit network connection error');
    }
  };

  useEffect(() => {
    fetchBus();
  }, [user]);

  useEffect(() => {
    if (wsBuses.length > 0) {
      const activeList = wsBuses.filter(b => b.is_active);
      setAllBuses(activeList);
      if (driverBusId) {
        const found = activeList.find(b => b.id === driverBusId);
        if (found) {
          setBus(prev => ({
            ...found,
            route_info: prev?.route_info,
            stops: prev?.stops,
          }));
        }
      }
    }
  }, [wsBuses, driverBusId]);

  useEffect(() => {
    if (!driverBusId) return;
    const interval = setInterval(() => {
      busApi.get(driverBusId).then(r => {
        const data = r.data as DriverBus;
        setBus(prev => prev ? { ...prev, route_info: data.route_info, stops: data.stops } : data);
      }).catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, [driverBusId]);

  useEffect(() => {
    if (bus && bus.occupancy_percent >= 90 && !alertPlayed.current) {
      alertPlayed.current = true;
      playAlertSound();
    }
    if (bus && bus.occupancy_percent < 90) {
      alertPlayed.current = false;
    }
  }, [bus]);

  const adjustPax = (delta: number) => {
    if (!bus) return;
    const newPax = Math.max(0, Math.min(bus.total_capacity + 10, bus.current_passengers + delta));
    const newPct = Math.round((newPax / bus.total_capacity) * 100);
    const newStatus = newPct >= 90 ? 'red' : newPct >= 75 ? 'orange' : newPct >= 50 ? 'yellow' : 'green';
    setBus(prev => prev ? {
      ...prev,
      current_passengers: newPax,
      occupancy_percent: newPct,
      crowd_status: newStatus,
    } : null);
    if (newPct >= 90 && !alertPlayed.current) {
      alertPlayed.current = true;
      playAlertSound();
    }
  };

  if (error && !bus) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <RoleNavbar />
        <div className="flex items-center justify-center p-12">
          <div className="text-center max-w-md bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-900 font-bold text-lg mb-2">{error}</p>
            <p className="text-xs text-gray-500 mb-4">You can switch to another bus or refresh the fleet connection.</p>
            <button onClick={fetchBus} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white">
              Retry Fleet Sync
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <RoleNavbar />
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const remaining = bus.total_capacity - bus.current_passengers;
  const isCritical = bus.occupancy_percent >= 90;
  const isWarning = bus.occupancy_percent >= 75;
  const stops = bus.stops || [];
  const currentStop = stops[bus.current_stop_index];
  const nextStop = stops[bus.current_stop_index + 1];
  const strokeColor = isCritical ? '#ef4444' : bus.crowd_status === 'orange' ? '#f97316' : bus.crowd_status === 'yellow' ? '#eab308' : '#22c55e';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isCritical ? 'bg-red-50' : 'bg-gray-50'} text-gray-900`}>
      <RoleNavbar />

      {/* Driver HUD Sub-Header & Bus Selector */}
      <header className="px-4 py-3 bg-white/95 border-b border-gray-200 sticky top-12 z-20 backdrop-blur shadow-sm">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            to="/driver"
            title="SEERPAYANAM Driver HUD"
            className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <div className={`p-2 rounded-xl shadow-md group-hover:shadow-lg transition-shadow ${isCritical ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}>
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900">{bus.bus_number}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isCritical ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {isCritical ? 'Critical Occupancy' : 'Normal Service'}
                </span>
              </div>
              {bus.route_info && (
                <p className="text-xs text-gray-500">
                  Route {bus.route_info.route_number} · {bus.route_info.source} → {bus.route_info.destination}
                </p>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <select
              value={driverBusId || ''}
              onChange={(e) => loadBusDetail(Number(e.target.value))}
              className="bg-white border border-gray-300 text-xs text-gray-900 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
            >
              {allBuses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bus_number} ({b.occupancy_percent}%)
                </option>
              ))}
            </select>

            <button onClick={fetchBus} title="Refresh" className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={logout} title="Logout" className="p-2 text-gray-400 hover:text-red-500 bg-gray-100 rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Critical Alert Warning Bar */}
      {isCritical && (
        <div className="bg-red-600 px-4 py-3 flex items-center justify-between shadow-xl animate-pulse">
          <div className="max-w-xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-white">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold text-xs sm:text-sm">90% OPERATIONAL CAPACITY EXCEEDED</p>
                <p className="text-[11px] text-red-100">Boarding restricted. Conductor ETM disabled for boarding.</p>
              </div>
            </div>
            <button
              onClick={playAlertSound}
              className="px-3 py-1 bg-white text-red-700 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center gap-1 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" /> Re-Sound Tone
            </button>
          </div>
        </div>
      )}

      {/* Main In-Cab Instrument Panel */}
      <div className="px-4 py-5 space-y-4 max-w-xl mx-auto">
        {/* Interactive Testing Controls Pill */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-sm">
          <span className="text-gray-500 font-semibold flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-yellow-500" /> Driver HUD Test Controls:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={playAlertSound}
              className="px-2.5 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded font-medium border border-yellow-200 flex items-center gap-1"
            >
              🔊 Test 90% Beep
            </button>
            <button
              type="button"
              onClick={() => adjustPax(1)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-medium border border-emerald-200 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> +1 Pax
            </button>
            <button
              type="button"
              onClick={() => adjustPax(-1)}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium border border-red-200 flex items-center gap-1"
            >
              <Minus className="w-3 h-3" /> -1 Pax
            </button>
          </div>
        </div>

        {/* Circular Occupancy Dial — kept dark as an instrument gauge visual */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
          <div className="relative inline-flex items-center justify-center w-48 h-48">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
              <circle
                cx="100" cy="100" r="85" fill="none"
                stroke={strokeColor}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(bus.occupancy_percent / 100) * 534} 534`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-4xl font-extrabold text-white tracking-tight">{bus.occupancy_percent}%</p>
              <div className="mt-1 flex justify-center">
                <CrowdBadge status={bus.crowd_status} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{bus.current_passengers} of {bus.total_capacity} Pax</p>
            </div>
          </div>

          {/* Door Operation Safety Banner */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              {isCritical || manualDoorLock ? (
                <div className="p-2 bg-red-950 text-red-400 rounded-lg border border-red-800">
                  <DoorClosed className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white">
                  {isCritical ? 'Door Hold Advised: Capacity Reached' : manualDoorLock ? 'Manual Door Hold Engaged' : 'Safe to Board & Depart'}
                </p>
                <p className="text-[10px] text-slate-400">Driver manual responsibility maintained</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setManualDoorLock(!manualDoorLock)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                manualDoorLock
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {manualDoorLock ? 'Release Hold' : 'Engage Hold'}
            </button>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Onboard', value: bus.current_passengers, sub: 'Inside Bus', color: 'text-gray-900' },
            { label: 'Capacity', value: bus.total_capacity, sub: 'Total Max', color: 'text-gray-700' },
            { label: 'Remaining', value: Math.max(0, remaining), sub: 'Available', color: remaining <= 5 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Seated', value: bus.seated_capacity, sub: 'Available Seats', color: 'text-blue-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-gray-200 text-center shadow-sm">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{s.label}</p>
              <p className="text-[9px] text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Boarding vs Alighting Metrics */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Total Boarded: <strong className="text-emerald-600 font-bold">{bus.boarded_count}</strong></span>
            <span>Total Alighted: <strong className="text-orange-600 font-bold">{bus.alighted_count}</strong></span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : bus.crowd_status === 'yellow' ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(bus.occupancy_percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Current & Upcoming Stop Telemetry */}
        {currentStop && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className={`w-3 h-3 rounded-full ${isCritical ? 'bg-red-500' : 'bg-blue-500'} ring-2 ring-gray-200`} />
                {nextStop && <div className="w-0.5 h-8 bg-gray-300" />}
                {nextStop && <div className="w-3 h-3 rounded-full bg-gray-300" />}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Current Bus Stop</p>
                  <p className="text-gray-900 font-bold text-sm">{currentStop.name}</p>
                  {currentStop.estimated_waiting > 0 && (
                    <p className="text-xs text-yellow-600 mt-0.5 font-medium">
                      ~{currentStop.estimated_waiting} passengers waiting on platform
                    </p>
                  )}
                </div>
                {nextStop && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Next Approaching Stop</p>
                    <p className="text-gray-700 font-semibold text-sm">{nextStop.name}</p>
                    {nextStop.estimated_waiting > 0 && (
                      <p className="text-xs text-yellow-600 mt-0.5 font-medium">
                        ~{nextStop.estimated_waiting} passengers expected to board
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Stop Demand Overcrowding Warning */}
        {nextStop && nextStop.estimated_waiting > 0 && (
          <div className={`rounded-xl p-4 border flex items-center gap-3 ${
            remaining < nextStop.estimated_waiting
              ? 'bg-red-50 border-red-300 text-red-800'
              : 'bg-yellow-50 border-yellow-300 text-yellow-800'
          }`}>
            <MapPin className={`w-5 h-5 shrink-0 ${
              remaining < nextStop.estimated_waiting ? 'text-red-500' : 'text-yellow-500'
            }`} />
            <div>
              <p className="text-xs font-bold">
                {remaining < nextStop.estimated_waiting
                  ? `Overcrowding Alert at Next Stop (${nextStop.name})`
                  : `Next Stop Demand Forecast: ${nextStop.name}`
                }
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {remaining < nextStop.estimated_waiting
                  ? `Bus has ${remaining} remaining capacity, but ~${nextStop.estimated_waiting} passengers are waiting. ~${nextStop.estimated_waiting - remaining} may be left behind.`
                  : `Bus has ${remaining} remaining capacity to accommodate ~${nextStop.estimated_waiting} waiting passengers.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
