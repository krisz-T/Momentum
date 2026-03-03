import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { FaTachometerAlt, FaUser, FaClipboardList, FaSignOutAlt, FaDumbbell } from 'react-icons/fa';

const Header = () => {
  const { session, userProfile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="brand-link">
          <FaDumbbell />
          <span>Momentum</span>
        </Link>
      </div>
      <div className="header-right">
        {userProfile?.role === 'Admin' && (
          <Link to="/admin" className="icon-link">
            <FaTachometerAlt />
            <span>Admin</span>
          </Link>
        )}
        <Link to="/profile" className="icon-link"><FaUser /><span>My Profile</span></Link>
        <Link to="/plans" className="icon-link"><FaClipboardList /><span>Training Plans</span></Link>
        <span>{session.user.email}</span>
        <button onClick={handleLogout} className="icon-button">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;