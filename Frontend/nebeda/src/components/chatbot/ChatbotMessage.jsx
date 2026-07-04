import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { supportDetails } from '../../data/chatbotKnowledge'

function ChatbotMessage({ message, onNavigate, onWhatsApp }) {
  const isAssistant = message.role === 'assistant'

  return (
    <article
      className={isAssistant
        ? 'mr-7 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.055] px-4 py-3 text-white'
        : 'ml-7 rounded-2xl rounded-tr-md bg-[var(--color-gold)] px-4 py-3 text-black'}
    >
      <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
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
      {isAssistant && message.handoff ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--color-gold)] px-4 py-2 text-xs font-bold text-black transition hover:bg-[var(--color-gold-light)]"
            href={supportDetails.whatsappLink}
            onClick={onWhatsApp}
            rel="noreferrer"
            target="_blank"
          >
            WhatsApp {supportDetails.whatsappNumber}
          </a>
          <a className="text-xs text-white/60 underline-offset-4 hover:text-[var(--color-gold)] hover:underline" href={`mailto:${supportDetails.supportEmail}`}>Email</a>
          <a className="text-xs text-white/60 underline-offset-4 hover:text-[var(--color-gold)] hover:underline" href={supportDetails.instagramUrl} rel="noreferrer" target="_blank">Instagram</a>
        </div>
      ) : null}
    </article>
  )
}

export default ChatbotMessage
