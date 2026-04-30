import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const initialRegisterState = {
  email: '',
  password: '',
  username: '',
  name: '',
}

const initialLoginState = {
  email: '',
  password: '',
}

export default function AuthPage({ mode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, register } = useAuth()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registerForm, setRegisterForm] = useState(initialRegisterState)
  const [loginForm, setLoginForm] = useState(initialLoginState)

  const destination = location.state?.from?.pathname || '/home'

  if (isAuthenticated) {
    return <Navigate to={destination} replace />
  }

  const handleChange = (event, setForm) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'register') {
        await register(registerForm)
      } else {
        await login(loginForm)
      }

      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isRegisterMode = mode === 'register'

  return (
    <div className="page-shell auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Rasatantra</p>
        <h1>{isRegisterMode ? 'Create account' : 'Login'}</h1>
        <p className="muted-text">
          {isRegisterMode
            ? 'Register with your name, username, email, and password.'
            : 'Login with your email and password to access protected pages.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegisterMode ? (
            <>
              <label>
                Name
                <input
                  name="name"
                  type="text"
                  value={registerForm.name}
                  onChange={(event) => handleChange(event, setRegisterForm)}
                  placeholder="Jane Doe"
                  required
                />
              </label>
              <label>
                Username
                <input
                  name="username"
                  type="text"
                  value={registerForm.username}
                  onChange={(event) => handleChange(event, setRegisterForm)}
                  placeholder="janedoe"
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => handleChange(event, setRegisterForm)}
                  placeholder="jane@example.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => handleChange(event, setRegisterForm)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => handleChange(event, setLoginForm)}
                  placeholder="jane@example.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => handleChange(event, setLoginForm)}
                  placeholder="Your password"
                  required
                />
              </label>
            </>
          )}

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting
              ? 'Please wait...'
              : isRegisterMode
                ? 'Register'
                : 'Login'}
          </button>
        </form>

        <p className="switch-text">
          {isRegisterMode ? 'Already have an account?' : 'Need an account?'}{' '}
          <Link to={isRegisterMode ? '/login' : '/register'}>
            {isRegisterMode ? 'Login' : 'Register'}
          </Link>
        </p>
      </div>
    </div>
  )
}
