import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useCart } from '../context/cartContextValue'
import { useToast } from '../components/ui/toastContext'
import { createOrder } from '../services/orderService'
import { createCheckoutSession } from '../services/paymentService'
import { subscribeNewsletter } from '../services/newsletterService'
import { getShippingOptions, getShippingQuote } from '../services/shippingService'
import { getStoredUser, isUserAuthenticated } from '../services/userAuthService'
import logEmailWarning from '../utils/emailDiagnostics'

function formatAmount(value, currency = 'GBP') {
  return new Intl.NumberFormat(currency === 'EUR' ? 'en-IE' : 'en-GB', { style: 'currency', currency }).format(Number(value || 0))
}

function getInitialForm() {
  const user = getStoredUser()
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    whatsappNumber: user?.whatsappNumber || '',
    shippingCountry: 'United Kingdom',
    shippingMethod: 'UK_STANDARD',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateCounty: '',
    postcode: '',
    country: 'United Kingdom',
  }
}

function Checkout() {
  const { cartItems, clearCart, subtotal, totalItems } = useCart()
  const { showToast } = useToast()
  const [formData, setFormData] = useState(getInitialForm)
  const [errors, setErrors] = useState({})
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [shippingCatalog, setShippingCatalog] = useState(null)
  const [shippingQuote, setShippingQuote] = useState(null)
  const [shippingError, setShippingError] = useState('')
  const [isShippingLoading, setIsShippingLoading] = useState(true)
  const userLoggedIn = isUserAuthenticated()
  const storedUser = getStoredUser()
  const emailVerified = Boolean(storedUser?.isEmailVerified)
  const cartCurrency = cartItems[0]?.currency === 'EUR' ? 'EUR' : 'GBP'
  const shippingCountries = shippingCatalog?.countries || ['United Kingdom']
  const selectedShipping = shippingQuote?.quote || null
  const availableShippingMethods = shippingQuote?.options || []
  const shippingQuoteRequired = Boolean(shippingQuote?.quoteRequired)
  const shippingCost = Number(selectedShipping?.shippingCost || 0)
  const checkoutTotal = Number(subtotal || 0) + shippingCost
  const itemsNeedingSelection = cartItems.filter((item) => item.requiresSelectionUpdate)

  useEffect(() => {
    let active = true

    getShippingOptions()
      .then((data) => {
        if (active) setShippingCatalog(data)
      })
      .catch((error) => {
        if (active) setShippingError(error.message || 'Shipping options are unavailable.')
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    getShippingQuote({
      country: formData.shippingCountry,
      subtotal,
      shippingMethod: formData.shippingMethod,
      currency: cartCurrency,
    })
      .then((data) => {
        if (!active) return
        setShippingQuote(data)
        const methodCode = data.quote?.methodCode || ''
        setShippingError('')
        if (methodCode && methodCode !== formData.shippingMethod) {
          setFormData((current) => ({ ...current, shippingMethod: methodCode }))
        }
      })
      .catch((error) => {
        if (!active) return
        setShippingQuote(null)
        setShippingError(error.message || 'Unable to calculate shipping.')
      })
      .finally(() => {
        if (active) setIsShippingLoading(false)
      })

    return () => {
      active = false
    }
  }, [cartCurrency, formData.shippingCountry, formData.shippingMethod, subtotal])

  if (!cartItems.length && !createdOrder) {
    return <Navigate replace to="/cart" />
  }

  const updateField = (event) => {
    const { name, value } = event.target
    if (name === 'shippingCountry' || name === 'shippingMethod') {
      setIsShippingLoading(true)
      setShippingError('')
    }
    setFormData((current) => {
      const next = { ...current, [name]: value }
      if (name === 'shippingCountry') {
        next.shippingMethod = ''
        next.country = value === 'Other' ? '' : value
      }
      return next
    })
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validateForm = () => {
    const required = ['fullName', 'email', 'shippingCountry', 'addressLine1', 'city', 'country']
    const labels = {
      fullName: 'Full Name',
      email: 'Email',
      shippingCountry: 'Shipping Country',
      addressLine1: 'Address Line 1',
      city: 'City',
      country: 'Country',
    }
    const nextErrors = {}

    if (itemsNeedingSelection.length) {
      const item = itemsNeedingSelection[0]
      showToast({ message: item.name + ': please reselect size/colour in your cart.', type: 'error' })
      return false
    }

    required.forEach((field) => {
      if (!formData[field].trim()) nextErrors[field] = `${labels[field]} is required.`
    })

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (isShippingLoading || !selectedShipping || shippingQuoteRequired || shippingError) {
      nextErrors.shippingCountry = shippingQuoteRequired
        ? 'Please contact Nebeda Threads for a shipping quotation.'
        : 'Please wait for a valid shipping quote.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      showToast({ message: 'Please complete the required checkout fields.', type: 'error' })
      return false
    }
    return true
  }

  const handleCreateOrder = async (event) => {
    event.preventDefault()
    if (!userLoggedIn) {
      showToast({
        message: 'Please login or create an account to complete your order.',
        type: 'error',
      })
      return
    }
    if (!emailVerified) {
      showToast({ message: 'Please verify your email before completing payment.', type: 'error' })
      return
    }
    if (!validateForm()) return
    setIsSubmitting(true)

    try {
      const payload = {
        customer: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          whatsappNumber: formData.whatsappNumber.trim(),
        },
        shipping: {
          shippingCountry: formData.shippingCountry,
          shippingMethod: formData.shippingMethod,
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim(),
          city: formData.city.trim(),
          stateCounty: formData.stateCounty.trim(),
          postcode: formData.postcode.trim(),
          country: formData.country.trim(),
        },
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedSize: item.selectedSize || '',
          selectedColour: item.selectedColour || '',
        })),
      }
      const data = await createOrder(payload)

      if (newsletterOptIn) {
        try {
          const newsletterResponse = await subscribeNewsletter({
            email: formData.email.trim(),
            fullName: formData.fullName.trim(),
            source: 'Checkout',
          })
          logEmailWarning(newsletterResponse, 'Checkout newsletter signup')
        } catch {
          // Newsletter failure must never block an order or payment.
        }
      }

      setCreatedOrder(data.order)
      clearCart()
      showToast({ message: 'Your order has been created.', type: 'success' })
      logEmailWarning(data, 'Checkout order')

      try {
        const paymentData = await createCheckoutSession(data.order._id)
        if (!paymentData.checkoutUrl) throw new Error('Stripe Checkout URL is unavailable.')
        window.location.assign(paymentData.checkoutUrl)
      } catch (paymentError) {
        showToast({
          message:
            paymentError.message ||
            'Order created, but payment could not start. Complete payment from My Orders.',
          type: 'info',
        })
      }
    } catch (apiError) {
      showToast({ message: apiError.message || 'Unable to create order.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resumePayment = async () => {
    if (!createdOrder?._id) return
    setIsSubmitting(true)

    try {
      const paymentData = await createCheckoutSession(createdOrder._id)
      if (!paymentData.checkoutUrl) throw new Error('Stripe Checkout URL is unavailable.')
      window.location.assign(paymentData.checkoutUrl)
    } catch (paymentError) {
      showToast({ message: paymentError.message || 'Unable to start payment.', type: 'error' })
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bg-black px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
      <section className="mx-auto max-w-7xl 2xl:max-w-[1500px]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Checkout
          </p>
          <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
            Review Before Secure Payment
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--color-muted)]">
            Confirm your delivery details, create your order, and continue to secure Stripe Checkout.
          </p>
          {userLoggedIn ? (
            <p className="mt-4 rounded-2xl border border-[rgba(190,151,83,0.32)] bg-white/[0.04] px-5 py-4 text-sm text-[var(--color-muted)]">
              Checking out as {formData.fullName || formData.email}. Your order will be saved to
              your customer account.
            </p>
          ) : null}
        </div>

        {createdOrder ? (
          <div className="mt-10 rounded-[1.5rem] border border-[rgba(190,151,83,0.42)] bg-[rgba(190,151,83,0.1)] p-6 sm:p-8">
            <h2 className="font-serif text-3xl text-white">Order Created</h2>
            <p className="mt-4 text-[var(--color-muted)]">
              Your order has been saved. Continue to Stripe Checkout to complete payment securely.
            </p>
            <p className="mt-4 break-all text-sm uppercase tracking-[0.18em] text-[var(--color-gold)]">
              Order Reference: {createdOrder._id}
            </p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row">
              <Button disabled={isSubmitting} onClick={resumePayment} variant="primary">
                {isSubmitting ? 'Opening Secure Payment...' : 'Complete Payment'}
              </Button>
              <Button to="/account/orders" variant="outline">View My Orders</Button>
            </div>
          </div>
        ) : !userLoggedIn ? (
          <section className="mt-10 rounded-[1.5rem] border border-[rgba(190,151,83,0.42)] bg-white/[0.045] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.3)] sm:p-8 lg:max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">
              Account Required
            </p>
            <h2 className="mt-4 font-serif text-3xl text-white sm:text-4xl">
              Sign in to Continue
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              Create an account or log in to complete your order, track your purchase, and receive
              Nebeda Threads updates.
            </p>
            <p className="mt-5 rounded-2xl border border-white/10 bg-black/35 px-5 py-4 text-sm leading-7 text-white/72">
              Your cart is saved and will remain here while you sign in.
            </p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row">
              <Button to="/login?redirect=/checkout" variant="primary">
                Login
              </Button>
              <Button to="/signup?redirect=/checkout" variant="outline">
                Create Account
              </Button>
            </div>
          </section>
        ) : !emailVerified ? (
          <section className="mt-10 max-w-3xl rounded-[1.5rem] border border-[rgba(190,151,83,0.42)] bg-white/[0.045] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">Email Verification</p>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl">Please Verify Your Email</h2>
            <p className="mt-4 leading-7 text-[var(--color-muted)]">Verify your email before completing payment. Your cart is saved while you do this.</p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row">
              <Button to="/account/security" variant="primary">Resend Verification Email</Button>
              <Button to="/account" variant="outline">My Account</Button>
            </div>
          </section>
        ) : (
          <form className="mt-10 grid gap-8 lg:grid-cols-[1fr_24rem]" onSubmit={handleCreateOrder}>
            <div className="space-y-8">
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">
                  Customer Details
                </p>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {[
                    ['fullName', 'Full Name', 'text'],
                    ['email', 'Email', 'email'],
                    ['whatsappNumber', 'WhatsApp Number', 'tel'],
                  ].map(([name, label, type]) => (
                    <label className="block" key={name}>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                        {label}
                      </span>
                      <input
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-[var(--color-gold)]"
                        name={name}
                        onChange={updateField}
                        type={type}
                        value={formData[name]}
                      />
                      {errors[name] ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{errors[name]}</p> : null}
                    </label>
                  ))}
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                      Shipping Country
                    </span>
                    <select
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-[var(--color-gold)]"
                      name="shippingCountry"
                      onChange={updateField}
                      value={formData.shippingCountry}
                    >
                      {shippingCountries.map((country) => (
                        <option className="bg-black" key={country}>{country}</option>
                      ))}
                    </select>
                  </label>
                  <div className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                      Shipping Method
                    </span>
                    {shippingQuoteRequired ? (
                      <div className="mt-3 rounded-2xl border border-[rgba(190,151,83,0.38)] bg-[rgba(190,151,83,0.08)] px-5 py-4 text-sm leading-6 text-[var(--color-gold-light)]">
                        Please contact Nebeda Threads for a shipping quotation.
                      </div>
                    ) : availableShippingMethods.length > 1 ? (
                      <select
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-[var(--color-gold)]"
                        name="shippingMethod"
                        onChange={updateField}
                        value={formData.shippingMethod}
                      >
                        {availableShippingMethods.map((method) => (
                          <option className="bg-black" key={method.methodCode} value={method.methodCode}>
                            {method.shippingMethod} - {formatAmount(method.shippingCost, cartCurrency)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 px-5 py-4">
                        <p className="font-medium text-white">
                          {isShippingLoading
                            ? 'Calculating shipping...'
                            : selectedShipping?.shippingMethod || 'Shipping unavailable'}
                        </p>
                        {selectedShipping ? (
                          <p className="mt-1 text-sm leading-6 text-white/58">
                            {shippingCost === 0 ? 'Free' : formatAmount(shippingCost, cartCurrency)}
                            {' - '}
                            {selectedShipping.estimatedDelivery}
                          </p>
                        ) : null}
                      </div>
                    )}
                    {shippingError ? (
                      <p className="mt-2 text-sm text-[var(--color-gold-light)]">{shippingError}</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">
                  Shipping Address
                </p>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {[
                    ['addressLine1', 'Address Line 1', 'md:col-span-2'],
                    ['addressLine2', 'Address Line 2', 'md:col-span-2'],
                    ['city', 'City', ''],
                    ['stateCounty', 'State/County', ''],
                    ['postcode', 'Postcode', ''],
                    ['country', 'Country', ''],
                  ].map(([name, placeholder, className]) => (
                    <label className={`block ${className}`} key={name}>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none focus:border-[var(--color-gold)]"
                        name={name}
                        onChange={updateField}
                        placeholder={placeholder}
                        value={formData[name]}
                      />
                      {errors[name] ? <p className="mt-2 text-sm text-[var(--color-gold-light)]">{errors[name]}</p> : null}
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 sm:p-8">
                <label className="flex items-start gap-3 text-sm leading-7 text-[var(--color-muted)]">
                  <input
                    checked={newsletterOptIn}
                    className="mt-1 size-4 accent-[var(--color-gold)]"
                    onChange={(event) => setNewsletterOptIn(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Send me Nebeda Threads updates and new collection alerts.</span>
                </label>
              </section>
            </div>

            <aside className="h-fit rounded-[1.5rem] border border-[rgba(190,151,83,0.38)] bg-white/[0.055] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.3)] lg:sticky lg:top-28">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">
                Order Summary
              </p>
              <div className="mt-6 space-y-4">
                {cartItems.map((item) => (
                  <div className="flex gap-3 border-b border-white/10 pb-4 last:border-b-0" key={item.cartItemId || item.productId}>
                    <img alt={item.name} className="size-16 rounded-xl object-cover" loading="lazy" src={item.image} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-white">{item.name}</p>
                      <p className="mt-1 text-xs text-white/52">Quantity: {item.quantity}</p>
                      {(item.selectedColour || item.selectedSize) ? <p className="mt-1 text-xs text-white/52">{[item.selectedColour && `Colour: ${item.selectedColour}`, item.selectedSize && `Size: ${item.selectedSize}`].filter(Boolean).join(' · ')}</p> : null}
                      <p className="mt-1 text-xs text-[var(--color-gold)]">
                        {formatAmount((item.priceAmount ?? item.numericPrice) * item.quantity, item.currency || cartCurrency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                <div className="flex justify-between text-sm"><span className="text-white/58">Products</span><span>{totalItems}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/58">Subtotal</span><span>{formatAmount(subtotal, cartCurrency)}</span></div>
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-white/58">Delivery</span>
                  <span className="text-right">
                    {shippingQuoteRequired
                      ? 'Quote required'
                      : isShippingLoading
                        ? 'Calculating...'
                        : shippingCost === 0
                          ? 'Free'
                          : formatAmount(shippingCost, cartCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="text-[var(--color-gold)]">{formatAmount(checkoutTotal, cartCurrency)}</span></div>
              </div>
              <Button className="mt-7 w-full" disabled={isSubmitting || isShippingLoading || shippingQuoteRequired || !selectedShipping} type="submit" variant="primary">
                {isSubmitting ? 'Preparing Secure Payment...' : 'Proceed to Secure Payment'}
              </Button>
            </aside>
          </form>
        )}
      </section>
    </main>
  )
}

export default Checkout
