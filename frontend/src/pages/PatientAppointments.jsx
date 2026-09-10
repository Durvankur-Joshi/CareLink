import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../lib/api';

const PatientAppointments = () => {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashMessage, setFlashMessage] = useState(location.state?.message || null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/appointments/my');
      setAppointments(response.data?.data?.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
            BOOKED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300">
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-950 border border-rose-700 text-rose-300">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 border border-slate-700 text-slate-300">
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
            <Link
              to="/patient/dashboard"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-1"
            >
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Appointments</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage your upcoming and past doctor consultations</p>
          </div>
          <Link
            to="/patient/doctors"
            className="self-start sm:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            + Book New Appointment
          </Link>
        </div>

        {flashMessage && (
          <div className="p-4 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-medium flex justify-between items-center">
            <span>{flashMessage}</span>
            <button
              onClick={() => setFlashMessage(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 ml-4 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm">Loading your appointments...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-medium">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 rounded-xl bg-slate-800/60 border border-slate-800 text-center space-y-3">
            <p className="text-base font-semibold text-slate-200">No appointments scheduled</p>
            <p className="text-sm text-slate-400">You do not have any active appointments yet.</p>
            <div className="pt-2">
              <Link
                to="/patient/doctors"
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Find and Book a Doctor
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-base font-bold text-white">{apt.doctorName}</h2>
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                      {apt.specialization}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-300">
                    <span className="flex items-center">
                      <strong className="text-slate-400 font-normal mr-1">Date:</strong> {apt.appointmentDate}
                    </span>
                    <span className="flex items-center">
                      <strong className="text-slate-400 font-normal mr-1">Time:</strong> {apt.appointmentTime}
                    </span>
                  </div>
                  {apt.reason && (
                    <p className="text-xs text-slate-400 italic">
                      "{apt.reason}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto">
                  {getStatusBadge(apt.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;
