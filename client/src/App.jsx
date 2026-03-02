import { useState, useEffect, useCallback } from 'react';
import './App.css';
import WorkoutForm from './components/WorkoutForm';

function App() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // This state acts as a trigger to refetch data
  const [refreshKey, setRefreshKey] = useState(0);

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
    fetchLeaderboard();
  }, [refreshKey, fetchLeaderboard]); // Reruns when refreshKey changes

  const handleWorkoutLogged = () => {
    // Increment the key to trigger the useEffect hook and refetch data
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div>
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
    </div>
  );
}

export default App;
