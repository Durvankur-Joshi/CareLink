import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl space-y-6">
        <div className="border-b border-slate-700 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">CareLink</h1>
            <p className="text-xs text-slate-400 mt-0.5">Doctor Portal</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300">
            Authenticated
          </span>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-slate-900/80 p-4 border border-slate-700/70 space-y-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">User</div>
              <p className="text-lg font-bold text-white mt-0.5">Welcome, {user?.name}</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Role</div>
              <p className="text-sm font-medium text-cyan-400 mt-0.5">Role: Doctor</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Email</div>
              <p className="text-xs font-mono text-slate-300 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DoctorDashboard;
