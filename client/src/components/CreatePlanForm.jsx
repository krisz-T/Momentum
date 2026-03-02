import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreatePlanForm = ({ onPlanCreated }) => {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, description, duration_weeks: Number(durationWeeks) }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create plan');
      }
      alert('Plan created successfully!');
      setTitle('');
      setDescription('');
      setDurationWeeks(4);
      if (onPlanCreated) onPlanCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create New Training Plan</h3>
      {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
      <div>
        <label>Plan Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label>Duration (weeks)</label>
        <input type="number" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} required min="1" />
      </div>
      <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Plan'}</button>
    </form>
  );
};

export default CreatePlanForm;