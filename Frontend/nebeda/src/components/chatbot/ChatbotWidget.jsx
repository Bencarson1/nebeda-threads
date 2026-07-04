import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import ChatbotMessage from './ChatbotMessage'
import ChatbotQuickQuestions from './ChatbotQuickQuestions'
import { quickQuestions } from '../../data/chatbotKnowledge'
import { getStoredUser, isUserAuthenticated } from '../../services/userAuthService'
import { trackEvent } from '../../utils/analytics'
import { matchChatbotQuestion } from '../../utils/chatbotMatcher'

const chatStorageKey = 'nebedaHelpAssistantMessages'
const openStorageKey = 'nebedaHelpAssistantOpen'
const maxMessages = 20

function readCustomer() {
  try {
    return isUserAuthenticated() ? getStoredUser() : null
  } catch {
    return null
  }
}

function firstName(customer) {
  return customer?.fullName?.trim().split(/\s+/)[0] || ''
}

function createWelcomeMessage(customer) {
  const name = firstName(customer)
  return {
    id: 'welcome-' + Date.now(),
    role: 'assistant',
    text: (name ? 'Hi ' + name + ', ' : 'Hi, ') + "I'm here to help you shop, order, measure, or track your Nebeda Threads request.",
  }
}

function readStoredMessages(customer) {
  try {
    const messages = JSON.parse(localStorage.getItem(chatStorageKey) || '[]')
    if (Array.isArray(messages) && messages.length) return messages.slice(-maxMessages)
  } catch {
    // Corrupt local chat state is replaced with a clean welcome message.
  }
  return [createWelcomeMessage(customer)]
}

function ChatbotWidget() {
  const [customer, setCustomer] = useState(readCustomer)
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem(openStorageKey) === 'true')
  const [messages, setMessages] = useState(() => readStoredMessages(readCustomer()))
  const [input, setInput] = useState('')
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const messageEndRef = useRef(null)

  const accountLinks = useMemo(() => customer ? [
    { label: 'My Orders', to: '/account/orders' },
    { label: 'Custom Orders', to: '/account/custom-orders' },
  ] : [], [customer])

  useEffect(() => {
    const updateCustomer = () => setCustomer(readCustomer())
    window.addEventListener('nebedaUserAuthChanged', updateCustomer)
    return () => window.removeEventListener('nebedaUserAuthChanged', updateCustomer)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(openStorageKey, String(isOpen))
    } catch {
      // Storage availability must never affect the support widget.
    }
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  useEffect(() => {
    try {
      localStorage.setItem(chatStorageKey, JSON.stringify(messages.slice(-maxMessages)))
    } catch {
      // Storage availability must never affect the support widget.
    }
    if (isOpen) messageEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [isOpen, messages])

  useEffect(() => {
    if (!isOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        window.setTimeout(() => launcherRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const toggleOpen = () => {
    setIsOpen((current) => {
      if (!current) trackEvent('chatbot_opened')
      return !current
    })
  }

  const appendMessages = (...nextMessages) => {
    setMessages((current) => [...current, ...nextMessages].slice(-maxMessages))
  }

  const sendQuestion = (question, quickQuestion = false) => {
    const cleanQuestion = question.trim().slice(0, 500)
    if (!cleanQuestion) return
    const answer = matchChatbotQuestion(cleanQuestion)
    const timestamp = Date.now()

    if (quickQuestion) {
      trackEvent('chatbot_question_clicked', { question_id: answer.id })
    }
    trackEvent('chatbot_message_sent', { matched_topic: answer.id })
    appendMessages(
      { id: 'customer-' + timestamp, role: 'customer', text: cleanQuestion },
      {
        id: 'assistant-' + timestamp,
        role: 'assistant',
        text: (name ? 'Hi ' + name + ', ' : 'Hi, ') + "I'm here to help you shop, order, measure, or track your Nebeda Threads request.",
        links: answer.links,
        handoff: answer.handoff,
      },
    )
    setInput('')
  }

  const submit = (event) => {
    event.preventDefault()
    sendQuestion(input)
  }

  const clearChat = () => {
    setMessages([createWelcomeMessage(customer)])
    setInput('')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const closeForNavigation = () => setIsOpen(false)
  const trackWhatsApp = () => trackEvent('chatbot_whatsapp_clicked')

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label="Nebeda Threads Help Assistant"
            id="nebeda-help-assistant"
            aria-modal="false"
            className="fixed bottom-36 right-4 z-[70] flex max-h-[min(70vh,38rem)] w-[calc(100vw-2rem)] max-w-sm origin-bottom-right flex-col overflow-hidden rounded-2xl border border-[rgba(190,151,83,0.45)] bg-[#080808] text-white shadow-[0_28px_90px_rgba(0,0,0,0.58)] sm:right-6"
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            role="dialog"
            transition={{ duration: 0.2 }}
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div className="min-w-0">
                <p className="truncate font-serif text-lg">Nebeda Threads Help Assistant</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)]">Customer support</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button aria-label="Clear chat" className="grid size-10 place-items-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={clearChat} title="Clear chat" type="button"><Trash2 aria-hidden="true" size={17} /></button>
                <button aria-label="Close help assistant" className="grid size-10 place-items-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white" onClick={() => { setIsOpen(false); window.setTimeout(() => launcherRef.current?.focus(), 0) }} type="button"><X aria-hidden="true" size={19} /></button>
              </div>
            </header>

            <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log">
              {messages.map((message) => (
                <ChatbotMessage key={message.id} message={message} onNavigate={closeForNavigation} onWhatsApp={trackWhatsApp} />
              ))}
              {accountLinks.length ? (
                <div className="flex flex-wrap gap-2 px-1 pt-1">
                  {accountLinks.map((link) => (
                    <Link className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]" key={link.to} onClick={closeForNavigation} to={link.to}>{link.label}</Link>
                  ))}
                </div>
              ) : null}
              <div ref={messageEndRef} />
            </div>

            <div className="border-t border-white/10 bg-black/60 px-4 py-3">
              <ChatbotQuickQuestions onSelect={(question) => sendQuestion(question, true)} questions={quickQuestions} />
              <form className="mt-3 flex items-end gap-2" onSubmit={submit}>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Ask the help assistant</span>
                  <textarea
                    className="max-h-24 min-h-11 w-full resize-none rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[var(--color-gold)]"
                    maxLength={500}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        sendQuestion(input)
                      }
                    }}
                    placeholder="Ask a question..."
                    ref={inputRef}
                    rows={1}
                    value={input}
                  />
                </label>
                <button aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--color-gold)] text-black transition hover:bg-[var(--color-gold-light)] disabled:cursor-not-allowed disabled:opacity-45" disabled={!input.trim()} type="submit"><Send aria-hidden="true" size={18} /></button>
              </form>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <button
        aria-controls="nebeda-help-assistant"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close Nebeda Threads Help Assistant' : 'Open Nebeda Threads Help Assistant'}
        className="fixed bottom-20 right-5 z-[60] grid size-12 place-items-center rounded-full border border-[rgba(190,151,83,0.65)] bg-black text-[var(--color-gold)] shadow-[0_18px_55px_rgba(0,0,0,0.5)] transition hover:-translate-y-1 hover:bg-[var(--color-gold)] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] sm:bottom-20 sm:right-6 sm:size-13"
        onClick={toggleOpen}
        ref={launcherRef}
        type="button"
      >
        {isOpen ? <X aria-hidden="true" size={21} /> : <MessageCircle aria-hidden="true" size={22} />}
      </button>
    </>
  )
}

export default ChatbotWidget
