import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Auth from './components/Auth';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import MyProfile from './pages/MyProfile';
import HomePage from './pages/HomePage';
import ManageExercisePage from './pages/ManageExercisePage';
import ManageWorkoutPage from './pages/ManageWorkoutPage';
import ManagePlanPage from './pages/ManagePlanPage';
import PlanDetailPage from './pages/PlanDetailPage';
import ActiveWorkoutPage from './pages/ActiveWorkoutPage';
import TrainingPlansPage from './pages/TrainingPlansPage';
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
            <Route path="/admin/plans/:id" element={
              <ProtectedRoute>
                <ManagePlanPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/exercises/:id" element={
              <ProtectedRoute>
                <ManageExercisePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/workouts/:id" element={
              <ProtectedRoute>
                <ManageWorkoutPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/plans" element={<TrainingPlansPage />} />
            <Route path="/plans/:id" element={<PlanDetailPage />} />
            <Route path="/workout-session" element={<ActiveWorkoutPage />} />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App;
