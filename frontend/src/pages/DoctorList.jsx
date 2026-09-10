import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctors = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = query.trim()
        ? `/api/doctors?search=${encodeURIComponent(query.trim())}`
        : '/api/doctors';
      const response = await api.get(url);
      setDoctors(response.data?.data?.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors(searchTerm);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <Link
                to="/patient/dashboard"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                &larr; Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Find a Doctor</h1>
            <p className="text-sm text-slate-400 mt-0.5">Search and schedule appointments with certified specialists</p>
          </div>
          <Link
            to="/patient/appointments"
            className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            My Appointments
          </Link>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by doctor name or specialization (e.g. Cardiologist)..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchDoctors('');
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm">Loading doctors...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-medium">
            {error}
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 rounded-xl bg-slate-800/60 border border-slate-800 text-center space-y-2">
            <p className="text-base font-semibold text-slate-200">No doctors found</p>
            <p className="text-sm text-slate-400">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-600 transition-colors space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold text-white tracking-tight">{doc.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-medium">
                      ₹{doc.consultationFee}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    {doc.specialization}
                  </div>
                  <div className="text-xs text-slate-400">
                    {doc.qualification} &bull; {doc.experience} years experience
                  </div>
                  {doc.bio && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pt-1">
                      {doc.bio}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex gap-2">
                  <Link
                    to={`/patient/doctors/${doc.id}`}
                    className="flex-1 text-center py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/patient/appointments/book/${doc.id}`}
                    className="flex-1 text-center py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorList;
