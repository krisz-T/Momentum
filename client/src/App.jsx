import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import WorkoutForm from './components/WorkoutForm';
import Auth from './components/Auth';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // This state acts as a trigger to refetch data
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProfile = useCallback(async (session) => {
    if (!session) {
      setUserProfile(null);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const profileData = await response.json();
      setUserProfile(profileData);
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    }
  }, []);

  useEffect(() => {
    // Check for an active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchProfile(session);
    });

    // Listen for changes in authentication state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // When the user logs in or out, update the session
      setSession(session);
      fetchProfile(session);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        // Only exit recovery mode on explicit sign out
        setIsPasswordRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      // Use the environment variable for the API base URL
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/leaderboard`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (e) {
      setError(e.message);
      console.error("Failed to fetch leaderboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchLeaderboard(); // Only fetch if logged in
  }, [session, refreshKey, fetchLeaderboard]); // Reruns when refreshKey changes

  const handleWorkoutLogged = () => {
    // Increment the key to trigger the useEffect hook and refetch data
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="container">
      {isPasswordRecovery ? (
        <ResetPassword onPasswordUpdated={() => setIsPasswordRecovery(false)} />
      )
      :
      !session ? (
        <Auth />
      ) : (
        <div>
          <header>
            <span>Welcome, {session.user.email}</span>
            {userProfile?.role === 'Admin' && (
              <Link to="/admin">Admin Dashboard</Link>
            )}
            <button onClick={handleLogout}>Logout</button>
          </header>
          <Routes>
            <Route path="/" element={
              <>
                <WorkoutForm session={session} onWorkoutLogged={handleWorkoutLogged} />
                <hr />
                <h1>Momentum Leaderboard</h1>
                {loading && <p>Loading...</p>}
                {error && <p>Error: {error}</p>}
                {!loading && !error && (
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((user, index) => (
                        <tr key={user.id}>
                          <td>{index + 1}</td>
                          <td>{user.name}</td>
                          <td>{user.total_xp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            } />
            <Route path="/admin" element={
              <ProtectedRoute userProfile={userProfile}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App;
