import { email } from '../../data/contactDetails'

function PrivacyPolicy() {
  return (
    <main className="bg-black px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
      <article className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">Legal</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-6xl">Privacy Policy</h1>
        <div className="mt-10 space-y-8 text-base leading-8 text-[var(--color-muted)]">
          <section><h2 className="font-serif text-2xl text-white">Information We Collect</h2><p className="mt-3">We may collect customer account details, order and delivery information, custom-order measurements, contact-form messages, and newsletter subscription preferences.</p></section>
          <section><h2 className="font-serif text-2xl text-white">How We Use Information</h2><p className="mt-3">Information is used to provide accounts, process and manage orders, respond to enquiries, deliver requested communications, prevent misuse, and improve Nebeda Threads services.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Cookies and Analytics</h2><p className="mt-3">Essential cookies or local storage may support account and cart functionality. Analytics tools may be added later and this policy must be updated before they are enabled.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Email Communications</h2><p className="mt-3">We send transactional messages about accounts and orders. Marketing messages are sent only to subscribers, who may unsubscribe from future updates.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Retention and Rights</h2><p className="mt-3">We retain information only as reasonably required for customer service, legal, accounting, and security purposes. UK customers may request access, correction, or deletion where applicable.</p></section>
          <section><h2 className="font-serif text-2xl text-white">Contact</h2><p className="mt-3">Privacy enquiries can be sent to <a className="text-[var(--color-gold)]" href={`mailto:${email}`}>{email}</a>.</p></section>
        </div>
      </article>
    </main>
  )
}

export default PrivacyPolicy
