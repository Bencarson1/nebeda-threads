const email = 'nebeda33@gmail.com'
const supportEmail = 'support@nebedathreads.co.uk'
const whatsappNumber = '+44 7448 668759'
const whatsappLink = 'https://wa.me/message/3K25B5XWBN73J1'
const instagramUrl =
  'https://www.instagram.com/nebeda_threads_luxury_fashion?igsh=OXBjZzZocjVqY2F4&utm_source=qr'
const instagramHandle = '@nebeda_threads_luxury_fashion'

const whatsappNumberClean = whatsappNumber.replace(/\D/g, '')

function getWhatsAppMessageLink(message) {
  return `${whatsappLink}?text=${encodeURIComponent(message)}`
}

function getWhatsAppProductLink(productName) {
  return `https://wa.me/${whatsappNumberClean}?text=${encodeURIComponent(
    `Hello Nebeda Threads, I am interested in ${productName}`,
  )}`
}

export {
  email,
  getWhatsAppMessageLink,
  getWhatsAppProductLink,
  instagramHandle,
  instagramUrl,
  supportEmail,
  whatsappLink,
  whatsappNumber,
}
