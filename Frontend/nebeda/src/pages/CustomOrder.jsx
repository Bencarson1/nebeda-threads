import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/toastContext'
import { createCustomOrder } from '../services/customOrderService'
import logEmailWarning from '../utils/emailDiagnostics'
import { trackLead } from '../utils/analytics'
import { getWhatsAppMessageLink } from '../data/contactDetails'
import { isUserAuthenticated } from '../services/userAuthService'
import { measurementProfiles } from '../data/measurementProfiles'

const processSteps = [
  {
    number: '01',
    title: 'Share Your Style',
    text: 'Tell us the outfit type, fabric, and occasion.',
  },
  {
    number: '02',
    title: 'Submit Measurements',
    text: 'Provide your size details or request measurement guidance.',
  },
  {
    number: '03',
    title: 'Confirm Design',
    text: 'Nebeda Threads reviews your request and confirms details.',
  },
  {
    number: '04',
    title: 'Secure Payment',
    text: 'Proceed with payment once your order details are agreed.',
  },
]

const selectOptions = {
  outfitType: [
    'Senator Wear',
    'Agbada',
    'Kaftan',
    'Two Pieces',
    'Bubu',
    'Ankara Dress',
    'Aso Oke',
    'Wedding Outfit',
    'Other',
  ],
  orderType: ['Ready to Wear', 'Bespoke', 'Wedding'],
  fabricPreference: ['Ankara', 'Aso Oke', 'Lace', 'Senator Fabric', 'Plain Fabric', 'I need guidance'],
  occasion: ['Wedding', 'Birthday', 'Church', 'Engagement', 'Graduation', 'Casual Luxury', 'Other'],
}


const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const maxInspirationImages = 3
const maxImageSize = 5 * 1024 * 1024
const whatsappHelpLink = getWhatsAppMessageLink(
  'Hello Nebeda Threads, I need help with a custom order.',
)

const requiredFields = [
  'fullName',
  'email',
  'whatsappNumber',
  'garmentFor',
  'outfitType',
  'orderType',
]

const initialFormData = {
  fullName: '',
  email: '',
  whatsappNumber: '',
  garmentFor: '',
  outfitType: '',
  orderType: '',
  fabricPreference: '',
  occasion: '',
  measurementUnit: 'cm',
  measurements: {},
  inspirationImages: [],
  deadline: '',
  styleNotes: '',
}

const fieldLabels = {
  fullName: 'Full Name',
  email: 'Email Address',
  whatsappNumber: 'WhatsApp Number',
  garmentFor: 'Garment For',
  outfitType: 'Outfit Type',
  orderType: 'Order Type',
}

function MeasurementInput({ error, label, onChange, onUnitChange, unit, value }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-gold)]">{label}</span>
      <div className={`mt-3 grid grid-cols-[minmax(0,1fr)_6.5rem] overflow-hidden rounded-2xl border bg-black/40 transition focus-within:border-[var(--color-gold)] ${error ? 'border-red-300/60' : 'border-white/10'}`}>
        <input aria-label={`${label} measurement`} className="min-w-0 bg-transparent px-4 py-3.5 text-white outline-none placeholder:text-white/30" inputMode="decimal" min="0" onChange={(event) => onChange(label, event.target.value)} placeholder="0.0" step="0.1" type="number" value={value || ''} />
        <select aria-label={`${label} unit`} className="border-l border-white/10 bg-black/70 px-3 text-sm text-white outline-none" onChange={(event) => onUnitChange(event.target.value)} value={unit}>
          <option value="cm">cm</option><option value="inches">inches</option>
        </select>
      </div>
      {error ? <p className="mt-2 text-sm text-red-200">{error}</p> : null}
    </label>
  )
}

