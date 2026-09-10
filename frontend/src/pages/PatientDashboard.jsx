import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeAppointment, setActiveAppointment] = useState(null);
  const [loadingApt, setLoadingApt] = useState(true);
  const [latestPrescription, setLatestPrescription] = useState(null);
  const [loadingRx, setLoadingRx] = useState(true);

  const fetchActiveAppointment = async () => {
    try {
      const response = await api.get('/api/appointments/my');
      const appointments = response.data?.data?.appointments || [];
      const current = appointments.find(
        (a) => a.status === 'IN_QUEUE' || a.status === 'CHECKED_IN' || a.status === 'BOOKED'
      );
      setActiveAppointment(current || null);
    } catch (err) {
      setActiveAppointment(null);
    } finally {
      setLoadingApt(false);
    }
  };

  const fetchLatestPrescription = async () => {
    try {
      const response = await api.get('/api/prescriptions/my');
      const prescriptions = response.data?.data?.prescriptions || [];
      setLatestPrescription(prescriptions.length > 0 ? prescriptions[0] : null);
    } catch (err) {
      setLatestPrescription(null);
    } finally {
      setLoadingRx(false);
    }
  };

  useEffect(() => {
    fetchActiveAppointment();
    fetchLatestPrescription();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const renderStatusDetails = (appointment) => {
    if (appointment.status === 'IN_QUEUE') {
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
              {appointment.queuePosition ? `#${appointment.queuePosition} In Queue` : 'In Queue'}
            </span>
          </div>
          {appointment.queuePosition && (
            <p className="text-xs text-indigo-300 font-medium">
              You are #{appointment.queuePosition} in the queue
            </p>
          )}
        </div>
      );
    }

    if (appointment.status === 'CHECKED_IN') {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-950 border border-amber-700 text-amber-300">
          ✓ Checked In
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 border border-slate-700 text-slate-300">
        Appointment Booked
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl space-y-6">
        <div className="border-b border-slate-700 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">CareLink</h1>
            <p className="text-xs text-slate-400 mt-0.5">Patient Portal</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300">
            Role: Patient
          </span>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome, {user?.name}</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
        </div>

        <div className="rounded-lg bg-slate-900/80 p-4 border border-slate-700/70 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Upcoming Appointment
            </span>
            <button
              onClick={fetchActiveAppointment}
              className="text-[11px] text-indigo-400 hover:text-indigo-300"
            >
              Refresh
            </button>
          </div>

          {loadingApt ? (
            <p className="text-xs text-slate-400">Checking appointment status...</p>
          ) : activeAppointment ? (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-white">{activeAppointment.doctorName}</span>
                {renderStatusDetails(activeAppointment)}
              </div>
              <p className="text-xs text-cyan-400 font-medium">{activeAppointment.specialization}</p>
              <p className="text-xs text-slate-300">
                {activeAppointment.appointmentDate} at {activeAppointment.appointmentTime}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-1">No upcoming appointments found.</p>
          )}
        </div>

        <div className="rounded-lg bg-slate-900/80 p-4 border border-slate-700/70 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Latest Prescription
          </span>

          {loadingRx ? (
            <p className="text-xs text-slate-400">Loading prescription...</p>
          ) : latestPrescription ? (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-white">
                  Dr. {latestPrescription.doctor?.name}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
                  {latestPrescription.medicineCount} medicine{latestPrescription.medicineCount !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {new Date(latestPrescription.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <Link
                to={`/patient/prescriptions/${latestPrescription.id}`}
                className="inline-block px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-lg transition-colors"
              >
                View Prescription
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-1">No prescriptions yet.</p>
          )}
        </div>

        <div className="space-y-2.5">
          <Link
            to="/patient/doctors"
            className="w-full block py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg text-center transition-colors shadow-sm"
          >
            Find a Doctor
          </Link>
          <Link
            to="/patient/appointments"
            className="w-full block py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg text-center transition-colors"
          >
            My Appointments
          </Link>
          <Link
            to="/patient/prescriptions"
            className="w-full block py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg text-center transition-colors"
          >
            My Prescriptions
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-700/60">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

