import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { subscribeNewsletter } from '../../services/newsletterService'
import { signupUser } from '../../services/userAuthService'
import logEmailWarning from '../../utils/emailDiagnostics'
import { trackNewsletterLead, trackSignUp } from '../../utils/analytics'

const initialForm = {
  fullName: '',
  email: '',
  whatsappNumber: '',
  password: '',
  confirmPassword: '',
}

function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const redirectTo = new URLSearchParams(location.search).get('redirect') || location.state?.from || '/account'
  const loginLink =
    redirectTo === '/account' ? '/login' : `/login?redirect=${encodeURIComponent(redirectTo)}`

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}
    if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!formData.email.trim()) nextErrors.email = 'Email is required.'
    if (!formData.password) nextErrors.password = 'Password is required.'
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }
    if (formData.password && formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords must match.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)

    try {
      const signupResponse = await signupUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        password: formData.password,
      })

      if (newsletterOptIn) {
        subscribeNewsletter({
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          source: 'Signup',
        })
          .then((response) => {
            logEmailWarning(response, 'Signup newsletter subscription')
            trackNewsletterLead(response)
          })
          .catch(() => {
            showToast({
              message: 'Account created. Newsletter signup could not be completed right now.',
              type: 'info',
            })
          })
      }

      trackSignUp()
      showToast({ message: 'Account created. Please check your email to verify your address.', type: 'success' })
      logEmailWarning(signupResponse, 'Customer signup')
      navigate(redirectTo, { replace: true })
    } catch (apiError) {
      showToast({ message: apiError.message || 'Unable to create account.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bg-black px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
      <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Customer Signup
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-6xl">Create Your Account</h1>
          <p className="mt-6 text-base leading-8 text-[var(--color-muted)]">
            Join Nebeda Threads to track orders, checkout faster, and stay connected with your
            custom requests.
          </p>
        </div>

        <form
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.3)] sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ['fullName', 'Full Name', 'text'],
              ['email', 'Email Address', 'email'],
              ['whatsappNumber', 'WhatsApp Number', 'tel'],
              ['password', 'Password', 'password'],
              ['confirmPassword', 'Confirm Password', 'password'],
            ].map(([name, label, type]) => (
              <label className={name === 'confirmPassword' ? 'block sm:col-span-2' : 'block'} key={name}>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
                  {label}
                </span>
                <input
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-[var(--color-gold)]"
                  name={name}
                  onChange={updateField}
                  type={type === 'password' && showPasswords ? 'text' : type}
                  value={formData[name]}
                />
                {errors[name] ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{errors[name]}</p> : null}
              </label>
            ))}
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm text-[var(--color-muted)]"><input checked={showPasswords} className="size-4 accent-[var(--color-gold)]" onChange={(event) => setShowPasswords(event.target.checked)} type="checkbox" /> Show passwords</label>
          <label className="mt-6 flex items-start gap-3 text-sm leading-7 text-[var(--color-muted)]">
            <input
              checked={newsletterOptIn}
              className="mt-1 size-4 accent-[var(--color-gold)]"
              onChange={(event) => setNewsletterOptIn(event.target.checked)}
              type="checkbox"
            />
            <span>Send me Nebeda Threads updates and new collection alerts.</span>
          </label>
          <Button className="mt-7 w-full" disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
          <p className="mt-5 text-sm text-[var(--color-muted)]">
            Already have an account?{' '}
            <Link className="text-[var(--color-gold)] transition hover:text-white" to={loginLink}>
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}

export default Signup
