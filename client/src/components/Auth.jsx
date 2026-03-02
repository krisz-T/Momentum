import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit}>
        <h1>{isLogin ? 'Momentum Login' : 'Create Account'}</h1>
        <p>{isLogin ? 'Sign in to track your progress' : 'Get started on your fitness journey'}</p>
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
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
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
      </form>
      <p className="auth-toggle">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </div>
  )
}