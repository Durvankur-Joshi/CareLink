import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const PatientLabs = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeReport, setActiveReport] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [blobError, setBlobError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/labs/orders/my');
      setOrders(res.data?.data?.labOrders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ORDERED':
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300">
            Pending Report
          </span>
        );
      case 'UPLOADED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300">
            Report Uploaded
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300">
            ✓ Reviewed by Doctor
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-950/80 border border-rose-700/80 text-rose-300">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <Link
              to="/patient/dashboard"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block mb-1"
            >
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">Lab Tests & Medical Reports</h1>
            <p className="text-sm text-slate-400 mt-0.5">View test requests ordered by your physician and download uploaded diagnostic reports</p>
          </div>
          <div>
            <button
              onClick={fetchOrders}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm">Loading lab orders & diagnostic reports...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 rounded-xl bg-slate-800/60 border border-slate-800 text-center space-y-2">
            <p className="text-base font-semibold text-slate-200">No lab tests ordered</p>
            <p className="text-sm text-slate-400">No diagnostic tests or medical reports have been ordered for your account yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-base font-bold text-white">{order.testName}</h2>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span>
                      <strong className="text-slate-400 font-normal">Doctor:</strong> {order.doctorName} ({order.specialization})
                    </span>
                    <span>
                      <strong className="text-slate-400 font-normal">Ordered:</strong> {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    {order.appointmentDate && (
                      <span>
                        <strong className="text-slate-400 font-normal">Appointment:</strong> {order.appointmentDate}
                      </span>
                    )}
                  </div>

                  {order.instructions && (
                    <p className="text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                      Instructions: "{order.instructions}"
                    </p>
                  )}

                  {order.report && (
                    <div className="text-xs text-slate-400 flex items-center space-x-3 pt-1">
                      <span>File: <strong className="text-slate-300 font-mono">{order.report.fileName}</strong></span>
                      {order.report.reviewedAt && (
                        <span className="text-emerald-400 font-medium">
                          Reviewed: {new Date(order.report.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto">
                  {order.report ? (
                    <button
                      onClick={() => handleOpenReport(order.report, order.testName)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      View Report
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Report not uploaded yet
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeReport && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850">
                <div>
                  <h3 className="text-base font-bold text-white">{activeReport.testName} - Report</h3>
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
                <span>
                  Uploaded on: {new Date(activeReport.uploadedAt).toLocaleString()}
                </span>
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

export default PatientLabs;
