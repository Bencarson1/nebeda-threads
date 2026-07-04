import { instagramUrl, whatsappLink, whatsappNumber } from './contactDetails'

const supportEmail = 'support@nebedathreads.co.uk'

const chatbotKnowledge = [
  {
    id: 'place-order',
    question: 'How do I place an order?',
    keywords: ['place an order', 'buy', 'ready to wear', 'ready-to-wear', 'order online'],
    answer: 'Open Shop, choose a product and any available size or colour, then add it to your cart. Review your cart, sign in or create an account, verify your email, enter delivery details, and continue to secure Stripe Checkout.',
    links: [{ label: 'Shop Collection', to: '/shop' }, { label: 'View Cart', to: '/cart' }],
  },
  {
    id: 'add-to-cart',
    question: 'How do I add to cart?',
    keywords: ['add to cart', 'cart', 'basket'],
    answer: 'Choose the required size and colour on the product page, then select Add to Cart. Your cart is saved on this device while you continue shopping or sign in.',
    links: [{ label: 'Shop Collection', to: '/shop' }, { label: 'View Cart', to: '/cart' }],
  },
  {
    id: 'custom-order',
    question: 'How do custom orders work?',
    keywords: ['custom', 'bespoke', 'made to measure', 'made-to-measure', 'custom order'],
    answer: 'Sign in and submit a custom order request with the garment type, measurements, fabric preference, occasion, deadline, inspiration images, and notes. Nebeda Threads reviews the request and confirms a quotation before any custom-order payment.',
    links: [{ label: 'Start Custom Order', to: '/custom-order' }, { label: 'My Custom Orders', to: '/account/custom-orders' }],
  },
  {
    id: 'measurements',
    question: 'How do I submit measurements?',
    keywords: ['measure', 'measurement', 'measurements', 'size', 'size guide', 'sizing'],
    answer: 'For ready-to-wear pieces, select an available size on the product page. For a custom order, choose whether the garment is for Male or Female, select centimetres or inches, and enter the measurements you know. Contact WhatsApp if you need measurement guidance.',
    links: [{ label: 'Custom Order Form', to: '/custom-order' }],
    handoff: true,
  },
  {
    id: 'shipping',
    question: 'What are the delivery options?',
    keywords: ['delivery', 'shipping', 'uk', 'united kingdom', 'nigeria', 'europe', 'canada', 'usa', 'international'],
    answer: 'UK checkout offers Standard or Express delivery, with free UK delivery applied automatically when the qualifying subtotal is reached. Europe and USA/Canada have supported rates. Nigeria and other destinations require confirmation or a custom shipping quotation before payment.',
    links: [{ label: 'Shipping Information', to: '/shipping-information' }],
    handoff: true,
  },
  {
    id: 'payment',
    question: 'How does payment work?',
    keywords: ['payment', 'stripe', 'card', 'pay', 'checkout', 'secure payment'],
    answer: 'Checkout creates your order using backend-verified product and shipping totals, then redirects you to secure Stripe Checkout. Nebeda Threads marks payment as received only after Stripe confirms it. Never share card details in chat or WhatsApp.',
    links: [{ label: 'View Cart', to: '/cart' }, { label: 'My Orders', to: '/account/orders' }],
  },
  {
    id: 'returns',
    question: 'What is the returns guidance?',
    keywords: ['return', 'returns', 'refund', 'exchange', 'faulty'],
    answer: 'Eligible ready-to-wear returns must be unworn, unaltered, and in their original condition. Custom, personalised, altered, and bespoke pieces may have different return rights unless faulty. Contact Nebeda Threads before returning anything so your case can be reviewed properly.',
    links: [{ label: 'Shipping & Returns', to: '/shipping-returns' }],
    handoff: true,
  },
  {
    id: 'tracking',
    question: 'How can I track my order?',
    keywords: ['track', 'tracking', 'order status', 'where is my order', 'dispatch', 'shipped'],
    answer: 'Sign in and open My Orders to see your current order and payment status. When tracking details are available, the order page shows the carrier, tracking number, and tracking link. This assistant cannot access private order data.',
    links: [{ label: 'My Orders', to: '/account/orders' }],
    handoff: true,
  },
  {
    id: 'account',
    question: 'How do I create or access my account?',
    keywords: ['account', 'sign up', 'signup', 'register', 'login', 'log in', 'sign in'],
    answer: 'Create an account with your name, email, WhatsApp number, and password. If you already have one, sign in to view orders, custom requests, profile details, and account security.',
    links: [{ label: 'Login', to: '/login' }, { label: 'Create Account', to: '/signup' }],
  },
  {
    id: 'verification',
    question: 'How do I verify my email?',
    keywords: ['verify email', 'verification', 'email verified', 'verification link'],
    answer: 'Open the verification email from Nebeda Threads and use its secure link. Email verification is required before payment. If the link expired or was already used, sign in and resend it from Account Security.',
    links: [{ label: 'Account Security', to: '/account/security' }],
  },
  {
    id: 'password',
    question: 'I forgot my password',
    keywords: ['forgot password', 'reset password', 'password', 'cannot login', "can't login"],
    answer: 'Open Forgot Password, enter your account email, and use the secure reset link sent to you. Reset links expire, so request a new one if needed.',
    links: [{ label: 'Forgot Password', to: '/forgot-password' }],
  },
  {
    id: 'contact',
    question: 'How do I contact Nebeda Threads?',
    keywords: ['contact', 'whatsapp', 'email', 'instagram', 'support', 'speak to someone', 'help'],
    answer: `Contact Nebeda Threads on WhatsApp at ${whatsappNumber}, email ${supportEmail}, or visit the official Instagram page.`,
    links: [{ label: 'Contact Page', to: '/contact' }, { label: `Email ${supportEmail}`, href: `mailto:${supportEmail}` }, { label: 'Instagram', href: instagramUrl }],
    handoff: true,
  },
]

const quickQuestions = [
  'How do I place an order?',
  'How do custom orders work?',
  'How do I submit measurements?',
  'What are the delivery options?',
  'How can I track my order?',
  'How do I contact Nebeda Threads?',
]

const unknownAnswer = {
  id: 'unknown',
  answer: "I’m not fully sure about that. Please contact Nebeda Threads directly on WhatsApp so we can help you properly.",
  links: [{ label: `Email ${supportEmail}`, href: `mailto:${supportEmail}` }],
  handoff: true,
}

const supportDetails = { instagramUrl, supportEmail, whatsappLink, whatsappNumber }

// Future improvement: make chatbot FAQ editable from the admin dashboard.
export { chatbotKnowledge, quickQuestions, supportDetails, unknownAnswer }
