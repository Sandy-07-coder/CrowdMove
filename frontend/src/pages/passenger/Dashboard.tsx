import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import {
  busApi, passengerApi, multimodalApi,
  type Bus, type SmartCard, type Transaction, type BusAlternatives
} from '../../api';
import { useSimulation } from '../../hooks/useSimulation';
import CrowdBadge from '../../components/CrowdBadge';
import { showToast } from '../../components/Toast';
import RoleNavbar from '../../components/RoleNavbar';
import {
  CreditCard, History, LogOut, Plus, RefreshCw, Train, Footprints, Wallet,
  ScanLine, Camera, Zap, Bus as BusIcon, CheckCircle2, ArrowRight, Copy
} from 'lucide-react';

export default function PassengerDashboard() {
  const { user, logout } = useAuth();
  const { buses: wsBuses } = useSimulation();
  const [card, setCard] = useState<SmartCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [tab, setTab] = useState<'card' | 'buses' | 'history'>('card');
  const [rechargeAmt, setRechargeAmt] = useState('');
  const [rechargeMsg, setRechargeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [recharging, setRecharging] = useState(false);
  const [alternatives, setAlternatives] = useState<Record<number, BusAlternatives>>({});
  const [loadingAlts, setLoadingAlts] = useState<number | null>(null);

  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [isBoarded, setIsBoarded] = useState(false);
  const [currentBoardedBusNumber, setCurrentBoardedBusNumber] = useState<string>('');
  const [tapping, setTapping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadCard();
    busApi.list(true).then((r) => {
      setBuses(r.data);
      if (r.data.length > 0 && selectedBusId === null) {
        setSelectedBusId(r.data[0].id);
      }
    });
  }, [user]);

  const loadCard = () => {
    if (!user) return;
    passengerApi.getCard(user.id).then((r) => {
      setCard(r.data);
      passengerApi.getTransactions(r.data.id).then((t) => setTransactions(t.data));
    }).catch(() => {});
  };

  useEffect(() => {
    if (wsBuses.length > 0) {
      const active = wsBuses.filter((b) => b.is_active);
      setBuses(active);
      if (selectedBusId === null && active.length > 0) {
        setSelectedBusId(active[0].id);
      }
    }
  }, [wsBuses]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      loadCard();
      const r = await busApi.list(true);
      setBuses(r.data);
      showToast('info', 'Refreshed live data');
    } catch {
      // ignore
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleRecharge = async () => {
    if (!card || !rechargeAmt) return;
    const amt = parseFloat(rechargeAmt);
    if (isNaN(amt) || amt <= 0 || amt > 5000) {
      setRechargeMsg({ ok: false, text: 'Enter an amount between ₹1 and ₹5,000' });
      return;
    }
    setRecharging(true);
    setRechargeMsg(null);
    try {
      const res = await passengerApi.recharge(card.card_number, amt);
      setCard((prev) => (prev ? { ...prev, balance: res.data.new_balance } : null));
      setRechargeMsg({ ok: true, text: `Recharged ₹${amt.toFixed(2)} successfully` });
      setRechargeAmt('');
      showToast('success', `₹${amt.toFixed(2)} added to your transit card`);
      loadCard();
    } catch {
      setRechargeMsg({ ok: false, text: 'Recharge failed' });
      showToast('error', 'Recharge transaction failed');
    } finally {
      setRecharging(false);
    }
  };

  const handleInstantTap = async (actionType: 'board' | 'alight', specificBusId?: number) => {
    if (!card) return;
    const busId = specificBusId || selectedBusId;
    if (!busId) {
      showToast('error', 'Please select an active bus');
      return;
    }

    const busObj = buses.find((b) => b.id === busId);
    setTapping(true);
    try {
      const res = await passengerApi.scan(card.card_number, busId, actionType);
      if (res.data.success) {
        const fare = res.data.fare || (actionType === 'board' ? 10 : 0);
        const updatedBal = res.data.new_balance !== undefined
          ? res.data.new_balance
          : (actionType === 'board' ? Number((card.balance - fare).toFixed(2)) : card.balance);

        // 1. Instant Balance Deduction in State
        setCard((prev) => (prev ? { ...prev, balance: updatedBal } : null));

        // 2. Instant Bus Passenger Count Update
        setBuses((prev) =>
          prev.map((b) =>
            b.id === busId
              ? {
                  ...b,
                  current_passengers: res.data.current_passengers,
                  boarded_count: actionType === 'board' ? b.boarded_count + 1 : b.boarded_count,
                  alighted_count: actionType === 'alight' ? b.alighted_count + 1 : b.alighted_count,
                }
              : b
          )
        );

        // 3. Instant Travel History Prepend
        if (actionType === 'board') {
          setIsBoarded(true);
          setCurrentBoardedBusNumber(busObj?.bus_number || 'Bus');
          setTransactions((prev) => [
            {
              id: Date.now(),
              amount: fare,
              type: 'debit',
              description: `Boarded ${busObj?.bus_number || 'Bus'}`,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        } else {
          setIsBoarded(false);
          setCurrentBoardedBusNumber('');
          setTransactions((prev) => [
            {
              id: Date.now(),
              amount: 0,
              type: 'debit',
              description: `Alighted from ${busObj?.bus_number || 'Bus'}`,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }

        showToast('success', res.data.message);

        // 4. Background re-sync
        loadCard();
      } else {
        showToast('error', res.data.message);
      }
    } catch {
      showToast('error', 'Validation request failed');
    } finally {
      setTapping(false);
    }
  };

  const fetchAlternatives = async (busId: number) => {
    if (alternatives[busId]) {
      setAlternatives((prev) => {
        const copy = { ...prev };
        delete copy[busId];
        return copy;
      });
      return;
    }
    setLoadingAlts(busId);
    try {
      const res = await multimodalApi.forBus(busId);
      setAlternatives((prev) => ({ ...prev, [busId]: res.data }));
    } catch {
      // ignore
    }
    setLoadingAlts(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <RoleNavbar />

      {/* Main Header — positioned below RoleNavbar */}
      <header className="bg-white border-b border-gray-200 shadow-xs sticky top-11 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/passenger"
            title="SEERPAYANAM Passenger Pass"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white shadow-xs group-hover:shadow-sm transition-shadow">
              <BusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                SEERPAYANAM Pass
              </h1>
              <p className="text-[11px] text-gray-500">Commuter: {user?.name}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              title="Refresh Live Data"
              className="p-2 text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-2 text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'card' as const, label: 'My Smart Pass', icon: CreditCard },
            { key: 'buses' as const, label: 'Live Bus Crowd', icon: RefreshCw },
            { key: 'history' as const, label: 'Travel History', icon: History },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === t.key
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50'
                  : 'bg-white text-gray-500 border border-gray-200 hover:text-gray-900'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SMART CARD & VALIDATION */}
        {tab === 'card' && card && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            {/* Government Smart Card Design — kept dark as a visual card element */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-emerald-800 rounded-2xl p-6 text-white shadow-xl border border-white/20 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Govt. of Tamil Nadu · தமிழ்நாடு அரசு</p>
                  </div>
                  <p className="text-base font-bold text-white">MTC Universal Smart Transit Pass</p>
                  <p className="text-xs text-blue-200 mt-0.5">{card.passenger.name}</p>
                </div>
                <div className="bg-emerald-500/30 border border-emerald-400/40 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-200">
                  {card.is_active ? 'Active Pass' : 'Inactive'}
                </div>
              </div>

              <p className="text-xl font-mono tracking-widest mb-6 font-bold">{card.card_number}</p>

              <div className="flex justify-between items-end border-t border-white/10 pt-3">
                <div>
                  <p className="text-blue-200 text-xs">Prepaid Wallet Balance</p>
                  <p className="text-3xl font-bold">₹{card.balance.toFixed(2)}</p>
                </div>
                <div className="text-right text-xs text-blue-200">
                  <p>MTC Bus + Metro Feeder</p>
                  <p className="text-[10px] text-emerald-300">Depot Rechargeable</p>
                </div>
              </div>
            </div>

            {/* Accessibility Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
              <span className="font-semibold text-gray-900">Government Pass Accessibility: </span>
              In real deployment, this functions as a physical NFC/RFID card for passengers without smartphones. Smart phone users can present this digital QR or tap directly.
            </div>

            {/* WHERE & HOW TO SCAN: Interactive Scanner Action Box */}
            <div className="bg-white border border-emerald-300 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ScanLine className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-gray-900">How & Where to Scan This Pass</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Choose either method below to board a bus and validate your fare:
              </p>

              <div className="space-y-3">
                {/* METHOD 1: 1-Click Instant Tap Boarding Simulation */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-600" /> Method 1: Instant Tap In/Out (Demo)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Select a bus below to board instantly with ₹10 fare deduction:
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedBusId ?? ''}
                      onChange={(e) => setSelectedBusId(Number(e.target.value))}
                      className="flex-1 bg-white border border-gray-300 text-xs text-gray-900 rounded-lg px-3 py-2 font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {buses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bus_number} ({b.current_passengers}/{b.total_capacity} pax)
                        </option>
                      ))}
                    </select>

                    {isBoarded ? (
                      <button
                        type="button"
                        onClick={() => handleInstantTap('alight')}
                        disabled={tapping}
                        className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <LogOut className="w-4 h-4" /> Tap Out (Alight)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInstantTap('board')}
                        disabled={tapping}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-md"
                      >
                        <Zap className="w-4 h-4" /> Tap In (Board Bus)
                      </button>
                    )}
                  </div>

                  {isBoarded && (
                    <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Currently traveling on <strong>{currentBoardedBusNumber}</strong></span>
                    </div>
                  )}
                </div>

                {/* METHOD 2: Open Camera Scanner */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" /> Method 2: Conductor Camera App
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Open conductor camera to scan the QR code below using device camera.
                    </p>
                  </div>
                  <Link
                    to={`/scanner?card=${card.card_number}`}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-md"
                  >
                    Open Scanner <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center shadow-sm">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Digital Pass QR Code
              </p>
              <div className="inline-block bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <QRCodeSVG
                  value={card.card_number}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-xs text-gray-900 font-mono font-bold tracking-wider">{card.card_number}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(card.card_number);
                    showToast('success', 'Pass ID copied to clipboard');
                  }}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-semibold border border-gray-200 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Conductor scans this QR with their device camera</p>
            </div>

            {/* Wallet Recharge Simulation */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Prepaid Transit Recharge</p>
              </div>
              <div className="flex gap-2 mb-3">
                {[100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmt(String(amt))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      rechargeAmt === String(amt)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={rechargeAmt}
                  onChange={(e) => setRechargeAmt(e.target.value)}
                  placeholder="Custom amount (₹)"
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleRecharge}
                  disabled={!rechargeAmt || recharging}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> {recharging ? '...' : 'Recharge'}
                </button>
              </div>
              {rechargeMsg && (
                <p className={`text-xs mt-2 font-medium ${rechargeMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {rechargeMsg.text}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Fallback when card is not yet loaded */}
        {tab === 'card' && !card && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3 animate-[fadeIn_0.3s_ease-out]">
            <CreditCard className="w-12 h-12 text-blue-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">Smart Pass Verification</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Connecting to Tamil Nadu State Transit Registry... Click below to retrieve or issue your Smart Pass.
            </p>
            <button
              onClick={loadCard}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
            >
              Issue / Retrieve My Pass
            </button>
          </div>
        )}

        {/* TAB 2: LIVE BUS CROWD TRACKER & MULTIMODAL */}
        {tab === 'buses' && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            {/* Crowd Level Legend */}
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs">
              <p className="font-bold text-gray-700 mb-2">Live Crowd Status Guide:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-gray-700"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low (&lt;50%)</div>
                <div className="flex items-center gap-1.5 text-gray-700"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Moderate (50-74%)</div>
                <div className="flex items-center gap-1.5 text-gray-700"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High (75-89%)</div>
                <div className="flex items-center gap-1.5 text-gray-700"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical (90%+)</div>
              </div>
            </div>

            {/* Bus Cards List */}
            {buses.map((bus) => {
              const isFull = bus.crowd_status === 'red' || bus.crowd_status === 'orange';
              const alt = alternatives[bus.id];
              return (
                <div
                  key={bus.id}
                  className={`bg-white rounded-xl border transition-all ${
                    bus.crowd_status === 'red'
                      ? 'border-red-300 ring-1 ring-red-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{bus.bus_number}</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {bus.current_passengers} / {bus.total_capacity} passengers ({bus.occupancy_percent}%)
                        </p>
                      </div>
                      <CrowdBadge status={bus.crowd_status} />
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${
                          bus.crowd_status === 'red' ? 'bg-red-500' :
                          bus.crowd_status === 'orange' ? 'bg-orange-500' :
                          bus.crowd_status === 'yellow' ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(bus.occupancy_percent, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                      <span className="text-gray-500">
                        Available Seats: <strong className="text-gray-900">{Math.max(0, bus.seated_capacity - bus.current_passengers)}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {isFull && (
                          <button
                            type="button"
                            onClick={() => fetchAlternatives(bus.id)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Train className="w-3.5 h-3.5" /> {loadingAlts === bus.id ? 'Loading...' : 'Metro Alts'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleInstantTap('board', bus.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" /> Board
                        </button>
                      </div>
                    </div>

                    {/* Multimodal Alternative Suggestion Box */}
                    {alt && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2 animate-[fadeIn_0.2s_ease-out]">
                        <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                          <Train className="w-4 h-4 text-purple-600" /> {alt.suggestion}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Bus is crowded. Suggested Chennai Metro & Suburban rail alternatives:
                        </p>
                        <div className="space-y-1.5">
                          {alt.alternatives.map((st) => (
                            <div
                              key={st.id}
                              className="bg-white p-2 rounded-lg border border-purple-200 flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{st.name}</p>
                                <p className="text-[10px] text-purple-600 font-mono">{st.line} · {st.station_type.toUpperCase()}</p>
                              </div>
                              <div className="text-right text-[11px] text-gray-700 flex items-center gap-1">
                                <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{st.distance_km} km ({st.walk_minutes} min walk)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: TRANSACTION HISTORY */}
        {tab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-2">
              Recent Travel & Recharge Logs
            </h3>
            {transactions.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">No transaction history yet.</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-900">{tx.description || (tx.type === 'debit' ? 'MTC Bus Fare' : 'Recharge')}</p>
                      <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`font-mono font-bold ${tx.type === 'debit' ? 'text-red-500' : 'text-emerald-600'}`}>
                      {tx.type === 'debit' ? `-₹${tx.amount.toFixed(2)}` : `+₹${tx.amount.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
