import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { busApi, passengerApi, type Bus } from '../../api';
import { useSimulation } from '../../hooks/useSimulation';
import QrScanner from '../../components/QrScanner';
import CrowdBadge from '../../components/CrowdBadge';
import RoleNavbar from '../../components/RoleNavbar';
import { Camera, CheckCircle, LogIn, LogOut, ScanLine, XCircle, Bus as BusIcon, Smartphone, HelpCircle } from 'lucide-react';

type ScanResult = { success: boolean; message: string; fare: number } | null;

const DEMO_PASSENGERS = [
  { name: 'Priya Muthukumar', card: 'TN-MTC-2026-0001', type: 'General Commuter Pass' },
  { name: 'Arun Karthik', card: 'TN-MTC-2026-0002', type: 'Daily Smart Pass' },
  { name: 'Divya Sundaram', card: 'TN-MTC-2026-0003', type: 'Student Subsidized Pass' },
  { name: 'Vikram Raman', card: 'TN-MTC-2026-0004', type: 'Metro Transfer Pass' },
  { name: 'Lakshmi Narayanan', card: 'TN-MTC-2026-0005', type: 'Senior Citizen Pass' },
  { name: 'Ganesh Thangavel', card: 'TN-MTC-2026-0006', type: 'Suburban Radial Pass' },
];

