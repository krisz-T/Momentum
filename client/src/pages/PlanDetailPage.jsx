import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PlanDetailPage = () => {
  const { session } = useAuth();
  const { id } = useParams(); // Get the plan ID from the URL
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plan details
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/${id}`);
        if (!response.ok) throw new Error('Failed to fetch plan details');
        const data = await response.json();
        // Sort the workouts by day
        data.plan_workouts.sort((a, b) => a.day_of_plan - b.day_of_plan);
        setPlan(data);

        // Check enrollment status
        if (session) {
          const enrollResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/enrollments`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          const enrollments = await enrollResponse.json();
          if (enrollments.some(e => e.plan_id === id)) {
            setIsEnrolled(true);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, session]);

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/${id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Enrollment failed');
      }
      setIsEnrolled(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsEnrolling(false);
    }
  };

  if (loading) return <p>Loading plan details...</p>;
  if (error) return <p style={{ color: '#ff6b6b' }}>Error: {error}</p>;
  if (!plan) return <p>Plan not found.</p>;

  return (
    <div>
      <nav>
        <Link to="/plans">Back to All Plans</Link>
      </nav>
      <h1>{plan.title}</h1>
      <p>{plan.description}</p>
      {isEnrolled ? (
        <p className="enrolled-message">✅ You are enrolled in this plan.</p>
      ) : (
        <button onClick={handleEnroll} disabled={isEnrolling} className="enroll-button">
          {isEnrolling ? 'Enrolling...' : 'Enroll in this Plan'}
        </button>
      )}

      <div className="workout-schedule">
        <h3>Workout Schedule</h3>
        {plan.plan_workouts.map(workout => (
          <div key={workout.id} className="workout-schedule-item">
            <h4>Day {workout.day_of_plan}: {workout.workout_type}</h4>
            <p>Suggested Duration: {workout.suggested_duration} minutes</p>
            <ul className="exercise-list">
              {workout.workout_exercises.map(exerciseDetail => (
                <li key={exerciseDetail.id}>
                  <strong>{exerciseDetail.exercises.name}:</strong>
                  <span>
                    {exerciseDetail.sets} sets of {exerciseDetail.reps} reps
                  </span>
                </li>
              ))}
            </ul>
            <Link to="/workout-session" state={{ workout }} className="button-link">
              Start Workout
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanDetailPage;