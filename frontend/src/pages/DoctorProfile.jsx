import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

const DoctorProfile = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/doctors/${id}`);
        setDoctor(response.data?.data?.doctor || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading doctor profile...</span>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center space-y-4">
          <p className="text-rose-400 text-sm font-medium">{error || 'Doctor not found'}</p>
          <Link
            to="/patient/doctors"
            className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            to="/patient/doctors"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
          >
            &larr; Back to All Doctors
          </Link>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-700 pb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{doctor.name}</h1>
                <p className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mt-1">
                  {doctor.specialization}
                </p>
                <p className="text-xs text-slate-400 mt-1">{doctor.qualification}</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Consultation Fee</div>
                <div className="text-2xl font-bold text-white mt-0.5">₹{doctor.consultationFee}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/60">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Experience</div>
                <div className="text-base font-bold text-slate-100 mt-1">{doctor.experience} Years</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/60">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Qualifications</div>
                <div className="text-base font-bold text-slate-100 mt-1">{doctor.qualification}</div>
              </div>
            </div>

            {doctor.bio && (
              <div className="space-y-1.5">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">About Doctor</div>
                <p className="text-sm text-slate-300 leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-700 flex gap-3">
              <Link
                to={`/patient/appointments/book/${doctor.id}`}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg text-center transition-colors shadow-md"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
