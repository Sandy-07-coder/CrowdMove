import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigation, Bus, ArrowRight, Zap } from 'lucide-react';

const DEMO_DRIVERS = [
  { name: 'Rajesh Kumar', badge: 'D51192', email: 'rajesh@seerpayanam.in', bus: 'Route 159 (Bus 01)' },
  { name: 'Suresh Babu', badge: 'D48012', email: 'suresh@seerpayanam.in', bus: 'Route 48C (Bus 01)' },
  { name: 'Murugan S', badge: 'D15904', email: 'murugan@seerpayanam.in', bus: 'Route 579C (Bus 01)' },
];

export default function DriverLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('rajesh@seerpayanam.in');
  const [password, setPassword] = useState('test123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/driver');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Invalid Driver Badge ID, Email, or PIN';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (driver: typeof DEMO_DRIVERS[0]) => {
    setIdentifier(driver.email);
    setPassword('test123');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-amber-600 to-yellow-500 rounded-2xl shadow-lg mb-3">
            <Navigation className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
              MTC Chennai · Fleet Operations
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Driver In-Cab HUD Login</h1>
          <p className="text-xs text-gray-500 mt-1">
            Authenticate driver terminal to activate real-time occupancy gauge and 90% audio alert.
          </p>
        </div>

        {/* Demo Driver Quick Selector */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bus className="w-3.5 h-3.5" /> Assigned Active Drivers:
          </p>
          <div className="space-y-1.5">
            {DEMO_DRIVERS.map((d) => (
              <button
                key={d.badge}
                type="button"
                onClick={() => handleQuickSelect(d)}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                  identifier === d.email
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="font-semibold text-gray-900">{d.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono ml-2">Badge #{d.badge}</span>
                </div>
                <span className="text-[10px] text-amber-600 font-medium">{d.bus}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Driver Badge ID or Staff Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. rajesh@seerpayanam.in or D51192"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Driver Security PIN
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter 4-digit PIN"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Initializing In-Cab HUD...' : 'Sign In to Driver Cockpit'}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            ← Switch to Transit Portal Gateway
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-gray-400 mt-4">
        Metropolitan Transport Corporation (MTC) Chennai · In-Bus Vehicle Subsystem
      </footer>
    </div>
  );
}
