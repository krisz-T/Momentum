import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { FaArrowLeft, FaPencilAlt, FaClipboardList, FaTrash, FaPlus, FaPlusCircle, FaDumbbell } from 'react-icons/fa';
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

  const fetchAllExercises = useCallback(async () => {
    if (!session) return [];
    try {
      const exercisesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exercises`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const exercisesData = await exercisesResponse.json();
      setAllExercises(exercisesData);
      return exercisesData;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [session]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const [_, exercisesData] = await Promise.all([fetchWorkoutDetails(), fetchAllExercises()]);
      if (exercisesData && exercisesData.length > 0) {
        setSelectedExercise(exercisesData[0].id);
      }
      setLoading(false);
    };
    if (session) fetchInitialData();
  }, [session, fetchWorkoutDetails, fetchAllExercises]);

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

  const handleRemoveExercise = async (workoutExerciseId) => {
    if (!window.confirm('Remove this exercise from the workout?')) return;
    try {
      if (!session) throw new Error('Authentication error');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/workout-exercises/${workoutExerciseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove exercise');
      }
      // Refresh the list of assigned exercises
      await fetchWorkoutDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: '#ff6b6b' }}>Error: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1><FaPencilAlt /> Managing: {workout?.workout_type}</h1>
        <nav><Link to={`/admin/plans/${workout?.plan_id}`} className="icon-link"><FaArrowLeft /> <span>Back to Plan</span></Link></nav>
      </div>

      <div className="admin-section">
        <h2><FaClipboardList /> Assigned Exercises</h2>
        {workout?.workout_exercises.length > 0 ? (
          <div className="manage-plans-list">
            {workout.workout_exercises.map(we => (
              <div key={we.id} className="manage-plan-item">
                <span>{we.exercises.name} ({we.sets}x{we.reps || `${we.duration_seconds}s`})</span>
                <button onClick={() => handleRemoveExercise(we.id)} className="delete-button-sm icon-button"><FaTrash /></button>
              </div>
            ))}
          </div>
        ) : <p>No exercises assigned yet.</p>}
      </div>

      <div className="admin-section">
        <form onSubmit={handleAddExercise}>
          <div className="content-manage-header form-header">
            <h3>Assign Exercise to Workout</h3>
            <button type="submit" disabled={submitting} className="icon-button"><FaPlusCircle /> <span>{submitting ? 'Assigning...' : 'Assign Exercise'}</span></button>
          </div>
          <div>
            <label>Exercise</label>
            <div className="form-group-inline">
              <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}>
                {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
              <button type="button" onClick={() => setIsCreateModalOpen(true)} className="icon-button"><FaPlus /> <span>Create New</span></button>
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
        </form>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Exercise" icon={FaDumbbell}>
        <CreateExerciseForm onExerciseCreated={async (newExercise) => {
          await fetchAllExercises();
          if (newExercise) {
            setSelectedExercise(newExercise.id); // Auto-select the newly created exercise
          }
          setIsCreateModalOpen(false);
        }} />
      </Modal>
    </div>
  );
};

export default ManageWorkoutPage;