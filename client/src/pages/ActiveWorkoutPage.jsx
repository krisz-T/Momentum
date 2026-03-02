import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ActiveWorkoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { workout } = location.state || {}; // Get the workout data passed from the previous page

  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  useEffect(() => {
    if (!workout) {
      // If no workout data is passed, redirect back to plans page
      navigate('/plans');
      return;
    }

    let interval;
    if (!isPaused) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval); // Cleanup on component unmount or pause
  }, [isPaused, workout, navigate]);

  const formatTime = (seconds) => {
    const getSeconds = `0${seconds % 60}`.slice(-2);
    const minutes = `${Math.floor(seconds / 60)}`;
    const getMinutes = `0${minutes % 60}`.slice(-2);
    const getHours = `0${Math.floor(seconds / 3600)}`.slice(-2);
    return `${getHours}:${getMinutes}:${getSeconds}`;
  };

  const handleFinishWorkout = async () => {
    if (!session) {
      alert('Error: Not logged in.');
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: workout.workout_type,
          duration: timer, // Send the exact duration in seconds
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to log workout.');
      }
      alert(`Workout Logged! You earned XP for ${formatTime(timer)} of work!`);
      navigate('/'); // Go back to home
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!workout) return null;

  const currentExercise = workout.workout_exercises[currentExerciseIndex];

  return (
    <div className="active-workout-container">
      <div className="timer-display">{formatTime(timer)}</div>

      <div className="current-exercise-card">
        <h2>Current Exercise</h2>
        <h3>{currentExercise?.exercises.name || 'Finished!'}</h3>
        {currentExercise && (
          <p className="sets-reps">
            {currentExercise.sets} sets of {currentExercise.reps || `${currentExercise.duration_seconds} seconds`}
          </p>
        )}
        {currentExercise?.exercises.video_url && (
          <div className="video-container">
            <iframe
              src={currentExercise.exercises.video_url}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen></iframe>
          </div>
        )}
      </div>

      <div className="workout-controls">
        <button onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
          disabled={currentExerciseIndex >= workout.workout_exercises.length - 1}
        >
          Next Exercise
        </button>
        <button onClick={handleFinishWorkout} className="finish-button">
          Finish Workout
        </button>
      </div>
    </div>
  );
};

export default ActiveWorkoutPage;