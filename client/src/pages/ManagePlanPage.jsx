import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ManagePlanPage = () => {
  const { id: planId } = useParams();
  const { session } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for adding a new workout
  const [day, setDay] = useState(1);
  const [type, setType] = useState('');
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlanDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/${planId}`);
      if (!response.ok) throw new Error('Failed to fetch plan details');
      const data = await response.json();
      data.plan_workouts.sort((a, b) => a.day_of_plan - b.day_of_plan);
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/${planId}/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ day_of_plan: day, workout_type: type, suggested_duration: duration }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add workout');
      }
      // Refresh the plan details to show the new workout
      await fetchPlanDetails();
      // Reset form
      setType('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Delete this scheduled workout from the plan?')) return;
    try {
      if (!session) throw new Error('Authentication error');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plan-workouts/${workoutId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workout');
      }
      // Refresh the plan details to show the change
      await fetchPlanDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading plan...</p>;
  if (error) return <p style={{ color: '#ff6b6b' }}>Error: {error}</p>;
  if (!plan) return <p>Plan not found.</p>;

  return (
    <div>
      <nav><Link to="/admin">Back to Admin Dashboard</Link></nav>
      <h1>Managing: {plan.title}</h1>

      <div className="admin-section">
        <h2>Scheduled Workouts</h2>
        {plan.plan_workouts.length > 0 ? (
          <div className="manage-plans-list">
            {plan.plan_workouts.map(w => (
              <div key={w.id} className="manage-plan-item">
                <span>Day {w.day_of_plan}: {w.workout_type}</span>
                <button onClick={() => handleDeleteWorkout(w.id)} className="delete-button-sm">X</button>
                <Link to={`/admin/workouts/${w.id}`} className="button-link">Manage Exercises</Link>
              </div>
            ))}
          </div>
        ) : <p>No workouts scheduled for this plan yet.</p>}
      </div>

      <div className="admin-section">
        <form onSubmit={handleAddWorkout}>
          <h3>Add Workout to Plan</h3>
          <div>
            <label>Day of Plan</label>
            <input type="number" value={day} onChange={e => setDay(e.target.value)} required min="1" />
          </div>
          <div>
            <label>Workout Type / Name</label>
            <input type="text" value={type} onChange={e => setType(e.target.value)} required placeholder="e.g., Upper Body Strength" />
          </div>
          <div>
            <label>Suggested Duration (minutes)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required min="1" />
          </div>
          <button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Workout'}</button>
        </form>
      </div>
    </div>
  );
};

export default ManagePlanPage;