import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaPencilAlt, FaArrowLeft, FaSave } from 'react-icons/fa';

const ManageExercisePage = () => {
  const { id: exerciseId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExerciseDetails = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exercises/${exerciseId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch exercise details');
      const data = await response.json();
      setExercise(data);
      // Pre-fill form
      setName(data.name);
      setDescription(data.description || '');
      setVideoUrl(data.video_url || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [exerciseId, session]);

  useEffect(() => {
    fetchExerciseDetails();
  }, [fetchExerciseDetails]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name, description, video_url: videoUrl }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update exercise');
      }
      navigate('/admin');
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

  if (loading) return <p>Loading exercise...</p>;
  if (error) return <p style={{ color: '#ff6b6b' }}>Error: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1><FaPencilAlt /> Editing: {exercise?.name}</h1>
        <nav><Link to="/admin" className="icon-link"><FaArrowLeft /> <span>Back to Admin Dashboard</span></Link></nav>
      </div>
      <form onSubmit={handleUpdate}>
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
        <button type="submit" disabled={submitting} className="icon-button">
          <FaSave />
          <span>{submitting ? 'Updating...' : 'Update Exercise'}</span>
        </button>
      </form>
    </div>
  );
};

export default ManageExercisePage;