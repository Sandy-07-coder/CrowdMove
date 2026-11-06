import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, CreditCard, LogOut, Navigation, Shield, User, Crown } from 'lucide-react';

export default function RoleNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const adminNavItems = [
    {
      to: '/admin',
      label: 'Admin Command Center',
      icon: Shield,
      activeColor: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    {
      to: '/passenger',
      label: 'Passenger Smart Pass',
      icon: CreditCard,
      activeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    },
    {
      to: '/scanner',
      label: 'Conductor Scanner',
      icon: Camera,
      activeColor: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    },
    {
      to: '/driver',
      label: 'Driver HUD',
      icon: Navigation,
      activeColor: 'bg-amber-100 text-amber-700 border-amber-300',
    },
  ];

  if (isAdmin) {
    return (
      <nav className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 text-xs sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto">
          {/* Admin Identity Badge — Clickable */}
          <Link
            to="/admin"
            title="SEERPAYANAM Admin Dashboard"
            className="flex items-center gap-2 shrink-0 hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white shadow-sm group-hover:shadow-md transition-shadow">
              <Crown className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm tracking-wide">SEERPAYANAM</span>
              <span className="text-[10px] text-yellow-700 ml-1.5 font-bold px-1.5 py-0.5 bg-yellow-50 rounded border border-yellow-300">
                MASTER ADMIN ACCESS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? item.activeColor
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-200 text-gray-700">
              <User className="w-3 h-3 text-blue-600" />
              <span className="font-semibold text-gray-900">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-lg border border-gray-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  if (user?.role === 'passenger') {
    return (
      <nav className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 text-xs sticky top-0 z-50 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Link
            to="/passenger"
            title="SEERPAYANAM Commuter Portal"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white shadow-sm group-hover:shadow-md transition-shadow">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">SEERPAYANAM</span>
              <span className="text-[10px] text-emerald-700 ml-1.5 font-medium px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                Smart Pass
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 font-medium hidden sm:inline">
              {user.name}
            </span>
            <button
              onClick={logout}
              title="Logout"
              className="px-2.5 py-1 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-lg border border-gray-200 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  if (user?.role === 'driver') {
    return (
      <nav className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 text-xs sticky top-0 z-50 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <Link
            to="/driver"
            title="SEERPAYANAM Driver HUD"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <div className="bg-amber-600 p-1.5 rounded-lg text-white shadow-sm group-hover:shadow-md transition-shadow">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">SEERPAYANAM</span>
              <span className="text-[10px] text-amber-700 ml-1.5 font-medium px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
                Driver HUD
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 font-medium hidden sm:inline">
              Driver: {user.name}
            </span>
            <button
              onClick={logout}
              title="Logout"
              className="px-2.5 py-1 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-lg border border-gray-200 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 text-xs sticky top-0 z-50 shadow-sm">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        <Link
          to="/scanner"
          title="SEERPAYANAM Conductor ETM"
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
        >
          <div className="bg-cyan-600 p-1.5 rounded-lg text-white shadow-sm group-hover:shadow-md transition-shadow">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm">SEERPAYANAM</span>
            <span className="text-[10px] text-cyan-700 ml-1.5 font-medium px-1.5 py-0.5 bg-cyan-50 rounded border border-cyan-200">
              Conductor ETM
            </span>
          </div>
        </Link>

        {user && (
          <button
            onClick={logout}
            className="px-2.5 py-1 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-lg border border-gray-200 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <LogOut className="w-3 h-3" /> Logout
          </button>
        )}
      </div>
    </nav>
  );
}
