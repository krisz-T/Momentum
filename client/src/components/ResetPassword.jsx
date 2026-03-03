import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FaKey, FaSave } from 'react-icons/fa';

export default function ResetPassword({ onPasswordUpdated }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully! You can now use your new password.');
      // Notify the parent to switch back to the main app view after a delay
      setTimeout(() => {
        onPasswordUpdated();
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleResetPassword}>
        <h1><FaKey /> Choose a New Password</h1>
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        {message && <p style={{ color: '#a5d6a7' }}>{message}</p>}
        <div>
          <label htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your new password"
          />
        </div>
        <button type="submit" disabled={loading} className="icon-button">
          <FaSave />
          <span>{loading ? 'Updating...' : 'Update Password'}</span>
        </button>
      </form>
    </div>
  );
}