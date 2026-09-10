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

  const [labOrders, setLabOrders] = useState([]);
  const [newTestName, setNewTestName] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [orderingLab, setOrderingLab] = useState(false);
  const [labError, setLabError] = useState(null);
  const [labSuccess, setLabSuccess] = useState(null);
  const [uploadingOrderId, setUploadingOrderId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [reviewingReportId, setReviewingReportId] = useState(null);

  const [activeReport, setActiveReport] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [blobError, setBlobError] = useState(null);

  const fetchLabOrders = async () => {
    try {
      const res = await api.get(`/api/labs/orders/appointment/${appointmentId}`);
      setLabOrders(res.data?.data?.labOrders || []);
    } catch (err) {
      setLabOrders([]);
    }
  };

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

        await fetchLabOrders();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  const handleOrderLab = async (e) => {
    e.preventDefault();
    if (!newTestName.trim()) {
      setLabError('Test name is required');
      return;
    }
    setOrderingLab(true);
    setLabError(null);
    setLabSuccess(null);
    try {
      await api.post('/api/labs/orders', {
        patientId: appointment.patient.id,
        appointmentId,
        testName: newTestName.trim(),
        instructions: newInstructions.trim() || undefined
      });
      setNewTestName('');
      setNewInstructions('');
      setLabSuccess('Lab order created successfully');
      await fetchLabOrders();
    } catch (err) {
      setLabError(err.response?.data?.message || 'Failed to create lab order');
    } finally {
      setOrderingLab(false);
    }
  };

  const handleFileChange = (orderId, file) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [orderId]: file
    }));
  };

  const handleUploadReport = async (orderId) => {
    const file = selectedFiles[orderId];
    if (!file) {
      setLabError('Please select a file to upload (PDF, JPG, or PNG)');
      return;
    }
    setUploadingOrderId(orderId);
    setLabError(null);
    setLabSuccess(null);
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    try {
      await api.post(`/api/labs/orders/${orderId}/report`, formDataObj);
      setLabSuccess('Report uploaded successfully');
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
      await fetchLabOrders();
    } catch (err) {
      setLabError(err.response?.data?.message || 'Failed to upload report');
    } finally {
      setUploadingOrderId(null);
    }
  };

  const handleReviewReport = async (reportId) => {
    setReviewingReportId(reportId);
    setLabError(null);
    setLabSuccess(null);
    try {
      await api.patch(`/api/labs/reports/${reportId}/review`);
      setLabSuccess('Report marked as reviewed');
      await fetchLabOrders();
    } catch (err) {
      setLabError(err.response?.data?.message || 'Failed to review report');
    } finally {
      setReviewingReportId(null);
    }
  };

  const handleOpenReport = async (report, testName) => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    setActiveReport({ ...report, testName });
    setBlobError(null);
    setLoadingBlob(true);

    try {
      const response = await api.get(`/api/labs/reports/${report.id}/file`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      setBlobUrl(url);
    } catch (err) {
      setBlobError(err.response?.data?.message || 'Failed to load report file');
    } finally {
      setLoadingBlob(false);
    }
  };

  const handleCloseModal = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    setActiveReport(null);
    setBlobError(null);
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

  const quickLabSuggestions = [
    'CBC',
    'Lipid Profile',
    'Blood Sugar (Fasting)',
    'Thyroid Profile',
    'Liver Function Test',
    'Kidney Function Test',
    'Urinalysis'
  ];

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
              <p className="text-sm text-slate-400 mt-0.5">Examine patient, review history, order lab tests, and record clinical diagnosis</p>
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

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Diagnostic Lab Orders & Reports</h3>
              <p className="text-xs text-slate-400 mt-0.5">Order tests, upload simulated report files, and review results</p>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
              Total: {labOrders.length}
            </span>
          </div>

          {labError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium flex justify-between items-center">
              <span>{labError}</span>
              <button onClick={() => setLabError(null)} className="text-xs text-rose-400 font-bold ml-3">&times;</button>
            </div>
          )}

          {labSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium flex justify-between items-center">
              <span>{labSuccess}</span>
              <button onClick={() => setLabSuccess(null)} className="text-xs text-emerald-400 font-bold ml-3">&times;</button>
            </div>
          )}

          <form onSubmit={handleOrderLab} className="p-4 rounded-lg bg-slate-900/80 border border-slate-700/70 space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Order New Lab Test</span>
            
            <div className="flex flex-wrap gap-1.5">
              {quickLabSuggestions.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setNewTestName(item)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Test Name *</label>
                <input
                  type="text"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Instructions / Preparation</label>
                <input
                  type="text"
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="e.g. 12 hours fasting required"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={orderingLab}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                {orderingLab ? 'Ordering...' : 'Order Lab Test'}
              </button>
            </div>
          </form>

          {labOrders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No lab tests ordered for this appointment yet.</p>
          ) : (
            <div className="space-y-3">
              {labOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <strong className="text-white text-sm">{order.testName}</strong>
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                        order.status === 'REVIEWED'
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : order.status === 'UPLOADED'
                          ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                          : 'bg-amber-950 border-amber-700 text-amber-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {order.instructions && (
                      <p className="text-slate-400 italic">Instructions: "{order.instructions}"</p>
                    )}

                    {order.report && (
                      <p className="text-slate-400">
                        File: <span className="font-mono text-slate-300">{order.report.fileName}</span>
                        {order.report.reviewedAt && (
                          <span className="ml-2 text-emerald-400 font-medium">✓ Reviewed</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!order.report && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                          onChange={(e) => handleFileChange(order.id, e.target.files[0])}
                          className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => handleUploadReport(order.id)}
                          disabled={uploadingOrderId === order.id}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          {uploadingOrderId === order.id ? 'Uploading...' : 'Upload Report'}
                        </button>
                      </div>
                    )}

                    {order.report && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenReport(order.report, order.testName)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          View Report
                        </button>

                        {order.status === 'UPLOADED' && (
                          <button
                            type="button"
                            onClick={() => handleReviewReport(order.report.id)}
                            disabled={reviewingReportId === order.report.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            {reviewingReportId === order.report.id ? 'Reviewing...' : 'Mark Reviewed'}
                          </button>
                        )}
                      </>
                    )}
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

        {activeReport && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850">
                <div>
                  <h3 className="text-base font-bold text-white">{activeReport.testName} - Diagnostic Report</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{activeReport.fileName}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[360px] bg-slate-900/90">
                {loadingBlob ? (
                  <div className="flex flex-col items-center space-y-2 text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Loading report preview...</span>
                  </div>
                ) : blobError ? (
                  <div className="text-center text-rose-400 text-sm">{blobError}</div>
                ) : blobUrl ? (
                  activeReport.fileType?.includes('pdf') ? (
                    <div className="w-full h-[520px] flex flex-col space-y-3">
                      <iframe
                        src={blobUrl}
                        title="Medical Report PDF"
                        className="w-full flex-1 rounded border border-slate-700 bg-white"
                      />
                      <div className="flex justify-end">
                        <a
                          href={blobUrl}
                          download={activeReport.fileName}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors inline-block"
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <img
                        src={blobUrl}
                        alt="Medical Report"
                        className="max-h-[500px] max-w-full rounded border border-slate-700 object-contain shadow"
                      />
                      <div className="flex justify-end w-full">
                        <a
                          href={blobUrl}
                          download={activeReport.fileName}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors inline-block"
                        >
                          Download Image
                        </a>
                      </div>
                    </div>
                  )
                ) : null}
              </div>

              <div className="p-3 border-t border-slate-700 bg-slate-850 flex justify-between items-center text-xs text-slate-400">
                <span>Uploaded: {new Date(activeReport.uploadedAt).toLocaleString()}</span>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorConsultation;
