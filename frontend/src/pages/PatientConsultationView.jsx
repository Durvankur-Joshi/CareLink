import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const PatientConsultationView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      setLoading(true);
      setError(null);
      try {
        let res;
        try {
          res = await api.get(`/api/consultations/${id}`);
        } catch (err) {
          if (err.response?.status === 404) {
            res = await api.get(`/api/consultations/appointment/${id}`);
          } else {
            throw err;
          }
        }
        setConsultation(res.data?.data?.consultation || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load consultation details');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [id]);

  const backLink = user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/appointments';
  const backLabel = user?.role === 'DOCTOR' ? 'Doctor Dashboard' : 'My Appointments';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading consultation record...</span>
        </div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center space-y-4">
          <p className="text-rose-400 text-sm font-medium">{error || 'Consultation record not found'}</p>
          <Link
            to={backLink}
            className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Back to {backLabel}
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
            to={backLink}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
          >
            &larr; Back to {backLabel}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Consultation Summary</h1>
              <p className="text-sm text-slate-400 mt-0.5">Clinical notes, diagnosis, and treatment plan recorded by physician</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 self-start sm:self-auto">
              Completed
            </span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-700/80 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[11px]">Consulting Doctor</span>
              <span className="text-base font-bold text-white mt-0.5 block">{consultation.doctor?.name}</span>
              <span className="text-cyan-400 font-medium">{consultation.doctor?.specialization}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[11px]">Patient</span>
              <span className="text-base font-bold text-white mt-0.5 block">{consultation.patient?.name}</span>
              <span className="text-slate-400">
                Scheduled: {consultation.appointment?.appointmentDate} at {consultation.appointment?.appointmentTime}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Reported Symptoms
              </span>
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {consultation.symptoms}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Clinical Examination Notes
              </span>
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {consultation.notes}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block">
                Primary Diagnosis
              </span>
              <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-800/80 text-sm text-white font-medium leading-relaxed whitespace-pre-wrap">
                {consultation.diagnosis}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">
                Treatment Plan & Recommendations
              </span>
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-700/60 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {consultation.treatmentNotes}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/80 flex justify-between items-center text-xs text-slate-400">
            <span>
              Recorded on: {new Date(consultation.createdAt).toLocaleString()}
            </span>
            <Link
              to={backLink}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Back to {backLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientConsultationView;
