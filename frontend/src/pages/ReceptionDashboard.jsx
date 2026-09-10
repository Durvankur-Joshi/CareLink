import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const ReceptionDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aptsRes, queueRes] = await Promise.all([
        api.get('/api/reception/appointments/today'),
        api.get('/api/reception/queue')
      ]);
      setTodayAppointments(aptsRes.data?.data?.appointments || []);
      setQueue(queueRes.data?.data?.queue || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reception dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleCheckIn = async (appointmentId) => {
    setActionLoadingId(appointmentId);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.patch(`/api/reception/appointments/${appointmentId}/check-in`);
      setSuccessMessage('Patient checked in successfully');
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddToQueue = async (appointmentId) => {
    setActionLoadingId(appointmentId);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.patch(`/api/reception/appointments/${appointmentId}/queue`);
      setSuccessMessage('Patient added to consultation queue');
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to queue');
    } finally {
      setActionLoadingId(null);
    }
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
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">CareLink</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300">
                Reception Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Logged in as {user?.name}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
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

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-medium flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs text-rose-400 font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-medium flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-400 font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Today's Live Queue</h2>
            <span className="text-xs text-slate-400 font-medium">
              Active in Queue: <strong className="text-white">{queue.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs">Loading queue...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-800/60 border border-slate-800 text-center space-y-1">
              <p className="text-sm font-semibold text-slate-300">The consultation queue is empty</p>
              <p className="text-xs text-slate-400">Check in patients from today's appointments to place them into the queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.map((item) => (
                <div
                  key={item.appointmentId}
                  className="bg-slate-800 border border-indigo-900/60 rounded-xl p-4 shadow-lg space-y-2.5 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
                        #{item.position}
                      </span>
                      <h3 className="text-sm font-bold text-white">{item.patient?.name}</h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{item.appointmentTime}</span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400">Doctor: </span>
                    <strong className="text-white font-medium">{item.doctor?.name}</strong>
                  </div>

                  {item.reason && (
                    <p className="text-xs text-slate-400 italic truncate">
                      "{item.reason}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-700/60 flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
                      IN QUEUE
                    </span>
                    <Link
                      to={`/reception/appointments/${item.appointmentId}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Today's Appointments</h2>
            <span className="text-xs text-slate-400">
              Total Today: <strong className="text-white">{todayAppointments.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs">Loading appointments...</p>
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-800/60 border border-slate-800 text-center space-y-1">
              <p className="text-sm font-semibold text-slate-300">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-800/80 shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {todayAppointments.map((apt) => {
                    const isProcessing = actionLoadingId === apt.id;
                    return (
                      <tr key={apt.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-white">
                          {apt.appointmentTime}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          <Link
                            to={`/reception/appointments/${apt.id}`}
                            className="hover:text-indigo-400 transition-colors"
                          >
                            {apt.patientName}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-200">{apt.doctorName}</div>
                          <div className="text-[11px] text-cyan-400">{apt.doctorSpecialization}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-slate-400">
                          {apt.reason || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(apt.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {apt.status === 'BOOKED' && (
                            <button
                              onClick={() => handleCheckIn(apt.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                            >
                              {isProcessing ? 'Checking in...' : 'Check In'}
                            </button>
                          )}

                          {apt.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleAddToQueue(apt.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                            >
                              {isProcessing ? 'Adding...' : 'Add to Queue'}
                            </button>
                          )}

                          {apt.status === 'IN_QUEUE' && (
                            <span className="text-slate-400 italic text-xs">
                              Waiting in Queue
                            </span>
                          )}

                          {apt.status === 'IN_CONSULTATION' && (
                            <span className="text-cyan-400 italic text-xs">
                              With Doctor
                            </span>
                          )}

                          {apt.status === 'COMPLETED' && (
                            <span className="text-emerald-400 text-xs">
                              Completed
                            </span>
                          )}

                          {apt.status === 'CANCELLED' && (
                            <span className="text-rose-400 text-xs">
                              Cancelled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
