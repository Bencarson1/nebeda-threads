import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/toastContext'
import { createEnquiry } from '../services/enquiryService'
import logEmailWarning from '../utils/emailDiagnostics'
import { trackLead } from '../utils/analytics'
import { email, instagramUrl, whatsappLink } from '../data/contactDetails'

const contactOptions = [
  {
    title: 'WhatsApp Orders',
    text: 'Speak directly with Nebeda Threads about styles, fabrics, measurements, and delivery.',
    button: 'Chat on WhatsApp',
    href: whatsappLink,
  },
  {
    title: 'Email Enquiries',
    text: 'Send us your questions about orders, collaborations, and customer support.',
    button: 'Send Email',
    href: `mailto:${email}`,
  },
  {
    title: 'Instagram',
    text: 'Follow our latest designs, behind the scenes, and customer style inspiration.',
    button: 'View Instagram',
    href: instagramUrl,
  },
]

const enquiryTypes = [
  'Custom Order',
  'Ready to Wear',
  'Delivery',
  'Styling Consultation',
  'General Enquiry',
]

const deliveryRegions = ['United Kingdom', 'Nigeria', 'Worldwide Delivery']

const initialFormState = {
  fullName: '',
  email: '',
  whatsappNumber: '',
  enquiryType: 'Custom Order',
  message: '',
}

const fieldLabels = {
  fullName: 'Full Name',
  email: 'Email Address',
  enquiryType: 'Enquiry Type',
  message: 'Message',
}

function ContactOptionCard({ option, index }) {
  return (
    <motion.article
      className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.045)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:border-[rgba(190,151,83,0.62)] hover:bg-[rgba(243,234,217,0.08)] sm:p-7"
      initial={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.65, ease: 'easeOut', delay: index * 0.07 }}
      viewport={{ once: true, amount: 0.25 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="mb-7 h-px w-16 bg-[var(--color-gold)]" />
      <h3 className="font-serif text-2xl leading-tight text-white sm:text-3xl">{option.title}</h3>
      <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{option.text}</p>
      <Button
        className="mt-7 px-5 py-2.5 text-xs"
        href={option.href}
        rel="noreferrer"
        target={option.href.startsWith('http') ? '_blank' : undefined}
        variant="outline"
      >
        {option.button}
      </Button>
    </motion.article>
  )
}

function Field({ children, error, label }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
        {label}
      </span>
      {children}
      {error ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{error}</p> : null}
    </label>
  )
}

