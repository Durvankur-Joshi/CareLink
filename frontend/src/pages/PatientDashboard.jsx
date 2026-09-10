import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loadingApt, setLoadingApt] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const response = await api.get('/api/appointments/my');
        const appointments = response.data?.data?.appointments || [];
        const booked = appointments.find((a) => a.status === 'BOOKED');
        setUpcomingAppointment(booked || null);
      } catch (err) {
        setUpcomingAppointment(null);
      } finally {
        setLoadingApt(false);
      }
    };

    fetchUpcoming();
  }, []);

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

        <div className="rounded-lg bg-slate-900/80 p-4 border border-slate-700/70 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Upcoming Appointment
          </div>
          {loadingApt ? (
            <p className="text-xs text-slate-400">Checking appointment schedule...</p>
          ) : upcomingAppointment ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-white">{upcomingAppointment.doctorName}</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-indigo-950 border border-indigo-700 text-indigo-300">
                  {upcomingAppointment.status}
                </span>
              </div>
              <p className="text-xs text-cyan-400 font-medium">{upcomingAppointment.specialization}</p>
              <p className="text-xs text-slate-300">
                {upcomingAppointment.appointmentDate} at {upcomingAppointment.appointmentTime}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-1">No upcoming appointments found.</p>
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
