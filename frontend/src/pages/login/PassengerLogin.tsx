import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, ArrowRight, Zap, User } from 'lucide-react';

const DEMO_COMMUTERS = [
  { name: 'Priya Muthukumar', card: 'TN-MTC-2026-0001', email: 'priya@gmail.com', passType: 'General Commuter Pass' },
  { name: 'Arun Karthik', card: 'TN-MTC-2026-0002', email: 'arun@gmail.com', passType: 'Daily Smart Pass' },
  { name: 'Divya Sundaram', card: 'TN-MTC-2026-0003', email: 'divya@gmail.com', passType: 'Student Subsidized Pass' },
];

export default function PassengerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('TN-MTC-2026-0001');
  const [password, setPassword] = useState('test123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/passenger');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Invalid Smart Card Number, Email, or Password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (commuter: typeof DEMO_COMMUTERS[0]) => {
    setIdentifier(commuter.card);
    setPassword('test123');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg mb-3">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
              Govt. of Tamil Nadu · MTC
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Commuter Smart Pass Login</h1>
          <p className="text-xs text-gray-500 mt-1">
            Access your prepaid travel wallet, QR boarding pass, and live bus occupancy.
          </p>
        </div>

        {/* Demo Commuter Quick Selector */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Demo Commuter Accounts:
          </p>
          <div className="space-y-1.5">
            {DEMO_COMMUTERS.map((c) => (
              <button
                key={c.card}
                type="button"
                onClick={() => handleQuickSelect(c)}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                  identifier === c.card
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="font-semibold text-gray-900">{c.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono ml-2">({c.card})</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">{c.passType}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Smart Card Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. TN-MTC-2026-0001 or priya@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Account Password / PIN
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter password"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Validating Smart Pass...' : 'Sign In to Commuter Portal'}
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
        Tamil Nadu State Transport Corporation · Passenger Self-Service Portal
      </footer>
    </div>
  );
}
