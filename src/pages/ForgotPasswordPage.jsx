import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "./AuthPage.css"

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Recuperar contraseña</h1>

        {error && <p className="auth-card__error">{error}</p>}

        {sent && (
          <p className="auth-card__success">
            Te hemos enviado un email para restablecer tu contraseña. Revisa tu bandeja de entrada.
          </p>
        )}

        {!sent && (
          <>
            <p className="auth-card__description">
              Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form__field">
                <label className="auth-form__label">Email</label>
                <input
                  className="auth-form__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              <button className="auth-form__submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          </>
        )}

        <p className="auth-card__link">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  )
}
