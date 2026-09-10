import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const DoctorAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      setLoading(true);
      setError(null);
      try {
        const [aptRes, labRes] = await Promise.all([
          api.get(`/api/appointments/${id}`),
          api.get(`/api/labs/orders/appointment/${id}`).catch(() => ({ data: { data: { labOrders: [] } } }))
        ]);
        setAppointment(aptRes.data?.data?.appointment || null);
        setLabOrders(labRes.data?.data?.labOrders || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const handleStartConsultation = async () => {
    setStarting(true);
    setError(null);
    try {
      await api.patch(`/api/appointments/${id}/start-consultation`);
      navigate(`/doctor/consultation/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start consultation');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading appointment details...</span>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center space-y-4">
          <p className="text-rose-400 text-sm font-medium">{error || 'Appointment not found'}</p>
          <Link
            to="/doctor/dashboard"
            className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
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
            to="/doctor/dashboard"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
          >
            &larr; Back to Doctor Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Appointment Details</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review patient information and scheduled consultation details</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-700 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Appointment Status</span>
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
            <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-2">
              <div>
                <span className="text-xs text-slate-400">Name: </span>
                <span className="text-sm font-bold text-white ml-1">{appointment.patient?.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400">Email: </span>
                <span className="text-xs font-mono text-slate-300 ml-1">{appointment.patient?.email}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Consultation Details</div>
            <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-2">
              <div>
                <span className="text-xs text-slate-400">Doctor: </span>
                <span className="text-sm font-semibold text-white ml-1">{appointment.doctor?.name}</span>
                <span className="text-xs text-cyan-400 ml-2">({appointment.doctor?.specialization})</span>
              </div>
              {appointment.reason && (
                <div>
                  <span className="text-xs text-slate-400">Reason for Visit: </span>
                  <p className="text-xs text-slate-200 mt-1 italic">"{appointment.reason}"</p>
                </div>
              )}
            </div>
          </div>

          {labOrders.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Diagnostic Lab Orders ({labOrders.length})</div>
              <div className="p-4 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-2">
                {labOrders.map((o) => (
                  <div key={o.id} className="flex justify-between items-center text-xs border-b border-slate-800 last:border-0 pb-2 last:pb-0">
                    <div>
                      <span className="font-bold text-white">{o.testName}</span>
                      {o.instructions && <span className="text-slate-400 ml-2">({o.instructions})</span>}
                    </div>
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${
                      o.status === 'REVIEWED'
                        ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                        : o.status === 'UPLOADED'
                        ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                        : 'bg-amber-950 border-amber-700 text-amber-300'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
            <Link
              to="/doctor/dashboard"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </Link>

            <div className="flex items-center space-x-3">
              {appointment.status === 'IN_QUEUE' && (
                <button
                  onClick={handleStartConsultation}
                  disabled={starting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {starting ? 'Starting...' : 'Start Consultation'}
                </button>
              )}

              {appointment.status === 'IN_CONSULTATION' && (
                <Link
                  to={`/doctor/consultation/${appointment.id}`}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Continue Consultation
                </Link>
              )}

              {appointment.status === 'COMPLETED' && (
                <Link
                  to={`/patient/consultations/${appointment.consultationId || appointment.id}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  View Consultation Notes
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentDetail;


