import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import CreateExerciseForm from '../components/CreateExerciseForm';

const ManageWorkoutPage = () => {
  const { id: workoutId } = useParams();
  const { session } = useAuth();

  const [workout, setWorkout] = useState(null);
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [selectedExercise, setSelectedExercise] = useState('');
  const [unit, setUnit] = useState('reps'); // 'reps' or 'time'
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8-12');
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchWorkoutDetails = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plan-workouts/${workoutId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch workout details');
      const data = await response.json();
      setWorkout(data);
    } catch (err) {
      setError(err.message);
    }
  }, [workoutId, session]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!session) return;
      setLoading(true);
      await fetchWorkoutDetails();
      try {
        const exercisesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exercises`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        const exercisesData = await exercisesResponse.json();
        setAllExercises(exercisesData);
        if (exercisesData.length > 0) {
          setSelectedExercise(exercisesData[0].id);
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [session, fetchWorkoutDetails]);

  const handleAddExercise = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        exercise_id: selectedExercise,
        sets,
        ...(unit === 'reps' ? { reps } : { duration_seconds: duration }),
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plan-workouts/${workoutId}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add exercise');
      }
      await fetchWorkoutDetails(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: '#ff6b6b' }}>Error: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Managing: {workout?.workout_type}</h1>
        <nav><Link to={`/admin/plans/${workout?.plan_id}`}>Back to Plan</Link></nav>
      </div>

      <div className="admin-section">
        <h2>Assigned Exercises</h2>
        {workout?.workout_exercises.length > 0 ? (
          <ul>
            {workout.workout_exercises.map(we => <li key={we.id}>{we.exercises.name} ({we.sets}x{we.reps || `${we.duration_seconds}s`})</li>)}
          </ul>
        ) : <p>No exercises assigned yet.</p>}
      </div>

      <div className="admin-section">
        <form onSubmit={handleAddExercise}>
          <h3>Assign Exercise to Workout</h3>
          <div>
            <label>Exercise</label>
            <div className="form-group-inline">
              <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}>
                {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
              <button type="button" onClick={() => setIsCreateModalOpen(true)}>Create New</button>
            </div>
          </div>
          <div>
            <label>Unit</label>
            <div className="radio-group">
              <label><input type="radio" value="reps" checked={unit === 'reps'} onChange={() => setUnit('reps')} /> Reps</label>
              <label><input type="radio" value="time" checked={unit === 'time'} onChange={() => setUnit('time')} /> Time</label>
            </div>
          </div>
          <div>
            <label>Sets</label>
            <input type="number" value={sets} onChange={e => setSets(e.target.value)} required min="1" />
          </div>
          {unit === 'reps' ? (
            <div>
              <label>Reps</label>
              <input type="text" value={reps} onChange={e => setReps(e.target.value)} required placeholder="e.g., 8-12" />
            </div>
          ) : (
            <div>
              <label>Duration (seconds)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required min="1" />
            </div>
          )}
          <button type="submit" disabled={submitting}>{submitting ? 'Assigning...' : 'Assign Exercise'}</button>
        </form>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Exercise">
        <CreateExerciseForm onExerciseCreated={async () => {
          const exercises = await fetchAllExercises();
          if (exercises && exercises.length > 0) {
            setSelectedExercise(exercises[exercises.length - 1].id); // Select the newly created exercise
          }
          setIsCreateModalOpen(false);
        }} />
      </Modal>
    </div>
  );
};

export default ManageWorkoutPage;