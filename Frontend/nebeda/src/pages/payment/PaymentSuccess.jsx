import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { trackPendingPurchase } from '../../utils/analytics'

function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const hasSessionReference = Boolean(sessionId)

  useEffect(() => {
    trackPendingPurchase(sessionId)
  }, [sessionId])

  return (
    <main className="flex min-h-[calc(100svh-80px)] items-center bg-black px-5 py-16 text-white sm:px-8 lg:px-10">
      <section className="mx-auto w-full max-w-3xl rounded-[1.5rem] border border-[rgba(190,151,83,0.42)] bg-white/[0.045] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-gold)]">
          Payment Received
        </p>
        <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">Payment Successful</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          Thank you. Your payment has been received and your Nebeda Threads order is confirmed.
        </p>
        {hasSessionReference ? (
          <p className="mt-5 text-sm text-[var(--color-gold)]">Payment reference received.</p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Button to="/account/orders" variant="primary">View My Orders</Button>
          <Button to="/shop" variant="outline">Continue Shopping</Button>
        </div>
      </section>
    </main>
  )
}

export default PaymentSuccess
