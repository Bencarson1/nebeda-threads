const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
const pendingPurchaseKey = 'nebedaPendingAnalyticsPurchase'
const recentEvents = new Map()
let lastPageView = { key: '', trackedAt: 0 }

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function isAnalyticsEnabled() {
  return Boolean(
    import.meta.env.PROD
      && typeof window !== 'undefined'
      && /^G-[A-Z0-9]+$/i.test(measurementId || '')
      && !isLocalHost(window.location.hostname),
  )
}

function initializeAnalytics() {
  if (!isAnalyticsEnabled()) return false
  if (window.__nebedaGaInitialized) return true

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  })

  if (!document.querySelector('script[data-nebeda-ga4]')) {
    const script = document.createElement('script')
    script.async = true
    script.dataset.nebedaGa4 = 'true'
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId)
    document.head.appendChild(script)
  }

  window.__nebedaGaInitialized = true
  return true
}

function wasRecentlyTracked(key, windowMs) {
  if (!key || !windowMs) return false
  const now = Date.now()
  const previous = recentEvents.get(key) || 0
  recentEvents.set(key, now)
  return now - previous < windowMs
}

function wasPersistentlyTracked(key) {
  if (!key) return false
  try {
    const storageKey = 'nebedaGaEvent:' + key
    if (sessionStorage.getItem(storageKey)) return true
    sessionStorage.setItem(storageKey, '1')
    return false
  } catch {
    return false
  }
}

function trackEvent(name, parameters = {}, options = {}) {
  if (!initializeAnalytics()) return
  if (options.persist && wasPersistentlyTracked(options.dedupeKey)) return
  if (wasRecentlyTracked(options.dedupeKey, options.dedupeWindowMs)) return
  window.gtag('event', name, parameters)
}

function toAnalyticsItem(item) {
  const productId = item.productId || item.product?._id || item.product || item._id
  const price = Number(item.priceAmount ?? item.numericPrice ?? item.price)
  const variant = [
    item.selectedSize && 'Size: ' + item.selectedSize,
    item.selectedColour && 'Colour: ' + item.selectedColour,
  ].filter(Boolean).join(' / ')

  return {
    item_id: productId ? String(productId) : undefined,
    item_name: item.name,
    item_category: item.displayCategory || item.category,
    item_variant: variant || undefined,
    price: Number.isFinite(price) ? price : undefined,
    quantity: Number(item.quantity) || 1,
  }
}

function getItemsValue(items) {
  return items.reduce((total, item) => {
    const price = Number(item.priceAmount ?? item.numericPrice ?? item.price)
    return total + (Number.isFinite(price) ? price : 0) * (Number(item.quantity) || 1)
  }, 0)
}

function trackPageView(path) {
  if (!isAnalyticsEnabled()) return
  const pageKey = path || window.location.pathname + window.location.search
  const now = Date.now()
  if (lastPageView.key === pageKey && now - lastPageView.trackedAt < 1000) return
  lastPageView = { key: pageKey, trackedAt: now }

  trackEvent('page_view', {
    page_location: window.location.origin + pageKey,
    page_path: pageKey,
    page_title: document.title,
  })
}

function trackViewItem(product) {
  const item = toAnalyticsItem(product)
  trackEvent('view_item', {
    currency: product.currency || 'GBP',
    value: Number(product.priceAmount ?? product.numericPrice) || undefined,
    items: [item],
  }, {
    dedupeKey: 'view_item:' + (product._id || product.slug),
    dedupeWindowMs: 1000,
  })
}

function trackAddToCart(item) {
  trackEvent('add_to_cart', {
    currency: item.currency || 'GBP',
    value: getItemsValue([{ ...item, quantity: 1 }]),
    items: [toAnalyticsItem({ ...item, quantity: 1 })],
  })
}

function trackRemoveFromCart(item) {
  if (!item) return
  trackEvent('remove_from_cart', {
    currency: item.currency || 'GBP',
    value: getItemsValue(item ? [item] : []),
    items: [toAnalyticsItem(item)],
  })
}

function trackBeginCheckout(items, value, currency = 'GBP') {
  trackEvent('begin_checkout', {
    currency,
    value: Number(value) || getItemsValue(items),
    items: items.map(toAnalyticsItem),
  }, {
    dedupeKey: 'begin_checkout:' + items.map((item) => item.cartItemId || item.productId).join('|'),
    dedupeWindowMs: 1000,
  })
}

function trackLogin() {
  trackEvent('login', { method: 'email' })
}

function trackSignUp() {
  trackEvent('sign_up', { method: 'email' })
}

function trackLead(leadType) {
  trackEvent('generate_lead', { lead_type: leadType })
}

function trackNewsletterLead(response) {
  const message = String(response?.message || '').toLowerCase()
  if (!message.includes('already subscribed')) trackLead('newsletter')
}

function rememberPendingPurchase(order) {
  if (!order?._id) return
  const items = Array.isArray(order.items) ? order.items : []
  const payload = {
    transaction_id: String(order._id),
    currency: order.currency || items[0]?.currency || 'GBP',
    value: Number(order.totals?.total) || getItemsValue(items),
    shipping: Number(order.totals?.deliveryFee) || 0,
    items: items.map(toAnalyticsItem),
  }

  try {
    sessionStorage.setItem(pendingPurchaseKey, JSON.stringify(payload))
  } catch {
    // Analytics persistence must never interrupt checkout.
  }
}

function rememberPendingCustomPurchase(order) {
  if (!order?._id) return
  const value = Number(String(order.estimatedPrice || '').replace(/,/g, '').replace(/[^0-9.]/g, ''))
  const payload = {
    transaction_id: String(order._id),
    currency: 'GBP',
    value: Number.isFinite(value) ? value : 0,
    shipping: 0,
    items: [{
      item_id: String(order._id),
      item_name: order.outfitType || 'Custom Order',
      item_category: order.orderType || 'Custom Order',
      quantity: 1,
      price: Number.isFinite(value) ? value : 0,
    }],
  }

  try {
    sessionStorage.setItem(pendingPurchaseKey, JSON.stringify(payload))
  } catch {
    // Analytics persistence must never interrupt checkout.
  }
}

function trackPendingPurchase(sessionId) {
  if (!sessionId) return

  try {
    const stored = sessionStorage.getItem(pendingPurchaseKey)
    if (!stored) return
    const purchase = JSON.parse(stored)
    trackEvent('purchase', purchase, {
      dedupeKey: 'purchase:' + sessionId,
      persist: true,
    })
    sessionStorage.removeItem(pendingPurchaseKey)
  } catch {
    // Invalid analytics state must never affect the payment success page.
  }
}

export {
  initializeAnalytics,
  isAnalyticsEnabled,
  rememberPendingCustomPurchase,
  rememberPendingPurchase,
  toAnalyticsItem,
  trackAddToCart,
  trackBeginCheckout,
  trackEvent,
  trackLead,
  trackLogin,
  trackNewsletterLead,
  trackPageView,
  trackPendingPurchase,
  trackRemoveFromCart,
  trackSignUp,
  trackViewItem,
}
