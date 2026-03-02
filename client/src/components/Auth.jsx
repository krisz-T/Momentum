import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [view, setView] = useState('signIn') // 'signIn', 'signUp', or 'forgotPassword'
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    let response;
    switch (view) {
      case 'signIn':
        response = await supabase.auth.signInWithPassword({ email, password });
        break;
      case 'signUp':
        response = await supabase.auth.signUp({ email, password });
        break;
      case 'forgotPassword':
        response = await supabase.auth.resetPasswordForEmail(email, {
          // This is the URL the user will be redirected to after clicking the link
          // in the password reset email. For now, it's just our app's home.
          redirectTo: window.location.origin,
        });
        if (!response.error) {
          setMessage('Password reset link sent! Check your email.');
        }
        break;
      default:
        break;
    }

    if (response && response.error) {
      setError(response.error.message)
    }

    setLoading(false)
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit}>
        <h1>
          {view === 'signIn' && 'Sign In'}
          {view === 'signUp' && 'Create Account'}
          {view === 'forgotPassword' && 'Reset Password'}
        </h1>
        <p>
          {view === 'signIn' && 'Sign in to track your progress'}
          {view === 'signUp' && 'Get started on your fitness journey'}
          {view === 'forgotPassword' && 'Enter your email to receive a reset link.'}
        </p>
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        {message && <p style={{ color: '#a5d6a7' }}>{message}</p>}
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {view !== 'forgotPassword' && (
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}
        <button type="submit" disabled={loading}>
          {loading && 'Processing...'}
          {!loading && view === 'signIn' && 'Sign In'}
          {!loading && view === 'signUp' && 'Sign Up'}
          {!loading && view === 'forgotPassword' && 'Send Reset Link'}
        </button>
      </form>
      {view === 'signIn' && (
        <div className="auth-toggle">
          <p>
            Don't have an account?{' '}
            <button onClick={() => setView('signUp')}>Sign Up</button>
          </p>
          <p>
            <button onClick={() => setView('forgotPassword')}>Forgot Password?</button>
          </p>
        </div>
      )}
      {view !== 'signIn' && (
        <p className="auth-toggle">
          Already have an account?{' '}
          <button onClick={() => setView('signIn')}>Sign In</button>
        </p>
      )}
    </div>
  )
}