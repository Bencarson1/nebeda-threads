import { email, whatsappLink, whatsappNumber } from '../../data/contactDetails'

function ShippingReturns() {
  return (
    <main className="bg-black px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
      <article className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">Customer Care</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-6xl">Shipping and Returns</h1>
        <div className="mt-10 space-y-8 text-base leading-8 text-[var(--color-muted)]">
          <section><h2 className="font-serif text-2xl text-white">Delivery Regions</h2><p className="mt-3">Nebeda Threads supports UK delivery, Nigeria delivery, and worldwide delivery enquiries. Available methods, costs, and estimated timing will be confirmed for each order.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Processing Times</h2><p className="mt-3">Ready-to-wear and custom garments have different preparation times. Bespoke and wedding pieces begin only after design, measurements, pricing, and production timing are agreed.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Returns</h2><p className="mt-3">Eligible ready-to-wear returns must be unworn, unaltered, and in their original condition. Custom, personalised, altered, and bespoke items may have different return rights unless faulty.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Measurements</h2><p className="mt-3">Customers should check measurements carefully before approving a custom order. Nebeda Threads can provide measurement guidance when requested.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Contact</h2><p className="mt-3">Contact <a className="text-[var(--color-gold)]" href={`mailto:${email}`}>{email}</a> or <a className="text-[var(--color-gold)]" href={whatsappLink} rel="noreferrer" target="_blank">WhatsApp {whatsappNumber}</a> before returning an item.</p></section>
        </div>
      </article>
    </main>
  )
}

export default ShippingReturns
