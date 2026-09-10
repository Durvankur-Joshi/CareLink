import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import PrescriptionDetails from '../components/prescription/PrescriptionDetails';

const DoctorPrescriptionView = () => {
  const { id } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const response = await api.get(`/api/prescriptions/${id}`);
        setPrescription(response.data?.data?.prescription || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load prescription');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading prescription...</span>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center space-y-4">
          <p className="text-rose-400 text-sm font-medium">{error || 'Prescription not found'}</p>
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
          {prescription.appointmentId && (
            <Link
              to={`/doctor/appointments/${prescription.appointmentId}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
            >
              &larr; Back to Appointment
            </Link>
          )}
        </div>

        <PrescriptionDetails prescription={prescription} />

        <div className="pt-2 border-t border-slate-700 flex justify-end">
          <Link
            to="/doctor/dashboard"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptionView;
