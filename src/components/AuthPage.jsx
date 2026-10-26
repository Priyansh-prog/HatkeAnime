import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const AuthPage = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isLogin = mode === 'login'

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/home')
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>{isLogin ? 'Log in' : 'Sign up'}</h1>
        <p className="login-sub">
          {isLogin ? 'Welcome back to H-Anime.' : 'Join H-Anime and start building your watchlist.'}
        </p>

        <label className="login-field">
          Email
          <input
            className="login-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="login-field">
          Password
          <input
            className="login-input"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className="login-submit" type="submit">
          {isLogin ? 'Log in' : 'Sign up'}
        </button>

        <p className="login-sub">
          {isLogin ? 'New here? ' : 'Already have an account? '}
          <button
            type="button"
            className="login-link"
            onClick={() => setMode(isLogin ? 'signup' : 'login')}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>

        <Link className="view-all-btn" to="/home">
          ← Back to browse
        </Link>
      </form>
    </main>
  )
}

export default AuthPage
