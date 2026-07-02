import { email } from '../../data/contactDetails'

function Terms() {
  return (
    <main className="bg-black px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
      <article className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">Legal</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-6xl">Terms and Conditions</h1>
        <div className="mt-10 space-y-8 text-base leading-8 text-[var(--color-muted)]">
          <section><h2 className="font-serif text-2xl text-white">Nebeda Threads</h2><p className="mt-3">These terms apply to use of the Nebeda Threads website and purchases of ready-to-wear, made-to-order, and bespoke fashion products.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Product and Custom Orders</h2><p className="mt-3">Product availability, fabric appearance, production time, and sizing may vary. Custom orders depend on accurate measurements, agreed specifications, and confirmation by Nebeda Threads.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Pricing and Payment</h2><p className="mt-3">Prices and estimates may change before an order is confirmed. Card payments are processed securely through Stripe. An order is accepted once its details, availability, and payment are confirmed.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Account Responsibilities</h2><p className="mt-3">Customers must provide accurate information, protect their account credentials, and notify Nebeda Threads of suspected unauthorised access.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Intellectual Property</h2><p className="mt-3">Nebeda Threads branding, imagery, designs, and website content may not be copied or commercially reused without permission.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Contact</h2><p className="mt-3">Questions about these terms can be sent to <a className="text-[var(--color-gold)]" href={`mailto:${email}`}>{email}</a>.</p></section>
        </div>
      </article>
    </main>
  )
}

export default Terms
