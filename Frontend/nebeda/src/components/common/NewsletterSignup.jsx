import { useState } from 'react'
import Button from '../ui/Button'
import { useToast } from '../ui/toastContext'
import { subscribeNewsletter } from '../../services/newsletterService'
import logEmailWarning from '../../utils/emailDiagnostics'
import { trackNewsletterLead } from '../../utils/analytics'

function NewsletterSignup({ compact = false, source = 'Website' }) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({ email: '', fullName: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const email = formData.email.trim()

    if (!email) {
      setError('Email is required.')
      showToast({ message: 'Please enter your email to join the list.', type: 'error' })
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.')
      showToast({ message: 'Please enter a valid email address.', type: 'error' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await subscribeNewsletter({
        email,
        fullName: formData.fullName.trim(),
        source,
      })
      showToast({
        message: response.message || 'You are subscribed to Nebeda Threads updates.',
        type: 'success',
      })
      logEmailWarning(response, 'Newsletter signup')
      trackNewsletterLead(response)
      setFormData({ email: '', fullName: '' })
    } catch (apiError) {
      showToast({ message: apiError.message || 'Unable to subscribe right now.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className={[
        'rounded-[1.5rem] border border-[rgba(190,151,83,0.38)] bg-[rgba(255,255,255,0.045)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]',
        compact ? 'p-5' : 'p-6 sm:p-8 lg:p-10',
      ].join(' ')}
    >
      <div className={compact ? '' : 'grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end'}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">
            Newsletter
          </p>
          <h2 className={compact ? 'mt-3 font-serif text-2xl text-white' : 'mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl'}>
            Join the Nebeda List
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
            Receive Nebeda Threads updates, new collection alerts, bespoke style inspiration, and
            exclusive offers.
          </p>
        </div>

        <form className={compact ? 'mt-5 space-y-3' : 'mt-7 grid gap-4 sm:grid-cols-[1fr_1fr_auto] lg:mt-0'} onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/32 focus:border-[var(--color-gold)]"
            name="fullName"
            onChange={updateField}
            placeholder="Full name optional"
            value={formData.fullName}
          />
          <div>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/32 focus:border-[var(--color-gold)]"
              name="email"
              onChange={updateField}
              placeholder="Email address"
              type="email"
              value={formData.email}
            />
            {error ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{error}</p> : null}
          </div>
          <Button className={compact ? 'w-full' : 'w-full sm:w-auto'} disabled={isSubmitting} type="submit" variant="primary">
            {isSubmitting ? 'Joining...' : 'Join the List'}
          </Button>
        </form>
      </div>
    </section>
  )
}

export default NewsletterSignup
