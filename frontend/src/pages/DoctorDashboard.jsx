import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/appointments/doctor');
      setAppointments(response.data?.data?.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctor appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
            BOOKED
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">CareLink</h1>
            <p className="text-xs text-slate-400 mt-0.5">Doctor Portal</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300">
              Role: Doctor
            </span>
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

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white tracking-tight">Upcoming & Today's Appointments</h3>
            <button
              onClick={fetchAppointments}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm">Loading scheduled appointments...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-medium">
              {error}
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 rounded-xl bg-slate-800/60 border border-slate-800 text-center space-y-2">
              <p className="text-base font-semibold text-slate-200">No scheduled appointments</p>
              <p className="text-sm text-slate-400">Patients booking your slots will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-bold text-white">{apt.patientName}</span>
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
                    className="self-start sm:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm text-center"
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
