import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const ReceptionAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchAppointment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/reception/appointments/${id}`);
      setAppointment(response.data?.data?.appointment || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await api.patch(`/api/reception/appointments/${id}/check-in`);
      setMessage('Patient successfully checked in');
      await fetchAppointment();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToQueue = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await api.patch(`/api/reception/appointments/${id}/queue`);
      setMessage('Patient successfully placed into consultation queue');
      await fetchAppointment();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to queue');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading appointment...</span>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center space-y-4">
          <p className="text-rose-400 text-sm font-medium">{error || 'Appointment not found'}</p>
          <Link
            to="/reception/dashboard"
            className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Back to Reception Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            to="/reception/dashboard"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
          >
            &larr; Back to Reception Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reception Appointment Details</h1>
          <p className="text-sm text-slate-400 mt-0.5">Administrative and check-in details</p>
        </div>

        {message && (
          <div className="p-4 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm font-medium">
            {message}
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-700 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Status</span>
              <div className="mt-1">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
                  {appointment.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Schedule</span>
              <p className="text-sm font-bold text-white mt-1">
                {appointment.appointmentDate} at {appointment.appointmentTime}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Patient Details</div>
            <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-1.5">
              <div>
                <span className="text-xs text-slate-400">Name: </span>
                <span className="text-sm font-bold text-white ml-1">{appointment.patient?.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400">Patient ID: </span>
                <span className="text-xs font-mono text-slate-300 ml-1">{appointment.patient?.id}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Doctor Details</div>
            <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-1.5">
              <div>
                <span className="text-xs text-slate-400">Doctor: </span>
                <span className="text-sm font-semibold text-white ml-1">{appointment.doctor?.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400">Specialization: </span>
                <span className="text-xs text-cyan-400 ml-1">{appointment.doctor?.specialization}</span>
              </div>
            </div>
          </div>

          {appointment.reason && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reason for Visit</div>
              <p className="text-xs text-slate-300 italic p-3 bg-slate-900/70 rounded-lg border border-slate-700/60">
                "{appointment.reason}"
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
            <button
              onClick={() => navigate('/reception/dashboard')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>

            {appointment.status === 'BOOKED' && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {actionLoading ? 'Checking in...' : 'Check In Patient'}
              </button>
            )}

            {appointment.status === 'CHECKED_IN' && (
              <button
                onClick={handleAddToQueue}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {actionLoading ? 'Adding...' : 'Add to Consultation Queue'}
              </button>
            )}

            {appointment.status === 'IN_QUEUE' && (
              <span className="text-xs text-indigo-400 font-semibold">
                Waiting for Doctor
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionAppointmentDetail;
