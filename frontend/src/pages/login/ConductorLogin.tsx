import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ScanLine, ArrowRight, Zap, Smartphone } from 'lucide-react';

export default function ConductorLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('conductor@seerpayanam.in');
  const [password, setPassword] = useState('test123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/scanner');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Invalid Operator Badge ID or Terminal PIN';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConductor = async () => {
    setError('');
    setLoading(true);
    try {
      await login('conductor@seerpayanam.in', 'test123');
      navigate('/scanner');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-cyan-600 to-teal-500 rounded-2xl shadow-lg mb-3">
            <ScanLine className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-widest">
              Electronic Ticketing Machine (ETM)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Conductor Terminal Login</h1>
          <p className="text-xs text-gray-500 mt-1">
            Sign in to start contactless smart card validations, QR scans, and fare collection.
          </p>
        </div>

        {/* Device Clearance Badge Card */}
        <div className="bg-white border border-cyan-200 rounded-2xl p-4 mb-4 shadow-sm text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-600" /> Authorized Terminal: ETM-POS-AY-01
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Operator: Deepa Krishnan (Badge #OP-9821)</p>
            </div>
            <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200 font-semibold">
              Ready
            </span>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Operator Badge ID or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g. conductor@seerpayanam.in or OP-9821"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Terminal PIN / Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter terminal PIN"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Authorizing Handheld Terminal...' : 'Sign In to Conductor Scanner'}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <button
              type="button"
              onClick={handleQuickConductor}
              disabled={loading}
              className="w-full py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-600" />
              1-Click Fast Conductor Sign In (OP-9821)
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
        Tamil Nadu State Transport Corporation · Onboard Electronic Ticketing Device
      </footer>
    </div>
  );
}
