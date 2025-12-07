import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
// Se eliminó DoctorTypeSelection porque ya no es la página de inicio
import DoctorLogin from './pages/DoctorLogin';
import DoctorPatientAction from './pages/DoctorPatientAction';
import AdminPage from './pages/AdminPage';
import PatientSearch from './pages/PatientSearch';
import CreatePatient from './pages/CreatePatient';
import PatientsList from './pages/PatientsList';
import PatientDetails from './pages/PatientDetails';
import PatientVisits from './pages/PatientVisits';
import VisitDetails from './pages/VisitDetails';
import VisitSummaryPage from './pages/VisitSummary';
import ClinicUsers from './pages/ClinicUsers';
import ChangePassword from './pages/ChangePassword';
import './App.css';
import './styles/theme.css';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ===== INICIO: Redirige directamente al Login ===== */}
          <Route path="/" element={<Navigate to="/doctor-login" replace />} />
          
          {/* ===== LOGIN CLÍNICA (sin protección, es público) ===== */}
          <Route path="/doctor-login" element={<DoctorLogin />} />


          {/* ===== RUTAS PROTEGIDAS - SUPER-ADMIN ===== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />


          {/* ===== RUTAS PROTEGIDAS - USUARIOS CLÍNICA ===== */}
          <Route
            path="/doctor-patient-action"
            element={
              <ProtectedRoute>
                <DoctorPatientAction />
              </ProtectedRoute>
            }
          />
          <Route path="/tenant-users" element={<ProtectedRoute><ClinicUsers /></ProtectedRoute>} />
          <Route
            path="/search-patient"
            element={
              <ProtectedRoute>
                <PatientSearch />
              </ProtectedRoute>
            }
          />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route
            path="/create-patient"
            element={
              <ProtectedRoute>
                <CreatePatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients-list"
            element={
              <ProtectedRoute>
                <PatientsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-details/:patientId"
            element={
              <ProtectedRoute>
                <PatientDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-visits/:patientId"
            element={
              <ProtectedRoute>
                <PatientVisits />
              </ProtectedRoute>
            }
          />
           {/* ===== NUEVA CONSULTA (SIN visitId) ===== */}
          <Route
            path="/visit-details/:patientId"
            element={
              <ProtectedRoute>
                <VisitDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visit-details/:patientId/:visitId"
            element={
              <ProtectedRoute>
                <VisitDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visit-summary/:visitId"
            element={
              <ProtectedRoute>
                <VisitSummaryPage />
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* ============================================ */}
        {/* TOAST NOTIFICATIONS PROVIDER                 */
        /* ============================================ */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #e5e8f0',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              style: {
                background: '#e8f5e9',
                color: '#1a8659',
                border: '1px solid #4caf50',
              },
              iconTheme: {
                primary: '#4caf50',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                background: '#ffebee',
                color: '#c62828',
                border: '1px solid #ef5350',
              },
              iconTheme: {
                primary: '#ef5350',
                secondary: '#fff',
              },
            },
            loading: {
              style: {
                background: '#e3f2fd',
                color: '#1976d2',
                border: '1px solid #64b5f6',
              },
              iconTheme: {
                primary: '#1976d2',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}


export default App;