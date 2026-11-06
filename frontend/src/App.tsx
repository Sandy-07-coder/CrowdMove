import { type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PassengerLogin from './pages/login/PassengerLogin';
import DriverLogin from './pages/login/DriverLogin';
import ConductorLogin from './pages/login/ConductorLogin';
import AdminLogin from './pages/login/AdminLogin';
import PassengerDashboard from './pages/passenger/Dashboard';
import DriverDashboard from './pages/driver/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import ConductorScanner from './pages/conductor/Scanner';
import ToastContainer from './components/Toast';

// Smart Home Router
function RootRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Login />;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'driver') return <DriverDashboard />;
  if (user.role === 'conductor') return <ConductorScanner />;
  return <PassengerDashboard />;
}

// Protected Route for Subsystems
function ProtectedSubsystem({
  children,
  allowedRoles,
  loginPath,
}: {
  children: ReactElement;
  allowedRoles: string[];
  loginPath: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in -> redirect to that subsystem's dedicated login page
  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  // Administrators have overall master access to all subsystems
  if (user.role === 'admin' || allowedRoles.includes(user.role)) {
    return children;
  }

  // Unauthorized role -> redirect to appropriate login for that subsystem
  return <Navigate to={loginPath} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<RootRouter />} />

          {/* Dedicated Separate Login Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/passenger" element={<PassengerLogin />} />
          <Route path="/login/driver" element={<DriverLogin />} />
          <Route path="/login/conductor" element={<ConductorLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />

          {/* Subsystems (Strictly Segregated & Master Admin Access) */}
          <Route
            path="/passenger"
            element={
              <ProtectedSubsystem allowedRoles={['passenger']} loginPath="/login/passenger">
                <PassengerDashboard />
              </ProtectedSubsystem>
            }
          />

          <Route
            path="/driver"
            element={
              <ProtectedSubsystem allowedRoles={['driver']} loginPath="/login/driver">
                <DriverDashboard />
              </ProtectedSubsystem>
            }
          />

          <Route
            path="/scanner"
            element={
              <ProtectedSubsystem allowedRoles={['conductor', 'passenger']} loginPath="/login/conductor">
                <ConductorScanner />
              </ProtectedSubsystem>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedSubsystem allowedRoles={['admin']} loginPath="/login/admin">
                <AdminDashboard />
              </ProtectedSubsystem>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
