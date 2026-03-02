import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Auth from './components/Auth';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import MyProfile from './pages/MyProfile';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { session } = useAuth();
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // This effect now only handles the special case for password recovery UI.
    // All other auth logic is in AuthContext.
    const urlHash = window.location.hash;
    if (urlHash.includes('type=recovery')) {
      setIsPasswordRecovery(true);
    }
  }, []);

  return (
    <div className="container">
      {isPasswordRecovery ? (
        <ResetPassword onPasswordUpdated={() => setIsPasswordRecovery(false)} />
      ) : !session ? (
        <Auth />
      ) : (
        <div>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={<MyProfile />} />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App;
