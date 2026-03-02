import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CreateExerciseForm from '../components/CreateExerciseForm';
import CreatePlanForm from '../components/CreatePlanForm';
import Modal from '../components/Modal';

const AdminDashboard = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState(null);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

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

  const fetchExercises = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exercises`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch exercises');
      const data = await response.json();
      setExercises(data);
    } catch (err) {
      console.error(err.message);
    }
  }, [session]);

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
    fetchExercises();
  }, [fetchUsers, fetchPlans, fetchExercises]);

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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('PERMANENTLY DELETE this user and all their data? This cannot be undone.')) return;
    try {
      if (!session) throw new Error('Authentication error');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('PERMANENTLY DELETE this plan and all its scheduled workouts?')) return;
    try {
      if (!session) throw new Error('Authentication error');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete plan');
      }
      fetchPlans(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!window.confirm('PERMANENTLY DELETE this exercise from the library? This may fail if it is currently in use.')) return;
    try {
      if (!session) throw new Error('Authentication error');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/exercises/${exerciseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete exercise');
      }
      fetchExercises(); // Refresh list
    } catch (err) {
      // Display API-provided error message (e.g., "Cannot delete because it is in use")
      alert(err.message);
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <nav><Link to="/">Back to Home</Link></nav>
      </div>
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
                  <button onClick={() => handleDeleteUser(user.id)} className="delete-button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-section">
        <h2>Content Management</h2>
        <div className="admin-forms-container">
          <div>
            <h3>Existing Exercises</h3>
            <button onClick={() => setIsExerciseModalOpen(true)}>Create New Exercise</button>
            <div className="manage-plans-list">
              {exercises.map(ex => (
                <div key={ex.id} className="manage-plan-item">
                  <span>{ex.name}</span>
                  <button onClick={() => handleDeleteExercise(ex.id)} className="delete-button-sm">X</button>
                  <Link to={`/admin/exercises/${ex.id}`} className="button-link">Manage</Link>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Existing Plans</h3>
            <button onClick={() => setIsPlanModalOpen(true)}>Create New Plan</button>
            <div className="manage-plans-list">
              {plans.map(plan => (
                <div key={plan.id} className="manage-plan-item">
                  <span>{plan.title}</span>
                  <button onClick={() => handleDeletePlan(plan.id)} className="delete-button-sm">X</button>
                  <Link to={`/admin/plans/${plan.id}`} className="button-link">Manage</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isExerciseModalOpen} onClose={() => setIsExerciseModalOpen(false)} title="Create New Exercise">
        <CreateExerciseForm onExerciseCreated={() => {
          fetchExercises();
          setIsExerciseModalOpen(false);
        }} />
      </Modal>

      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Create New Training Plan">
        <CreatePlanForm onPlanCreated={() => {
          fetchPlans();
          setIsPlanModalOpen(false);
        }} />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
