import { Link } from 'react-router-dom';

const MyProfile = ({ userProfile }) => {
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
        <p>No badges earned yet.</p>
      </div>
    </div>
  );
};

export default MyProfile;