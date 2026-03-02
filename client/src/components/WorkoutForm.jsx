import { useState, useEffect } from 'react';

function WorkoutForm({ onWorkoutLogged }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [type, setType] = useState('Running');
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/users`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        setUsers(data);
        // Set the default user to the first one in the list
        if (data.length > 0) {
          setUserId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    }
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/workouts`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type,
          duration: Number(duration), // Ensure duration is sent as a number
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Notify the parent component (App.jsx) that a workout was logged
      onWorkoutLogged();

      // Reset part of the form for the next entry
      setType('');
      setDuration(0);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Log a New Workout</h2>
      {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
      <div>
        <label>Select User:</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        >
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Workout Type:</label>
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="e.g., Weightlifting, Cardio"
          required
        />
      </div>
      <div>
        <label>Duration (minutes):</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
          min="1"
        />
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Logging...' : 'Log Workout'}
      </button>
    </form>
  );
}

export default WorkoutForm;
