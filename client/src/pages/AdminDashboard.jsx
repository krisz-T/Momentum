import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CreateExerciseForm from '../components/CreateExerciseForm';
import CreatePlanForm from '../components/CreatePlanForm';

const AdminDashboard = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans`);
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      // We can set a separate error state for this if needed
      console.error(err.message);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      if (!session) throw new Error('Authentication error');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  }, [session]);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, [fetchUsers]);

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban this user?')) return;

    try {
      if (!session) throw new Error('Authentication error');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}/ban`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to ban user');
      }

      // Refresh the user list to show the updated status
      fetchUsers();

    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnbanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unban this user?')) return;

    try {
      if (!session) throw new Error('Authentication error');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}/unban`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unban user');
      }

      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Manage all users in the system.</p>
      <nav>
        <Link to="/">Back to Home</Link>
      </nav>
      <div className="admin-section">
        <h2>User Management</h2>
        {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.is_banned ? 'Banned' : 'Active'}</td>
                <td>
                  {user.is_banned ? (
                    <button onClick={() => handleUnbanUser(user.id)}>Unban</button>
                  ) : (
                    <button onClick={() => handleBanUser(user.id)}>Ban</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-section">
        <h2>Content Management</h2>
        <div className="admin-forms-container">
          <CreateExerciseForm />
          <div>
            <h3>Existing Plans</h3>
            <div className="manage-plans-list">
              {plans.map(plan => (
                <div key={plan.id} className="manage-plan-item">
                  <span>{plan.title}</span>
                  <Link to={`/admin/plans/${plan.id}`} className="button-link">Manage</Link>
                </div>
              ))}
            </div>
            <CreatePlanForm onPlanCreated={fetchPlans} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
