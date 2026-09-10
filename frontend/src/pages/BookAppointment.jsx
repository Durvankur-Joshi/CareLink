import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30'
];

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoadingDoctor(true);
      try {
        const response = await api.get(`/api/doctors/${doctorId}`);
        setDoctor(response.data?.data?.doctor || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch doctor details');
      } finally {
        setLoadingDoctor(false);
      }
    };

    fetchDoctor();
  }, [doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!appointmentDate) {
      setError('Please select an appointment date.');
      return;
    }

    if (!appointmentTime) {
      setError('Please select an appointment time slot.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/api/appointments', {
        doctorId,
        appointmentDate,
        appointmentTime,
        reason: reason.trim() || undefined
      });
      navigate('/patient/appointments', {
        state: { message: 'Appointment booked successfully!' }
      });
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to book appointment. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingDoctor) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading appointment booking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            to={`/patient/doctors/${doctorId}`}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
          >
            &larr; Back to Doctor Profile
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Book Appointment</h1>
          <p className="text-sm text-slate-400 mt-0.5">Select a suitable date and time slot for your consultation</p>
        </div>

        {doctor && (
          <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">{doctor.name}</h2>
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mt-0.5">
                {doctor.specialization}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{doctor.qualification}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Fee</span>
              <span className="text-lg font-bold text-white">₹{doctor.consultationFee}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6 shadow-xl">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Appointment Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Time Slot
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {TIME_SLOTS.map((slot) => {
                const isSelected = appointmentTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setAppointmentTime(slot)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Reason for Visit (Optional)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe any symptoms or the purpose of your consultation..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors shadow-md cursor-pointer"
          >
            {isSubmitting ? 'Confirming Appointment...' : 'Confirm & Book Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
