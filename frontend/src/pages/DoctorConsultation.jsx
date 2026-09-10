import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const DoctorConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    symptoms: '',
    notes: '',
    diagnosis: '',
    treatmentNotes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const aptRes = await api.get(`/api/appointments/${appointmentId}`);
        const apt = aptRes.data?.data?.appointment;
        setAppointment(apt);

        if (apt?.patient?.id) {
          try {
            const histRes = await api.get(`/api/consultations/patient/${apt.patient.id}`);
            const past = (histRes.data?.data?.consultations || []).filter(
              (c) => c.appointmentId !== appointmentId
            );
            setHistory(past);
          } catch (histErr) {
            setHistory([]);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.symptoms.trim()) {
      setError('Please specify patient symptoms.');
      return;
    }
    if (!formData.notes.trim()) {
      setError('Please enter consultation notes.');
      return;
    }
    if (!formData.diagnosis.trim()) {
      setError('Please provide a clinical diagnosis.');
      return;
    }
    if (!formData.treatmentNotes.trim()) {
      setError('Please outline treatment and follow-up notes.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/consultations', {
        appointmentId,
        symptoms: formData.symptoms.trim(),
        notes: formData.notes.trim(),
        diagnosis: formData.diagnosis.trim(),
        treatmentNotes: formData.treatmentNotes.trim()
      });
      navigate('/doctor/dashboard', {
        state: { message: 'Consultation completed successfully.' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save consultation.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading consultation workspace...</span>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center space-y-4">
          <p className="text-rose-400 text-sm font-medium">{error || 'Appointment not found'}</p>
          <Link
            to="/doctor/dashboard"
            className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Back to Doctor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link
            to="/doctor/dashboard"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-3"
          >
            &larr; Back to Doctor Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Clinical Consultation Workspace</h1>
              <p className="text-sm text-slate-400 mt-0.5">Examine patient, review history, and record diagnosis & treatment plan</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 self-start sm:self-auto">
              Status: {appointment.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/80 pb-2">
            Patient Overview
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Patient Name</span>
              <strong className="text-base text-white">{appointment.patient?.name}</strong>
              <span className="text-slate-400 block font-mono text-[11px] mt-0.5">{appointment.patient?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Scheduled Time</span>
              <strong className="text-sm text-slate-200">{appointment.appointmentDate} at {appointment.appointmentTime}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Visit Reason</span>
              <span className="text-xs text-slate-300 italic">{appointment.reason || 'None specified'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700/80 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Patient History ({history.length})
            </span>
            <span className="text-[11px] text-slate-400">Previous consultations sorted newest first</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No previous consultations recorded for this patient.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {history.map((c) => (
                <div key={c.id} className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-300">{c.doctorName} ({c.specialization})</span>
                    <span className="text-slate-400">{c.appointmentDate || new Date(c.consultationDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400">Diagnosis: </strong>
                    <span className="text-white font-medium">{c.diagnosis}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400">Symptoms: </strong>
                    <span className="text-slate-300">{c.symptoms}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400">Notes: </strong>
                    <span className="text-slate-300">{c.notes}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400">Treatment: </strong>
                    <span className="text-slate-300">{c.treatmentNotes}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/80 pb-2">
            Current Consultation Notes
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Reported Symptoms
            </label>
            <textarea
              name="symptoms"
              rows={3}
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="e.g. Fever, persistent cough for 3 days, mild shortness of breath..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            ></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Clinical Findings & Examination Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Vitals normal, chest clear, pharynx inflamed, patient reports fatigue..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            ></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Diagnosis
            </label>
            <textarea
              name="diagnosis"
              rows={2}
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="e.g. Acute upper respiratory tract infection / viral pharyngitis..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            ></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Treatment Plan & Recommendations
            </label>
            <textarea
              name="treatmentNotes"
              rows={3}
              value={formData.treatmentNotes}
              onChange={handleChange}
              placeholder="e.g. Adequate rest, warm hydration, steam inhalation. Review in 5 days if symptoms persist..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            ></textarea>
          </div>

          <div className="pt-3 border-t border-slate-700 flex justify-end gap-3">
            <Link
              to="/doctor/dashboard"
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-md cursor-pointer"
            >
              {saving ? 'Saving Consultation...' : 'Save Consultation & Complete Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorConsultation;
