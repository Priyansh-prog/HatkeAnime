import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/home')
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Log in</h1>
        <p className="login-sub">Welcome back to H-Anime.</p>

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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button className="login-submit" type="submit">
          Log in
        </button>

        <Link className="view-all-btn" to="/home">
          ← Back to browse
        </Link>
      </form>
    </main>
  )
}

export default LoginPage
