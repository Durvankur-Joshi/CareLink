import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorList from './pages/DoctorList';
import DoctorProfile from './pages/DoctorProfile';
import BookAppointment from './pages/BookAppointment';
import PatientAppointments from './pages/PatientAppointments';
import DoctorAppointmentDetail from './pages/DoctorAppointmentDetail';
import ReceptionAppointmentDetail from './pages/ReceptionAppointmentDetail';
import DoctorConsultation from './pages/DoctorConsultation';
import PatientConsultationView from './pages/PatientConsultationView';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading CareLink...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'PATIENT':
      return <Navigate to="/patient/dashboard" replace />;
    case 'DOCTOR':
      return <Navigate to="/doctor/dashboard" replace />;
    case 'RECEPTION':
      return <Navigate to="/reception/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/doctors"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DoctorList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/doctors/:id"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <DoctorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments/book/:doctorId"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <PatientAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments/:id"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <DoctorAppointmentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/consultation/:appointmentId"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <DoctorConsultation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/consultations/:id"
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR']}>
                <PatientConsultationView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception/dashboard"
            element={
              <ProtectedRoute allowedRoles={['RECEPTION']}>
                <ReceptionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception/appointments/:id"
            element={
              <ProtectedRoute allowedRoles={['RECEPTION']}>
                <ReceptionAppointmentDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
