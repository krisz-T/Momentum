import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const Header = () => {
  const { session, userProfile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/">Momentum</Link>
      </div>
      <div className="header-right">
        {userProfile?.role === 'Admin' && <Link to="/admin">Admin Dashboard</Link>}
        <Link to="/profile">My Profile</Link>
        <Link to="/plans">Training Plans</Link>
        <span>{session.user.email}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;