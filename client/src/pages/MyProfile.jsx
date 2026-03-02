import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const MyProfile = () => {
  const { userProfile, session } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  useEffect(() => {
    // Fetch badges only when the user profile is available
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
  }, [userProfile, session]);

  if (!userProfile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div>
      <h1>My Profile</h1>
      <nav>
        <Link to="/">Back to Home</Link>
      </nav>

      <div className="profile-details">
        <h2>{userProfile.name}</h2>
        <p>Role: {userProfile.role}</p>
        <h3>Total XP: {userProfile.total_xp}</h3>
      </div>

      {/* This is where we will display badges later */}
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