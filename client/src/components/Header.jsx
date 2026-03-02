import { Link } from 'react-router-dom';

const Header = ({ session, userProfile, onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/">Momentum</Link>
      </div>
      <div className="header-right">
        {userProfile?.role === 'Admin' && (
          <Link to="/admin">Admin Dashboard</Link>
        )}
        <Link to="/profile">My Profile</Link>
        <span>{session.user.email}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;