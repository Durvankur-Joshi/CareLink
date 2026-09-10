import { useState } from 'react';
import api from '../../lib/api';

const emptyItem = () => ({
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: ''
});

const PrescriptionForm = ({ appointmentId, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.medicineName.trim()) {
        setError(`Medicine name is required for item ${i + 1}`);
        return;
      }
      if (!item.dosage.trim()) {
        setError(`Dosage is required for item ${i + 1}`);
        return;
      }
      if (!item.frequency.trim()) {
        setError(`Frequency is required for item ${i + 1}`);
        return;
      }
      if (!item.duration.trim()) {
        setError(`Duration is required for item ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/prescriptions', {
        appointmentId,
        notes: notes.trim() || null,
        items: items.map((item) => ({
          medicineName: item.medicineName.trim(),
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          duration: item.duration.trim(),
          instructions: item.instructions.trim() || null
        }))
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess(response.data?.data?.prescription);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create prescription';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-800 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600/20 border border-emerald-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-emerald-300">Prescription saved successfully</p>
        <p className="text-xs text-emerald-400/70">The patient can now view this prescription.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Prescription Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="General instructions for the patient..."
          rows={3}
          className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Medicines ({items.length})
          </span>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 space-y-3 relative"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-400">Medicine {index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="px-2 py-0.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/60 rounded transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  value={item.medicineName}
                  onChange={(e) => updateItem(index, 'medicineName', e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Dosage *</label>
                <input
                  type="text"
                  value={item.dosage}
                  onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                  placeholder="e.g. 500 mg"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Frequency *</label>
                <input
                  type="text"
                  value={item.frequency}
                  onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                  placeholder="e.g. Twice daily"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Duration *</label>
                <input
                  type="text"
                  value={item.duration}
                  onChange={(e) => updateItem(index, 'duration', e.target.value)}
                  placeholder="e.g. 5 days"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Instructions</label>
                <input
                  type="text"
                  value={item.instructions}
                  onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                  placeholder="e.g. After meals"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          + Add Medicine
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-900/30 cursor-pointer"
      >
        {submitting ? 'Saving Prescription...' : 'Save Prescription'}
      </button>
    </form>
  );
};

export default PrescriptionForm;