export default function ConductorScanner() {
  const [searchParams] = useSearchParams();
  const { buses: wsBuses } = useSimulation();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [action, setAction] = useState<'board' | 'alight'>('board');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [processing, setProcessing] = useState(false);
  const [manualCard, setManualCard] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = (success: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.25;
      osc.connect(gain).connect(ctx.destination);
      if (success) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {
      // AudioContext unavailable
    }
  };

  useEffect(() => {
    const cardParam = searchParams.get('card');
    if (cardParam) {
      setManualCard(cardParam);
    }
  }, [searchParams]);

  useEffect(() => {
    busApi.list(true).then((r) => {
      const active = r.data.filter(b => b.is_active);
      setBuses(active);
      if (active.length > 0) {
        setSelectedBus(active[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (wsBuses.length > 0) {
      const active = wsBuses.filter((b) => b.is_active);
      setBuses(active);
      if (selectedBus) {
        const updated = active.find((b) => b.id === selectedBus.id);
        if (updated) setSelectedBus(updated);
      } else if (active.length > 0) {
        setSelectedBus(active[0]);
      }
    }
  }, [wsBuses]);

  const handleScan = async (cardNumber: string) => {
    if (!selectedBus || processing) return;
    setProcessing(true);
    setResult(null);

    try {
      const res = await passengerApi.scan(cardNumber, selectedBus.id, action);
      const isOk = res.data.success;
      playChime(isOk);
      setResult({ success: isOk, message: res.data.message, fare: res.data.fare });

      if (isOk) {
        setSelectedBus((prev) =>
          prev ? { ...prev, current_passengers: res.data.current_passengers } : null
        );
        setBuses((prev) =>
          prev.map((b) =>
            b.id === selectedBus.id ? { ...b, current_passengers: res.data.current_passengers } : b
          )
        );
      }
    } catch {
      playChime(false);
      setResult({ success: false, message: 'Scan validation failed — please check connection', fare: 0 });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualScan = () => {
    if (manualCard.trim()) {
      handleScan(manualCard.trim());
      setManualCard('');
    }
  };

  const occupancyPct = selectedBus && selectedBus.total_capacity > 0
    ? Math.round((selectedBus.current_passengers / selectedBus.total_capacity) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <RoleNavbar />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 sticky top-11 z-20">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            to="/scanner"
            title="SEERPAYANAM Conductor ETM"
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700 shadow-xs group-hover:shadow-sm transition-shadow">
              <ScanLine className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                SEERPAYANAM ETM Scanner
              </h1>
              <p className="text-[11px] text-gray-500">
                MTC Onboard Electronic Ticketing Machine
              </p>
            </div>
          </Link>

          {/* Active Bus Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 font-medium shrink-0">Conducting Bus:</span>
            <select
              value={selectedBus?.id ?? ''}
              onChange={(e) => {
                const b = buses.find((item) => item.id === Number(e.target.value));
                if (b) setSelectedBus(b);
                setResult(null);
              }}
              className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bus_number} ({b.current_passengers}/{b.total_capacity} pax)
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* Step-by-Step Operator Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-gray-900">How to Validate a Passenger:</p>
            <p className="text-[11px] leading-relaxed text-gray-700">
              <strong>Method 1:</strong> Point camera at any passenger QR code below. <br />
              <strong>Method 2:</strong> Click any passenger in <em>1-Click Fast-Tap Smart Passes</em> to instantly simulate boarding. <br />
              <strong>Method 3:</strong> Enter or paste a card ID (e.g. <code className="text-emerald-700 font-mono">TN-MTC-2026-0001</code>) into manual search.
            </p>
          </div>
        </div>

        {/* Selected Bus Live Occupancy Card */}
        {selectedBus && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <BusIcon className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-gray-900">{selectedBus.bus_number}</span>
              </div>
              <CrowdBadge status={selectedBus.crowd_status} />
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  selectedBus.crowd_status === 'red' ? 'bg-red-500' :
                  selectedBus.crowd_status === 'orange' ? 'bg-orange-500' :
                  selectedBus.crowd_status === 'yellow' ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(occupancyPct, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Occupancy: <strong className="text-gray-900">{selectedBus.current_passengers}</strong> / {selectedBus.total_capacity} pax ({occupancyPct}%)</span>
              <span>Available Capacity: <strong className="text-emerald-600">{Math.max(0, selectedBus.total_capacity - selectedBus.current_passengers)}</strong></span>
            </div>
          </div>
        )}

        {/* Validation Action Mode (Boarding / Alighting) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAction('board')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              action === 'board'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/50'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-4 h-4" /> Boarding (Deduct ₹10)
          </button>
          <button
            type="button"
            onClick={() => setAction('alight')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              action === 'alight'
                ? 'bg-orange-600 text-white shadow-lg ring-2 ring-orange-400/50'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            <LogOut className="w-4 h-4" /> Alighting (Free Space)
          </button>
        </div>

        {/* Scan Status Toast Banner */}
        {result && (
          <div
            className={`rounded-xl p-4 border flex items-center gap-3 animate-[fadeIn_0.2s_ease-out] ${
              result.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 shrink-0" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-bold text-sm">{result.success ? 'Validation Successful' : 'Validation Restricted'}</p>
              <p className="mt-0.5">{result.message}</p>
              {result.fare > 0 && (
                <p className="text-emerald-700 font-bold mt-1">₹{result.fare.toFixed(2)} deducted from passenger wallet</p>
              )}
            </div>
          </div>
        )}

        {/* SECTION 1: Camera Scanner */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" /> Device Camera QR Scanner
            </span>
            {scanning && (
              <button
                type="button"
                onClick={() => setScanning(false)}
                className="text-xs text-red-500 hover:text-red-700 font-semibold"
              >
                Close Camera
              </button>
            )}
          </div>

          {scanning ? (
            <QrScanner onScan={handleScan} active={scanning} />
          ) : (
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setScanning(true);
              }}
              disabled={processing}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4" /> Start Device Camera to Scan QR Code
            </button>
          )}
        </div>

        {/* SECTION 2: 1-Click Fast Tap Passes */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-600" /> 1-Click Fast-Tap Smart Passes
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Zero Camera Required
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Click any commuter below to simulate tapping their physical RFID smart transit card on this bus:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_PASSENGERS.map((p) => (
              <button
                key={p.card}
                type="button"
                onClick={() => handleScan(p.card)}
                disabled={processing}
                className="p-3 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-left transition-all disabled:opacity-50 flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-xs text-gray-900 group-hover:text-indigo-600 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.card}</p>
                </div>
                <span className="text-xs text-indigo-600 font-bold shrink-0">
                  ⚡ {action === 'board' ? 'Tap In' : 'Tap Out'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: Manual Card Number Entry */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Manual Smart Card Number Entry
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCard}
              onChange={(e) => setManualCard(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
              placeholder="e.g. TN-MTC-2026-0001"
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleManualScan}
              disabled={!manualCard.trim() || processing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {action === 'board' ? 'Validate Board' : 'Validate Alight'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
