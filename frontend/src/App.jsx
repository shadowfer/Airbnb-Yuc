import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import VerifyIdentity from './pages/VerifyIdentity';
import CreateProperty from './pages/CreateProperty';
import Search from './pages/Search';
import PropertyDetail from './pages/PropertyDetail';
import AvailabilityCalendar from './pages/AvailabilityCalendar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/profile/verify" element={
                <ProtectedRoute><VerifyIdentity /></ProtectedRoute>
              } />
              <Route path="/host/properties/create" element={
                <ProtectedRoute><CreateProperty /></ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute><Search /></ProtectedRoute>
              } />
              <Route path="/properties/:id" element={
                <ProtectedRoute><PropertyDetail /></ProtectedRoute>
              } />
              <Route path="/host/properties/:id/availability" element={
                <ProtectedRoute><AvailabilityCalendar /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