function MeasurementProfile({ errors, formData, onMeasurementChange, onUnitChange }) {
  const groups = measurementProfiles[formData.garmentFor] || []
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-5 lg:grid-cols-2" initial={{ opacity: 0, y: 12 }} key={formData.garmentFor} transition={{ duration: 0.3, ease: 'easeOut' }}>
      {groups.map((group) => (
        <section className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5" key={group.title}>
          <h3 className="font-serif text-xl text-white">{group.title}</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => <MeasurementInput error={errors[`measurement.${field}`]} key={field} label={field} onChange={onMeasurementChange} onUnitChange={onUnitChange} unit={formData.measurementUnit} value={formData.measurements[field]} />)}
          </div>
        </section>
      ))}
    </motion.div>
  )
}
function TextField({
  error,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/32 focus:border-[var(--color-gold)]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{error}</p> : null}
    </label>
  )
}

function SelectField({ error, label, name, onChange, options, required = false, value }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
        {label}
        {required ? ' *' : ''}
      </span>
      <select
        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[var(--color-gold)]"
        name={name}
        onChange={onChange}
        value={value}
      >
        <option className="bg-black text-white" value="">
          Select {label.toLowerCase()}
        </option>
        {options.map((option) => (
          <option className="bg-black text-white" key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{error}</p> : null}
    </label>
  )
}

function TextAreaField({ label, name, onChange, placeholder, value }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
        {label}
      </span>
      <textarea
        className="mt-3 min-h-36 w-full resize-y rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/32 focus:border-[var(--color-gold)]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function ProcessCard({ step, index }) {
  return (
    <motion.article
      className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.045)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition duration-500 hover:-translate-y-1 hover:border-[rgba(190,151,83,0.62)] hover:bg-[rgba(243,234,217,0.08)]"
      initial={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.65, ease: 'easeOut', delay: index * 0.07 }}
      viewport={{ once: true, amount: 0.25 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="grid size-14 place-items-center rounded-full border border-[rgba(190,151,83,0.55)] bg-[rgba(190,151,83,0.1)] text-sm font-semibold tracking-[0.18em] text-[var(--color-gold)]">
        {step.number}
      </div>
      <h3 className="mt-8 font-serif text-2xl leading-tight text-white">{step.title}</h3>
      <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{step.text}</p>
    </motion.article>
  )
}

function CustomOrder() {
  const userLoggedIn = isUserAuthenticated()
  const { showToast } = useToast()
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [successOrder, setSuccessOrder] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)


  const imagePreviews = useMemo(
    () =>
      formData.inspirationImages.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [formData.inspirationImages],
  )

  useEffect(
    () => () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    },
    [imagePreviews],
  )

  const updateField = (event) => {
    const { name, value, files } = event.target

    if (name === 'inspirationImages') {
      const selectedFiles = Array.from(files || [])
      event.target.value = ''

      if (!selectedFiles.length) return

      if (formData.inspirationImages.length + selectedFiles.length > maxInspirationImages) {
        showToast({ message: 'You can upload up to 3 inspiration images.', type: 'error' })
        return
      }

      const invalidFile = selectedFiles.find((file) => !allowedImageTypes.includes(file.type))
      if (invalidFile) {
        showToast({ message: 'Only JPG, PNG, and WebP inspiration images are allowed.', type: 'error' })
        return
      }

      const oversizedFile = selectedFiles.find((file) => file.size > maxImageSize)
      if (oversizedFile) {
        showToast({ message: 'Each inspiration image must be 5MB or smaller.', type: 'error' })
        return
      }

      setFormData((current) => ({
        ...current,
        inspirationImages: [...current.inspirationImages, ...selectedFiles],
      }))
      setSubmitError('')
      setSuccessOrder(null)
      return
    }

    setFormData((current) => {
      const next = { ...current, [name]: value }


      return next
    })

    setErrors((current) => ({ ...current, [name]: '' }))
    setSuccessOrder(null)
    setSubmitError('')
  }

  const removeInspirationImage = (indexToRemove) => {
    setFormData((current) => ({
      ...current,
      inspirationImages: current.inspirationImages.filter((_, index) => index !== indexToRemove),
    }))
  }

  const selectGarmentFor = (garmentFor) => {
    setFormData((current) => ({ ...current, garmentFor, measurements: current.garmentFor === garmentFor ? current.measurements : {} }))
    setErrors((current) => ({ ...current, garmentFor: '', measurements: '' }))
    setSuccessOrder(null)
  }

  const updateMeasurement = (name, value) => {
    if (value !== '' && Number(value) < 0) return
    setFormData((current) => ({ ...current, measurements: { ...current.measurements, [name]: value } }))
    setErrors((current) => ({ ...current, measurements: '', [`measurement.${name}`]: '' }))
  }

  const updateMeasurementUnit = (measurementUnit) => setFormData((current) => ({ ...current, measurementUnit }))

  const validateForm = () => {
    const nextErrors = {}

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        nextErrors[field] = `${fieldLabels[field]} is required.`
      }
    })

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    const enteredMeasurements = Object.entries(formData.measurements).filter(([, value]) => value !== '')
    if (!enteredMeasurements.length) nextErrors.measurements = 'Enter at least one measurement.'
    enteredMeasurements.forEach(([name, value]) => {
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue) || numericValue < 0) nextErrors[`measurement.${name}`] = 'Enter a valid positive measurement.'
    })

    setErrors(nextErrors)
    const isValid = Object.keys(nextErrors).length === 0

    if (!isValid) {
      showToast({ message: 'Please complete the required fields before submitting.', type: 'error' })
    }

    return isValid
  }

  const buildCustomOrderFormData = () => {
    const requestData = new FormData()
    const measurements = {
      gender: formData.garmentFor,
      unit: formData.measurementUnit,
      fields: Object.entries(formData.measurements)
        .filter(([, value]) => value !== '')
        .map(([name, value]) => ({ name, value: Number(value) })),
    }

    requestData.append('fullName', formData.fullName)
    requestData.append('email', formData.email)
    requestData.append('whatsappNumber', formData.whatsappNumber)
    requestData.append('gender', formData.garmentFor === 'Male' ? 'Men' : 'Women')
    requestData.append('outfitType', formData.outfitType)
    requestData.append('orderType', formData.orderType)
    requestData.append('fabricPreference', formData.fabricPreference)
    requestData.append('occasion', formData.occasion)
    requestData.append('deadline', formData.deadline)
    requestData.append('styleNotes', formData.styleNotes)
    requestData.append('measurements', JSON.stringify(measurements))

    formData.inspirationImages.forEach((file) => {
      requestData.append('inspirationImages', file)
    })

    return requestData
  }

  const handleSubmitCustomOrder = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      setSuccessOrder(null)
      setSubmitError('')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setSuccessOrder(null)

    try {
      const data = await createCustomOrder(buildCustomOrderFormData())
      setSuccessOrder(data.order || data.data || null)
      showToast({ message: 'Your custom order request has been submitted.', type: 'success' })
      logEmailWarning(data, 'Custom order')
      trackLead('custom_order')
      setFormData(initialFormData)
    } catch (apiError) {
      const errorMessage = apiError.message || 'Unable to submit your custom order request.'
      setSubmitError(errorMessage)
      showToast({ message: errorMessage, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }


  if (!userLoggedIn) {
    return (
      <main className="bg-black px-5 py-20 text-white sm:px-8"><section className="mx-auto max-w-2xl rounded-[1.5rem] border border-[rgba(190,151,83,.4)] bg-white/[.04] p-7 text-center sm:p-10"><p className="text-xs uppercase tracking-[.26em] text-[var(--color-gold)]">Custom Order</p><h1 className="mt-4 font-serif text-4xl">Sign in to request a bespoke quote</h1><p className="mt-5 leading-7 text-[var(--color-muted)]">Your account keeps your measurements, quotation and payment status together.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button to="/login?redirect=/custom-order">Login</Button><Button to="/signup?redirect=/custom-order" variant="outline">Create Account</Button></div></section></main>
    )
  }

  return (
    <main className="overflow-hidden bg-black text-white">
      <section className="relative px-5 py-20 sm:px-8 md:py-24 lg:px-10 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(190,151,83,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_34%)]" />
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto max-w-7xl 2xl:max-w-[1500px]"
          initial={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          <div className="mb-7 h-px w-20 bg-[var(--color-gold)]" />
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--color-gold)]">
            CUSTOM ORDER
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-[var(--color-soft-white)] sm:text-6xl lg:text-7xl">
            Create a Piece Made for You
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-[var(--color-muted)] sm:text-lg">
            Share your style, measurements, fabric preference, occasion, and preferred deadline.
            Nebeda Threads will guide you through creating a garment that feels personal, elegant,
            and timeless.
          </p>
        </motion.div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4 2xl:max-w-[1500px]">
          {processSteps.map((step, index) => (
            <ProcessCard index={index} key={step.number} step={step} />
          ))}
        </div>
      </section>

      <section className="relative px-5 py-20 sm:px-8 md:py-24 lg:px-10 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(190,151,83,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-5xl 2xl:max-w-6xl">
          <motion.form
            className="rounded-[1.75rem] border border-white/10 bg-[rgba(255,255,255,0.045)] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-8"
            initial={{ opacity: 0, y: 28 }}
            onSubmit={handleSubmitCustomOrder}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
                Customer Details
              </p>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <TextField
                  error={errors.fullName}
                  label="Full Name"
                  name="fullName"
                  onChange={updateField}
                  placeholder="Your full name"
                  required
                  value={formData.fullName}
                />
                <TextField
                  error={errors.email}
                  label="Email Address"
                  name="email"
                  onChange={updateField}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={formData.email}
                />
                <TextField
                  error={errors.whatsappNumber}
                  label="WhatsApp Number"
                  name="whatsappNumber"
                  onChange={updateField}
                  placeholder="+44..."
                  required
                  type="tel"
                  value={formData.whatsappNumber}
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
                Order Details
              </p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <fieldset className="md:col-span-2">
                  <legend className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">Garment For *</legend>
                  <div className={`mt-3 grid grid-cols-2 gap-2 rounded-2xl border p-1.5 ${errors.garmentFor ? 'border-red-300/60' : 'border-white/10'}`}>
                    {['Male', 'Female'].map((option) => (
                      <button
                        aria-pressed={formData.garmentFor === option}
                        className={`min-h-12 rounded-xl px-4 py-3 text-sm font-semibold transition ${formData.garmentFor === option ? 'bg-[var(--color-gold)] text-black shadow-[0_10px_30px_rgba(190,151,83,0.22)]' : 'text-white/68 hover:bg-white/[0.06] hover:text-white'}`}
                        key={option}
                        onClick={() => selectGarmentFor(option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {errors.garmentFor ? <p className="mt-2 text-sm text-red-200">{errors.garmentFor}</p> : null}
                </fieldset>
                <SelectField
                  error={errors.outfitType}
                  label="Outfit Type"
                  name="outfitType"
                  onChange={updateField}
                  options={selectOptions.outfitType}
                  required
                  value={formData.outfitType}
                />
                <SelectField
                  error={errors.orderType}
                  label="Order Type"
                  name="orderType"
                  onChange={updateField}
                  options={selectOptions.orderType}
                  required
                  value={formData.orderType}
                />
                <SelectField
                  label="Fabric Preference"
                  name="fabricPreference"
                  onChange={updateField}
                  options={selectOptions.fabricPreference}
                  value={formData.fabricPreference}
                />
                <SelectField
                  label="Occasion"
                  name="occasion"
                  onChange={updateField}
                  options={selectOptions.occasion}
                  value={formData.occasion}
                />
                <TextField
                  label="Preferred Deadline"
                  name="deadline"
                  onChange={updateField}
                  type="date"
                  value={formData.deadline}
                />
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">Measurements</p>
                  <p className="mt-2 text-sm text-white/48">Enter only the measurements you know. All fields use the same selected unit.</p>
                </div>
                {formData.garmentFor ? <span className="text-sm text-white/58">{formData.garmentFor} profile</span> : null}
              </div>
              {formData.garmentFor ? (
                <MeasurementProfile errors={errors} formData={formData} onMeasurementChange={updateMeasurement} onUnitChange={updateMeasurementUnit} />
              ) : (
                <div className={`mt-6 rounded-2xl border border-dashed p-6 text-center text-sm ${errors.measurements ? 'border-red-300/60 text-red-100' : 'border-white/15 text-[var(--color-muted)]'}`}>
                  Select Male or Female under Garment For to begin measurements.
                </div>
              )}
              {errors.measurements && formData.garmentFor ? <p className="mt-4 text-sm text-red-200">{errors.measurements}</p> : null}
            </div>

            <div className="mt-8 border-t border-white/10 pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
                Inspiration
              </p>
              <div className="mt-6 grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
                    Upload Inspiration Images
                  </span>
                  <input
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-gold)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.14em] file:text-black"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    name="inspirationImages"
                    onChange={updateField}
                    type="file"
                  />
                  <p className="mt-2 text-sm text-white/42">
                    Optional. Upload up to 3 JPG, PNG, or WebP images. Max 5MB each.
                  </p>
                  {imagePreviews.length ? (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div
                          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/50"
                          key={`${preview.name}-${preview.url}`}
                        >
                          <img
                            alt={`Inspiration preview ${index + 1}`}
                            className="h-32 w-full object-cover"
                            src={preview.url}
                          />
                          <button
                            className="absolute right-2 top-2 rounded-full border border-[rgba(190,151,83,0.5)] bg-black/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gold)] transition hover:bg-[var(--color-gold)] hover:text-black"
                            onClick={() => removeInspirationImage(index)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </label>
                <TextAreaField
                  label="Style Notes"
                  name="styleNotes"
                  onChange={updateField}
                  placeholder="Describe colours, fit, reference styles, fabric ideas, and deadline."
                  value={formData.styleNotes}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row">
              <Button disabled={isSubmitting} type="submit" variant="primary">
                {isSubmitting ? 'Submitting Request...' : 'Submit Custom Order Request'}
              </Button>
              <Button href={whatsappHelpLink} rel="noreferrer" target="_blank" variant="outline">
                Chat on WhatsApp
              </Button>
            </div>
          </motion.form>
          <motion.aside
            className="mt-8 rounded-[1.5rem] border border-[rgba(190,151,83,0.35)] bg-white/[0.04] p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-gold)]">What Happens Next</p>
            <h2 className="mt-3 font-serif text-3xl text-white">Request first. Quote before payment.</h2>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--color-muted)]">Nebeda Threads will review your design, measurements, fabric and deadline. We will contact you with a quotation before any payment or delivery details are requested.</p>
            {successOrder ? (
              <div className="mt-6 rounded-2xl border border-[rgba(190,151,83,0.42)] bg-[rgba(190,151,83,0.1)] p-5 text-sm leading-7 text-[var(--color-cream)]">
                <h3 className="font-serif text-2xl text-white">Custom Order Request Received</h3>
                <p className="mt-3">Thank you. We will review your request and contact you by WhatsApp or email.</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button to="/account/custom-orders" variant="primary">View Custom Orders</Button>
                  <Button href={whatsappHelpLink} rel="noreferrer" target="_blank" variant="outline">Chat on WhatsApp</Button>
                </div>
              </div>
            ) : null}
            {submitError ? <p className="mt-6 rounded-2xl border border-red-300/25 bg-red-950/20 p-4 text-sm text-red-100">{submitError}</p> : null}
          </motion.aside>
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
              Measurement Support
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
              Need Help With Measurements?
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              Contact Nebeda Threads on WhatsApp and we will guide you through the custom order
              process.
            </p>
            <Button
              className="mt-8"
              href={whatsappHelpLink}
              rel="noreferrer"
              target="_blank"
              variant="primary"
            >
              Chat on WhatsApp
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  )
}

export default CustomOrder
