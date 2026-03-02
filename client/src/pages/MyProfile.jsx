import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const MyProfile = () => {
  const { userProfile, session } = useAuth();
  const [badges, setBadges] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  useEffect(() => {
    // Fetch badges and enrollments only when the user profile is available
    if (userProfile && session) {
      const fetchBadges = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/badges`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          const data = await response.json();
          setBadges(data);
        } catch (error) {
          console.error('Failed to fetch badges:', error);
        } finally {
          setLoadingBadges(false);
        }
      };
      fetchBadges();
    }

    if (session) {
      const fetchEnrollments = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/enrollments`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          const data = await response.json();
          setEnrollments(data);
        } catch (error) {
          console.error('Failed to fetch enrollments:', error);
        } finally {
          setLoadingEnrollments(false);
        }
      };
      fetchEnrollments();
    }

    if (session) {
      const fetchWorkouts = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/workouts`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          const data = await response.json();
          setWorkouts(data);
        } catch (error) {
          console.error('Failed to fetch workout history:', error);
        } finally {
          setLoadingWorkouts(false);
        }
      };
      fetchWorkouts();
    }
  }, [userProfile, session]);

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
        <h2>{userProfile.name}</h2>
        <p>Role: {userProfile.role}</p>
        <h3>Total XP: {userProfile.total_xp}</h3>
      </div>

      <div className="admin-section">
        <h3>My Active Plans</h3>
        {loadingEnrollments ? (
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
        {loadingWorkouts ? (
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
        {loadingBadges ? (
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