function Contact() {
  const { showToast } = useToast()
  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const validateForm = () => {
    const nextErrors = {}

    ;['fullName', 'email', 'enquiryType', 'message'].forEach((field) => {
      if (!formData[field].trim()) {
        nextErrors[field] = `${fieldLabels[field]} is required.`
      }
    })

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    setErrors(nextErrors)
    const isValid = Object.keys(nextErrors).length === 0

    if (!isValid) {
      showToast({ message: 'Please complete the required enquiry fields.', type: 'error' })
    }

    return isValid
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const response = await createEnquiry({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        enquiryType: formData.enquiryType,
        message: formData.message.trim(),
      })
      setSuccessMessage('Nebeda Threads will contact you soon.')
      showToast({ message: 'Thank you. Your enquiry has been received.', type: 'success' })
      logEmailWarning(response, 'Contact enquiry')
      trackLead('contact')
      setFormData(initialFormState)
      setErrors({})
    } catch (apiError) {
      const message = apiError.message || 'Unable to send your enquiry. Please try again.'
      setErrorMessage(message)
      showToast({ message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="overflow-hidden bg-black text-white">
      <section className="relative px-5 py-20 sm:px-8 md:py-24 lg:px-10 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(190,151,83,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_34%)]" />
        <motion.div
          className="relative mx-auto max-w-7xl 2xl:max-w-[1500px]"
          initial={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-7 h-px w-20 bg-[var(--color-gold)]" />
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--color-gold)]">
            CONTACT NEBEDA
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-[var(--color-soft-white)] sm:text-6xl lg:text-7xl">
            Let&rsquo;s Create Something Elegant
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-[var(--color-muted)] sm:text-lg">
            Have a question, custom order request, or styling enquiry? Nebeda Threads is here to
            help you start your fashion journey with confidence.
          </p>
        </motion.div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3 2xl:max-w-[1500px]">
          {contactOptions.map((option, index) => (
            <ContactOptionCard index={index} key={option.title} option={option} />
          ))}
        </div>
      </section>

      <section className="relative px-5 py-20 sm:px-8 md:py-24 lg:px-10 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(190,151,83,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14 2xl:max-w-[1500px]">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.3 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--color-gold)]">
              Enquiry Form
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-white sm:text-5xl">
              Tell Us What You Need
            </h2>
            <p className="mt-6 text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              Share your details, preferred service, and message. Nebeda Threads will review your
              enquiry and respond with clear next steps.
            </p>
          </motion.div>

          <motion.form
            className="rounded-[1.75rem] border border-white/10 bg-[rgba(255,255,255,0.045)] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-8"
            initial={{ opacity: 0, y: 28 }}
            onSubmit={handleSubmit}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.25 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field error={errors.fullName} label="Full Name">
                <input
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/32 focus:border-[var(--color-gold)]"
                  name="fullName"
                  onChange={updateField}
                  placeholder="Your full name"
                  required
                  type="text"
                  value={formData.fullName}
                />
              </Field>
              <Field error={errors.email} label="Email Address">
                <input
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/32 focus:border-[var(--color-gold)]"
                  name="email"
                  onChange={updateField}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={formData.email}
                />
              </Field>
              <Field label="WhatsApp Number">
                <input
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/32 focus:border-[var(--color-gold)]"
                  name="whatsappNumber"
                  onChange={updateField}
                  placeholder="+44..."
                  type="tel"
                  value={formData.whatsappNumber}
                />
              </Field>
              <Field error={errors.enquiryType} label="Enquiry Type">
                <select
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[var(--color-gold)]"
                  name="enquiryType"
                  onChange={updateField}
                  value={formData.enquiryType}
                >
                  {enquiryTypes.map((type) => (
                    <option className="bg-black text-white" key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-5">
              <Field error={errors.message} label="Message">
                <textarea
                  className="mt-3 min-h-40 w-full resize-y rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/32 focus:border-[var(--color-gold)]"
                  name="message"
                  onChange={updateField}
                  placeholder="Tell us about your enquiry, fabric, style, size, occasion, or delivery question."
                  required
                  value={formData.message}
                />
              </Field>
            </div>

            {successMessage ? (
              <motion.div
                className="mt-5 rounded-2xl border border-[rgba(190,151,83,0.38)] bg-[rgba(190,151,83,0.1)] px-5 py-4 text-sm leading-6 text-[var(--color-cream)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-serif text-2xl text-white">Thank you. Your enquiry has been received.</p>
                <p className="mt-2">{successMessage}</p>
              </motion.div>
            ) : null}

            {errorMessage ? (
              <motion.p
                className="mt-5 rounded-2xl border border-[rgba(190,151,83,0.38)] bg-[rgba(190,151,83,0.1)] px-5 py-4 text-sm leading-6 text-[var(--color-cream)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errorMessage}
              </motion.p>
            ) : null}

            <Button
              className="mt-7 w-full sm:w-auto"
              disabled={isSubmitting}
              type="submit"
              variant="primary"
            >
              {isSubmitting ? 'Sending Message...' : 'Send Message'}
            </Button>
          </motion.form>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl 2xl:max-w-[1500px]">
          <motion.div
            className="mb-10 max-w-3xl"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.35 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--color-gold)]">
              Location & Delivery
            </p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-white sm:text-5xl">
              UK Based. Worldwide Delivery.
            </h2>
            <p className="mt-6 text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              Nebeda Threads is based in the United Kingdom and serves customers across the UK,
              Nigeria, and worldwide.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-3">
            {deliveryRegions.map((region, index) => (
              <motion.div
                className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.24)] transition duration-500 hover:border-[rgba(190,151,83,0.55)] hover:bg-[rgba(243,234,217,0.07)]"
                initial={{ opacity: 0, y: 22 }}
                key={region}
                transition={{ duration: 0.65, ease: 'easeOut', delay: index * 0.06 }}
                viewport={{ once: true, amount: 0.25 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-gold)]">
                  0{index + 1}
                </p>
                <p className="mt-5 text-lg font-medium text-white">{region}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <motion.div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-[rgba(190,151,83,0.38)] bg-[linear-gradient(135deg,rgba(243,234,217,0.1),rgba(255,255,255,0.035))] px-6 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.34)] sm:px-10 lg:px-14 2xl:max-w-[1500px]"
          initial={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.35 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(190,151,83,0.18),transparent_30%)]" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
              Bespoke Service
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
              Ready to Start Your Custom Order?
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              Tell us your style, fabric choice, measurements, and occasion. We will guide you
              through the process.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button to="/custom-order" variant="primary">
                Start Custom Order
              </Button>
              <Button to="/shop" variant="outline">
                Shop Collection
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}

export default Contact
