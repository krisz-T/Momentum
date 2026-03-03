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
import { FaDumbbell } from 'react-icons/fa';

function App() {
  const { session, isPasswordRecovery, onPasswordUpdated } = useAuth();

  return (
    <div className="container">
      {isPasswordRecovery ? (
        <ResetPassword onPasswordUpdated={onPasswordUpdated} />
      ) : !session ? (
        <div className="auth-page-wrapper">
          <h1 className="brand-title">
            <FaDumbbell style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            Momentum
          </h1>
          <Auth />
        </div>
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
