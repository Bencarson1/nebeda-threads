import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { loginUser } from '../../services/userAuthService'
import { trackLogin } from '../../utils/analytics'

const initialForm = { email: '', password: '' }

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const redirectTo = new URLSearchParams(location.search).get('redirect') || location.state?.from || '/account'
  const signupLink =
    redirectTo === '/account' ? '/signup' : `/signup?redirect=${encodeURIComponent(redirectTo)}`

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}
    if (!formData.email.trim()) nextErrors.email = 'Email is required.'
    if (!formData.password) nextErrors.password = 'Password is required.'
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)

    try {
      await loginUser({ email: formData.email.trim(), password: formData.password })
      trackLogin()
      showToast({ message: 'Welcome back to Nebeda Threads.', type: 'success' })
      navigate(redirectTo, { replace: true })
    } catch (apiError) {
      showToast({ message: apiError.message || 'Unable to login.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bg-black px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
      <section className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Customer Login
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-6xl">Access Your Account</h1>
          <p className="mt-6 text-base leading-8 text-[var(--color-muted)]">
            Login to track your Nebeda Threads orders and manage your customer details.
          </p>
        </div>

        <form
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.3)] sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
                Email Address
              </span>
              <input
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-[var(--color-gold)]"
                name="email"
                onChange={updateField}
                type="email"
                value={formData.email}
              />
              {errors.email ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{errors.email}</p> : null}
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
                Password
              </span>
              <input
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-[var(--color-gold)]"
                name="password"
                onChange={updateField}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
              />
              {errors.password ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{errors.password}</p> : null}
              <label className="mt-3 flex items-center gap-2 text-sm text-[var(--color-muted)]"><input checked={showPassword} className="accent-[var(--color-gold)]" onChange={(event) => setShowPassword(event.target.checked)} type="checkbox" /> Show password</label>
            </label>
          </div>

          <Button className="mt-7 w-full" disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting ? 'Logging In...' : 'Login'}
          </Button>
          <Link className="mt-5 inline-block text-sm text-[var(--color-gold)] hover:text-white" to="/forgot-password">Forgot password?</Link>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            New to Nebeda?{' '}
            <Link className="text-[var(--color-gold)] transition hover:text-white" to={signupLink}>
              Create an account
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}

export default Login
