import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>This is a protected area for administrators.</p>
      <nav>
        <Link to="/">Back to Home</Link>
      </nav>
    </div>
  );
};

export default AdminDashboard;
