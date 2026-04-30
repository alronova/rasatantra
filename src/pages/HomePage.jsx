import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <section>
      <h2>Home</h2>
      <p>
        This is placeholder protected content. If you can see this page, the JWT
        token was accepted and your session is active.
      </p>

      <div className="info-grid">
        <article>
          <h3>User snapshot</h3>
          <p>Name: {user?.name}</p>
          <p>Username: {user?.username}</p>
          <p>Email: {user?.email}</p>
        </article>
        <article>
          <h3>Next step</h3>
          <p>
            You can add more protected routes here and they will stay behind the
            same login gate.
          </p>
        </article>
      </div>
    </section>
  )
}
