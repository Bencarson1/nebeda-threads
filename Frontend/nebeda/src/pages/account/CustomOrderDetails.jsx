import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AccountLayout from '../../components/account/AccountLayout'
import OrderStatusTimeline from '../../components/account/OrderStatusTimeline'
import Button from '../../components/ui/Button'
import { getMyCustomOrderById } from '../../services/accountService'
import { createCustomOrderCheckoutSession } from '../../services/paymentService'
import { useToast } from '../../components/ui/toastContext'
import formatOrderReference from '../../utils/orderReference'
import MeasurementTable from '../../components/custom-order/MeasurementTable'
import { rememberPendingCustomPurchase } from '../../utils/analytics'

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value)) : 'Not set'
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 text-white/78">{value || 'Not provided'}</p>
    </div>
  )
}

function CustomOrderDetails() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    let active = true
    getMyCustomOrderById(id)
      .then((data) => { if (active) setOrder(data.order) })
      .catch((apiError) => { if (active) setError(apiError.message || 'Unable to load custom order details.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [id])


  const completePayment = async () => {
    setIsRedirecting(true)
    try {
      rememberPendingCustomPurchase(order)
      const data = await createCustomOrderCheckoutSession(order._id)
      if (!data.checkoutUrl) throw new Error('Stripe Checkout URL is unavailable.')
      window.location.assign(data.checkoutUrl)
    } catch (paymentError) {
      showToast({ message: paymentError.message || 'Unable to start quote payment.', type: 'error' })
      setIsRedirecting(false)
    }
  }
  return (
    <AccountLayout>
      <Button to="/account/custom-orders" variant="outline">Back to Custom Orders</Button>
      {isLoading ? <p className="text-[var(--color-muted)]">Loading custom order...</p> : null}
      {error ? <p className="rounded-2xl border border-red-300/25 bg-red-950/20 px-5 py-4 text-sm text-red-100">{error}</p> : null}
      {order ? (
        <>
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">{formatOrderReference(order._id, 'NTC')}</p>
            <h1 className="mt-3 font-serif text-4xl">{order.outfitType}</h1>
            <p className="mt-3 text-sm text-[var(--color-muted)]">Requested {formatDate(order.createdAt)} · {order.orderStatus} · Quote payment {order.paymentStatus}</p>
            {order.orderStatus === 'Awaiting Payment' && order.paymentStatus !== 'Paid' ? (
              <Button className="mt-6" disabled={isRedirecting} onClick={completePayment}>{isRedirecting ? 'Opening Secure Payment...' : 'Pay Approved Quote'}</Button>
            ) : null}
          </section>

          <OrderStatusTimeline status={order.orderStatus} type="custom" />

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
              <h2 className="font-serif text-2xl">Request Details</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Gender" value={order.gender} />
                <Field label="Order Type" value={order.orderType} />
                <Field label="Fabric" value={order.fabricPreference} />
                <Field label="Occasion" value={order.occasion} />
                <Field label="Preferred Deadline" value={formatDate(order.deadline)} />
                <Field label="Estimated Quote" value={order.estimatedPrice} />
              </div>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
              <h2 className="font-serif text-2xl">Measurements</h2>
              <div className="mt-6">
                <MeasurementTable measurements={order.measurements} fallbackGender={order.gender} />
              </div>
            </article>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
            <h2 className="font-serif text-2xl">Style Notes</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--color-muted)]">{order.styleNotes || 'No style notes provided.'}</p>
          </section>

          {order.inspirationImages?.length ? (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {order.inspirationImages.map((image) => (
                <img alt={image.alt} className="h-64 w-full rounded-2xl object-cover" key={image.publicId} loading="lazy" src={image.url} />
              ))}
            </section>
          ) : null}
        </>
      ) : null}
    </AccountLayout>
  )
}

export default CustomOrderDetails
