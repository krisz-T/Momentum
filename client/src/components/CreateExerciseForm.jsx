import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateExerciseForm = ({ onExerciseCreated }) => {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name, description, video_url: videoUrl }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create exercise');
      }
      setName('');
      setDescription('');
      setVideoUrl('');
      if (onExerciseCreated) onExerciseCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUrlChange = (e) => {
    let value = e.target.value;
    // If user pastes a full iframe tag, try to extract the src URL
    if (value.trim().startsWith('<iframe')) {
      const match = value.match(/src="([^"]+)"/);
      if (match && match[1]) {
        value = match[1];
      }
    }
    setVideoUrl(value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create New Exercise</h3>
      {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
      <div>
        <label>Exercise Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label>YouTube Embed URL</label>
        <input type="text" value={videoUrl} onChange={handleUrlChange} placeholder="Paste the URL from the 'src' attribute" />
      </div>
      <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Exercise'}</button>
    </form>
  );
};

export default CreateExerciseForm;