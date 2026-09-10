import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import PrescriptionForm from '../components/prescription/PrescriptionForm';

const DoctorPrescriptionCreate = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [existingPrescription, setExistingPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aptRes, rxRes] = await Promise.all([
          api.get(`/api/appointments/${appointmentId}`),
          api.get(`/api/prescriptions/appointment/${appointmentId}`)
        ]);
        setAppointment(aptRes.data?.data?.appointment || null);
        setExistingPrescription(rxRes.data?.data?.prescription || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appointment');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

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
            to="/doctor/dashboard"
            className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (existingPrescription) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Link
              to={`/doctor/appointments/${appointmentId}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
            >
              &larr; Back to Appointment
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">Prescription Exists</h1>
          </div>

          <div className="p-6 rounded-xl bg-amber-950/30 border border-amber-800/40 text-center space-y-3">
            <p className="text-sm font-semibold text-amber-300">
              A prescription has already been created for this appointment.
            </p>
            <Link
              to={`/doctor/prescriptions/${existingPrescription.id}`}
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              View Existing Prescription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            to={`/doctor/appointments/${appointmentId}`}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
          >
            &larr; Back to Appointment
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Write Prescription</h1>
          <p className="text-sm text-slate-400 mt-0.5">Create a prescription for this appointment</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400">Patient: </span>
              <span className="text-sm font-bold text-white ml-1">{appointment.patient?.name}</span>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
              {appointment.status}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {appointment.appointmentDate} at {appointment.appointmentTime}
            {appointment.reason && (
              <span className="italic text-slate-500 ml-2">— "{appointment.reason}"</span>
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
          <PrescriptionForm
            appointmentId={appointmentId}
            onSuccess={(prescription) => {
              setTimeout(() => {
                navigate(`/doctor/prescriptions/${prescription.id}`);
              }, 1500);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptionCreate;
