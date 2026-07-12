import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { supportDetails } from '../../data/chatbotKnowledge'

function HandoffCards({ onWhatsApp }) {
  const cards = [
    { label: 'WhatsApp', href: supportDetails.whatsappLink, onClick: onWhatsApp },
    { label: 'Email', href: `mailto:${supportDetails.supportEmail}` },
    { label: 'Instagram', href: supportDetails.instagramUrl },
  ]

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {cards.map((card) => (
        <a
          className="rounded-xl border border-[rgba(190,151,83,0.32)] bg-black/35 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-gold)] transition hover:border-[var(--color-gold)] hover:bg-[rgba(190,151,83,0.12)]"
          href={card.href}
          key={card.label}
          onClick={card.onClick}
          rel="noreferrer"
          target={card.href?.startsWith('mailto:') ? undefined : '_blank'}
        >
          {card.label}
        </a>
      ))}
    </div>
  )
}

function ProductRecommendationCard({ onAddToCart, onNavigate, product }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <Link className="block" onClick={onNavigate} to={product.href || '/shop'}>
        <div className="bg-white/10">
          {product.image ? (
            <img alt={product.name} className="aspect-[4/3] w-full object-cover" loading="lazy" src={product.image} />
          ) : (
            <div className="aspect-[4/3]" />
          )}
        </div>
      </Link>
      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-white">{product.name}</p>
          {product.price ? <p className="mt-1 text-xs font-semibold text-[var(--color-gold)]">{product.price}</p> : null}
          {product.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/55">{product.description}</p> : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
            onClick={onNavigate}
            to={product.href || '/shop'}
          >
            View Product
          </Link>
          {product.requiresOptions ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--color-gold)] px-3 py-2 text-xs font-bold text-black transition hover:bg-[var(--color-gold-light)]"
              onClick={onNavigate}
              to={product.href || '/shop'}
            >
              Select Options
            </Link>
          ) : (
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--color-gold)] px-3 py-2 text-xs font-bold text-black transition hover:bg-[var(--color-gold-light)]"
              onClick={() => onAddToCart?.(product)}
              type="button"
            >
              Add to Cart
            </button>
          )}
        </div>
        <Link
          className="inline-flex w-full min-h-10 items-center justify-center rounded-xl border border-[rgba(190,151,83,0.35)] px-3 py-2 text-xs font-semibold text-[var(--color-gold)] transition hover:border-[var(--color-gold)]"
          onClick={onNavigate}
          to="/custom-order"
        >
          Custom Order
        </Link>
      </div>
    </article>
  )
}

function ChatbotMessage({ message, onAddToCart, onNavigate, onWhatsApp }) {
  const isAssistant = message.role === 'assistant'

  return (
    <article
      className={isAssistant
        ? 'mr-5 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.055] px-4 py-3 text-white shadow-[0_14px_45px_rgba(0,0,0,0.18)]'
        : 'ml-7 rounded-2xl rounded-tr-md bg-[var(--color-gold)] px-4 py-3 text-black'}
    >
      <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
      {isAssistant && message.products?.length ? (
        <div className="mt-4 grid gap-3">
          {message.products.map((product) => (
            <ProductRecommendationCard
              key={product.id || product.name}
              onAddToCart={onAddToCart}
              onNavigate={onNavigate}
              product={product}
            />
          ))}
        </div>
      ) : null}
      {isAssistant && message.links?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.links.map((link) => (
            link.to ? (
              <Link
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[var(--color-gold)] transition hover:border-[var(--color-gold)]"
                key={link.label}
                onClick={onNavigate}
                to={link.to}
              >
                {link.label}
              </Link>
            ) : (
              <a
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[var(--color-gold)] transition hover:border-[var(--color-gold)]"
                href={link.href}
                key={link.label}
                rel="noreferrer"
                target={link.href?.startsWith('mailto:') ? undefined : '_blank'}
              >
                {link.label}
                {!link.href?.startsWith('mailto:') ? <ExternalLink aria-hidden="true" size={12} /> : null}
              </a>
            )
          ))}
        </div>
      ) : null}
      {isAssistant && message.handoff ? <HandoffCards onWhatsApp={onWhatsApp} /> : null}
    </article>
  )
}

export default ChatbotMessage