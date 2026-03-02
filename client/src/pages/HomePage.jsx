import { useState, useEffect, useCallback } from 'react';
import WorkoutForm from '../components/WorkoutForm';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { session } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/leaderboard`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
    if (session) fetchLeaderboard();
  }, [session, refreshKey, fetchLeaderboard]);

  const handleWorkoutLogged = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <>
      <WorkoutForm onWorkoutLogged={handleWorkoutLogged} />
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
  );
};

export default HomePage;