import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aptsRes, queueRes] = await Promise.all([
        api.get('/api/appointments/doctor'),
        api.get('/api/appointments/doctor/queue')
      ]);
      setAppointments(aptsRes.data?.data?.appointments || []);
      setQueue(queueRes.data?.data?.queue || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            BOOKED
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-950 border border-amber-700 text-amber-300">
            CHECKED IN
          </span>
        );
      case 'IN_QUEUE':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
            IN QUEUE
          </span>
        );
      case 'IN_CONSULTATION':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300">
            IN CONSULTATION
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300">
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-950 border border-rose-700 text-rose-300">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">CareLink</h1>
            <p className="text-xs text-slate-400 mt-0.5">Doctor Consultation & Queue Portal</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300">
              Role: Doctor
            </span>
            <button
              onClick={fetchDoctorData}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-lg">
          <h2 className="text-xl font-bold text-white">Welcome, Dr. {user?.name}</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white tracking-tight">Today's Queue</h3>
            <span className="text-xs text-slate-400">
              Patients in Queue: <strong className="text-white">{queue.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs">Loading queue...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-800/60 border border-slate-800 text-center space-y-1">
              <p className="text-sm font-semibold text-slate-300">No patients currently in your queue</p>
              <p className="text-xs text-slate-400">Patients checked in by reception will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.map((item) => (
                <div
                  key={item.appointmentId}
                  className="bg-slate-800 border border-indigo-900/70 rounded-xl p-4 shadow-lg space-y-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
                        #{item.position}
                      </span>
                      <h4 className="text-sm font-bold text-white">{item.patientName}</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{item.appointmentTime}</span>
                  </div>

                  {item.reason && (
                    <p className="text-xs text-slate-300 italic truncate">
                      "{item.reason}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-700/60 flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
                      IN QUEUE
                    </span>
                    <Link
                      to={`/doctor/appointments/${item.appointmentId}`}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white tracking-tight">All Assigned Appointments</h3>
            <span className="text-xs text-slate-400">
              Total: <strong className="text-white">{appointments.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-800/60 border border-slate-800 text-center space-y-1">
              <p className="text-sm font-semibold text-slate-300">No scheduled appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-slate-800 border border-slate-700/80 rounded-xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-white">{apt.patientName}</span>
                      {getStatusBadge(apt.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-300">
                      <span>
                        <strong className="text-slate-400 font-normal">Date:</strong> {apt.appointmentDate}
                      </span>
                      <span>
                        <strong className="text-slate-400 font-normal">Time:</strong> {apt.appointmentTime}
                      </span>
                      {apt.patientEmail && (
                        <span className="font-mono text-slate-400">
                          {apt.patientEmail}
                        </span>
                      )}
                    </div>
                    {apt.reason && (
                      <p className="text-xs text-slate-400 italic">
                        "{apt.reason}"
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/doctor/appointments/${apt.id}`}
                    className="self-start sm:self-auto px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm text-center"
                  >
                    View Appointment
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
