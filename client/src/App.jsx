import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // The URL of your running Express server's leaderboard endpoint
        const response = await fetch('http://localhost:3001/api/leaderboard');
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
    }

    fetchLeaderboard();
  }, []); // The empty dependency array means this effect runs once when the component mounts

  return (
    <div>
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
              <tr key={user.name}>
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
