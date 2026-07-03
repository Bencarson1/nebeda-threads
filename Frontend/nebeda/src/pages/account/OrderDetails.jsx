import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AccountLayout from '../../components/account/AccountLayout'
import OrderStatusTimeline from '../../components/account/OrderStatusTimeline'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { getMyOrderById } from '../../services/accountService'
import { createCheckoutSession } from '../../services/paymentService'
import formatOrderReference from '../../utils/orderReference'
import { downloadInvoicePdf, printInvoice } from '../../utils/invoice'
import { rememberPendingPurchase } from '../../utils/analytics'

function formatAmount(value, currency = 'GBP') {
  return new Intl.NumberFormat(currency === 'EUR' ? 'en-IE' : 'en-GB', {
    style: 'currency',
    currency: currency === 'EUR' ? 'EUR' : 'GBP',
  }).format(Number(value || 0))
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value)) : 'Not set'
}

function OrderDetails() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    let active = true
    getMyOrderById(id)
      .then((data) => { if (active) setOrder(data.order) })
      .catch((apiError) => { if (active) setError(apiError.message || 'Unable to load order details.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [id])

  const handlePrintInvoice = () => {
    try {
      printInvoice(order)
    } catch (invoiceError) {
      showToast({ message: invoiceError.message || 'Unable to open invoice.', type: 'error' })
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      await downloadInvoicePdf(order)
      showToast({ message: 'Invoice downloaded.', type: 'success' })
    } catch (invoiceError) {
      showToast({ message: invoiceError.message || 'Unable to download invoice.', type: 'error' })
    }
  }

  const completePayment = async () => {
    setIsRedirecting(true)
    try {
      rememberPendingPurchase(order)
      const data = await createCheckoutSession(order._id)
      if (!data.checkoutUrl) throw new Error('Stripe Checkout URL is unavailable.')
      window.location.assign(data.checkoutUrl)
    } catch (paymentError) {
      showToast({ message: paymentError.message || 'Unable to start payment.', type: 'error' })
      setIsRedirecting(false)
    }
  }

  const canPay = ['Pending', 'Failed'].includes(order?.paymentStatus)
    && !['Cancelled', 'Delivered'].includes(order?.orderStatus)

  return (
    <AccountLayout>
      <Button to="/account/orders" variant="outline">Back to Orders</Button>
      {isLoading ? <p className="text-[var(--color-muted)]">Loading order...</p> : null}
      {error ? <p className="rounded-2xl border border-red-300/25 bg-red-950/20 px-5 py-4 text-sm text-red-100">{error}</p> : null}
      {order ? (
        <>
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">{formatOrderReference(order._id)}</p>
            <h1 className="mt-3 font-serif text-4xl">{order.orderStatus}</h1>
            <p className="mt-3 text-sm text-[var(--color-muted)]">Placed {formatDate(order.createdAt)} / Payment {order.paymentStatus}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {canPay ? <Button disabled={isRedirecting} onClick={completePayment}>{isRedirecting ? 'Opening Secure Payment...' : 'Complete Payment'}</Button> : null}
              <Button onClick={handlePrintInvoice} variant="outline">View Invoice</Button>
              <Button onClick={handleDownloadInvoice} variant="outline">Download Invoice</Button>
            </div>
          </section>

          <OrderStatusTimeline
            cancelledAt={order.cancelledAt}
            createdAt={order.createdAt}
            deliveredAt={order.deliveredAt}
            paidAt={order.paidAt}
            processingAt={order.processingAt}
            shippedAt={order.shippedAt}
            status={order.orderStatus}
            statusHistory={order.statusHistory}
          />

          <section className="grid gap-5 lg:grid-cols-[1.35fr_.8fr]">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
              <h2 className="font-serif text-2xl">Items Ordered</h2>
              <div className="mt-6 space-y-4">
                {order.items?.map((item, index) => (
                  <div className="flex gap-4 border-b border-white/10 pb-4 last:border-0" key={`${item.name}-${index}`}>
                    {item.image ? <img alt={item.name} className="size-20 rounded-xl object-cover" src={item.image} /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">Quantity {item.quantity} · {item.price}</p>
                      {(item.selectedColour || item.selectedSize) ? <p className="mt-1 text-xs text-white/48">{[item.selectedColour && `Colour: ${item.selectedColour}`, item.selectedSize && `Size: ${item.selectedSize}`].filter(Boolean).join(' · ')}</p> : null}
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-gold)]">{formatAmount(item.subtotal, item.currency || order.currency)}</p>
                  </div>
                ))}
              </div>
            </article>

            <aside className="space-y-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
                <h2 className="font-serif text-2xl">Delivery</h2>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-[var(--color-muted)]">Method</dt><dd className="text-right">{order.shipping?.shippingMethod || 'Not set'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-[var(--color-muted)]">Shipping</dt><dd>{formatAmount(order.totals?.deliveryFee, order.currency)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-[var(--color-muted)]">Estimate</dt><dd className="text-right">{order.shipping?.estimatedDelivery || 'Not set'}</dd></div>
                  {order.shipping?.trackingNumber ? <div className="flex justify-between gap-4"><dt className="text-[var(--color-muted)]">Tracking</dt><dd className="break-all text-right">{order.shipping.trackingNumber}</dd></div> : null}
                </dl>
                {order.shipping?.trackingUrl ? <a className="mt-5 inline-flex font-semibold text-[var(--color-gold)]" href={order.shipping.trackingUrl} rel="noreferrer" target="_blank">Track Delivery</a> : null}
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
                <h2 className="font-serif text-2xl">{order.paymentStatus === 'Paid' ? 'Total Paid' : 'Order Total'}</h2>
                <p className="mt-4 text-2xl font-semibold text-[var(--color-gold)]">{formatAmount(order.totals?.total, order.currency)}</p>
              </div>
            </aside>
          </section>
        </>
      ) : null}
    </AccountLayout>
  )
}

export default OrderDetails
