import { useState } from 'react';

function WorkoutForm({ session, onWorkoutLogged }) {
  const [type, setType] = useState('Running');
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!session) throw new Error('You must be logged in to log a workout.');

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/workouts`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id, // Use the logged-in user's ID
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
