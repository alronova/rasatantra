import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Rasatantra</p>
          <h1>Authenticated workspace</h1>
        </div>
        <div className="header-actions">
          <span className="welcome-text">
            Signed in as <strong>{user?.name}</strong>
          </span>
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="app-nav">
        <Link to="/home">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <main className="content-card">
        <Outlet />
      </main>
    </div>
  )
}
