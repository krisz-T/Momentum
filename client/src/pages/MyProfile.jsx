import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const MyProfile = () => {
  const { userProfile, session, fetchProfile } = useAuth();
  const [badges, setBadges] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for editing username
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [updateError, setUpdateError] = useState(null);


  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session) return;
      setLoading(true);

      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      try {
        const [badgesRes, enrollmentsRes, workoutsRes] = await Promise.all([
          fetch(`${baseUrl}/api/profile/badges`, { headers }),
          fetch(`${baseUrl}/api/profile/enrollments`, { headers }),
          fetch(`${baseUrl}/api/profile/workouts`, { headers }),
        ]);

        const badgesData = await badgesRes.json();
        const enrollmentsData = await enrollmentsRes.json();
        const workoutsData = await workoutsRes.json();

        setBadges(badgesData);
        setEnrollments(enrollmentsData);
        setWorkouts(workoutsData);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [session]);

  useEffect(() => {
    if (userProfile) {
      setNewName(userProfile.name);
    }
  }, [userProfile]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setUpdateError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update name');
      }
      // Refresh the profile in the global context
      await fetchProfile(session);
      setIsEditing(false);
    } catch (err) {
      setUpdateError(err.message);
    }
  };

  if (!userProfile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <nav><Link to="/">Back to Home</Link></nav>
      </div>

      <div className="profile-details">
        {isEditing ? (
          <form onSubmit={handleUpdateName} className="inline-form">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            {updateError && <p style={{ color: '#ff6b6b' }}>{updateError}</p>}
          </form>
        ) : (
          <div className="profile-header">
            <h2>{userProfile.name}</h2>
            <button onClick={() => setIsEditing(true)}>Edit Name</button>
          </div>
        )}
        <p>Role: {userProfile.role}</p>
        <h3>Total XP: {userProfile.total_xp}</h3>
      </div>

      <div className="admin-section">
        <h3>My Active Plans</h3>
        {loading ? (
          <p>Loading plans...</p>
        ) : enrollments.length > 0 ? (
          <div className="plans-list">
            {enrollments.map(enrollment => (
              <div key={enrollment.id} className="plan-card">
                <h2>{enrollment.training_plans.title}</h2>
                <Link to={`/plans/${enrollment.plan_id}`} className="button-link">Continue Plan</Link>
              </div>
            ))}
          </div>
        ) : <p>You are not enrolled in any active plans.</p>}
      </div>

      <div className="admin-section">
        <h3>Recent Workouts</h3>
        {loading ? (
          <p>Loading history...</p>
        ) : workouts.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map(w => (
                <tr key={w.id}>
                  <td>{new Date(w.date_logged).toLocaleDateString()}</td>
                  <td>{w.type}</td>
                  <td>{Math.floor(w.duration / 60)} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p>No workouts logged yet.</p>}
      </div>

      <div className="badges-section">
        <h3>My Badges</h3>
        {loading ? (
          <p>Loading badges...</p>
        ) : badges.length > 0 ? (
          <ul className="badge-list">
            {badges.map((badge) => (
              <li key={badge.badge_name} className="badge">{badge.badge_name}</li>
            ))}
          </ul>
        ) : (
          <p>No badges earned yet. Keep going!</p>
        )}
      </div>
    </div>
  );
};

export default MyProfile;