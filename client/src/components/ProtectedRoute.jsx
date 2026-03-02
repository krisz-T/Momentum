import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { userProfile } = useAuth();

  // First, wait for the user profile to be loaded
  if (userProfile === null) {
    return <div>Loading user permissions...</div>; // Or a loading spinner
  }

  // If the user is not an admin, redirect them to the home page
  if (userProfile.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  // If the user is an admin, render the requested component
  return children;
};

export default ProtectedRoute;