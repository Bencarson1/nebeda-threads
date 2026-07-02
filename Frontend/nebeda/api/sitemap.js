const SITE_URL = 'https://nebedathreads.co.uk'
const API_URL = globalThis.process?.env?.VITE_API_URL?.replace(/\/$/, '') || 'https://nebeda.onrender.com/api'

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/custom-order', priority: '0.8', changefreq: 'monthly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/shipping-information', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/shipping-returns', priority: '0.5', changefreq: 'monthly' },
]

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

async function getActiveProducts() {
  const products = []
  let page = 1
  let pages

  do {
    const response = await fetch(API_URL + '/products?page=' + page + '&limit=50&sort=-createdAt', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error('Product sitemap request failed')
    const data = await response.json()
    products.push(...(Array.isArray(data.products) ? data.products : []))
    pages = Math.max(1, Number(data.pages) || 1)
    page += 1
  } while (page <= pages)

  return products.filter((product) => product?.slug && product.isActive !== false)
}

function createUrlEntry({ changefreq, lastmod, path, priority }) {
  const location = new URL(path, SITE_URL).toString()
  return [
    '  <url>',
    '    <loc>' + escapeXml(location) + '</loc>',
    lastmod ? '    <lastmod>' + escapeXml(lastmod) + '</lastmod>' : '',
    '    <changefreq>' + changefreq + '</changefreq>',
    '    <priority>' + priority + '</priority>',
    '  </url>',
  ].filter(Boolean).join('\n')
}

export default async function handler(_request, response) {
  let productRoutes = []

  try {
    const products = await getActiveProducts()
    productRoutes = products.map((product) => ({
      path: '/shop/' + encodeURIComponent(product.slug),
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString() : undefined,
    }))
  } catch {
    // Static routes remain available if the product API is temporarily unavailable.
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...staticRoutes, ...productRoutes].map(createUrlEntry),
    '</urlset>',
  ].join('\n')

  response.setHeader('Content-Type', 'application/xml; charset=utf-8')
  response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  response.status(200).send(xml)
}
