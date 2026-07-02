import { Link } from 'react-router-dom'
import { navLinks } from '../../data/navLinks'
import { email, instagramHandle, instagramUrl, whatsappLink, whatsappNumber } from '../../data/contactDetails'

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-5 py-14 text-white sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
        <div>
          <p className="font-serif text-3xl">Nebeda Threads</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-gold)]">
            Elevate Your Essence
          </p>
          <p className="mt-6 max-w-md text-sm leading-7 text-[var(--color-muted)]">
            Luxury African fashion crafted for identity, elegance, and confidence.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Quick Links</h3>
          <div className="mt-5 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-gold)]"
                key={link.path}
                to={link.path}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Contact</h3>
          <div className="mt-5 flex flex-col gap-3 break-words text-sm text-[var(--color-muted)]">
            <a
              className="transition hover:text-[var(--color-gold)]"
              href={`mailto:${email}`}
            >
              Email: {email}
            </a>
            <a
              className="transition hover:text-[var(--color-gold)]"
              href={instagramUrl}
              rel="noreferrer"
              target="_blank"
            >
              Instagram: {instagramHandle}
            </a>
            <a
              className="transition hover:text-[var(--color-gold)]"
              href={whatsappLink}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp: {whatsappNumber}
            </a>
            <p>United Kingdom, worldwide delivery</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.18em] text-white/42 lg:flex-row lg:items-center lg:justify-between">
        <p>Copyright {new Date().getFullYear()} Nebeda Threads. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          <Link className="transition hover:text-[var(--color-gold)]" to="/privacy-policy">Privacy Policy</Link>
          <Link className="transition hover:text-[var(--color-gold)]" to="/terms">Terms &amp; Conditions</Link>
          <Link className="transition hover:text-[var(--color-gold)]" to="/shipping-information">Shipping Policy</Link>
          <Link className="transition hover:text-[var(--color-gold)]" to="/shipping-returns">Returns &amp; Refund Policy</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
