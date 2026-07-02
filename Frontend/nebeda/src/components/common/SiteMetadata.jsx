import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getProductBySlug } from '../../services/productService'

const SITE_URL = 'https://nebedathreads.co.uk'
const DEFAULT_IMAGE = SITE_URL + '/logo.png'
const INSTAGRAM_URL = 'https://www.instagram.com/nebeda_threads_luxury_fashion'

const organizationSchema = {
  '@type': 'Organization',
  '@id': SITE_URL + '/#organization',
  name: 'Nebeda Threads',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: DEFAULT_IMAGE,
  },
  email: 'hello@nebedathreads.co.uk',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@nebedathreads.co.uk',
      telephone: '+447448668759',
      areaServed: ['GB', 'NG'],
      availableLanguage: ['English'],
    },
  ],
  sameAs: [INSTAGRAM_URL],
}

const websiteSchema = {
  '@type': 'WebSite',
  '@id': SITE_URL + '/#website',
  name: 'Nebeda Threads',
  url: SITE_URL,
  publisher: { '@id': SITE_URL + '/#organization' },
  inLanguage: 'en-GB',
}

const pageMetadata = {
  '/': {
    title: 'Nebeda Threads | Luxury African Fashion UK',
    description: 'Discover luxury African fashion for men and women, crafted in the United Kingdom and delivered worldwide.',
    schemas: [organizationSchema, websiteSchema],
  },
  '/shop': {
    title: 'Shop African Clothing UK | Nebeda Threads',
    description: 'Shop Nebeda Threads ready-to-wear, bespoke, and wedding collections for men and women in the UK and worldwide.',
  },
  '/custom-order': {
    title: 'Bespoke African Clothing UK | Nebeda Threads',
    description: 'Request a bespoke Nebeda Threads garment designed around your style, measurements, and occasion.',
  },
  '/about': {
    title: 'About Nebeda Threads | Luxury African Fashion',
    description: 'Learn about Nebeda Threads, a UK-based luxury African fashion brand founded by Benjamen Oyekan.',
  },
  '/contact': {
    title: 'Contact Nebeda Threads | African Fashion UK',
    description: 'Contact Nebeda Threads about orders, delivery, collaborations, and styling enquiries.',
    schemas: [organizationSchema],
  },
  '/cart': {
    title: 'Shopping Cart | Nebeda Threads',
    description: 'Review the Nebeda Threads pieces selected for your order.',
    index: false,
  },
  '/checkout': {
    title: 'Secure Checkout | Nebeda Threads',
    description: 'Complete your Nebeda Threads delivery details and continue to secure payment.',
    index: false,
  },
  '/shipping-information': {
    title: 'UK and International Shipping | Nebeda Threads',
    description: 'Review Nebeda Threads UK, European, USA, Canada, and worldwide delivery information.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Nebeda Threads',
    description: 'Read how Nebeda Threads handles customer, order, enquiry, and newsletter information.',
  },
  '/terms': {
    title: 'Terms and Conditions | Nebeda Threads',
    description: 'Read the Nebeda Threads website, account, product order, and custom order terms.',
  },
  '/shipping-returns': {
    title: 'Returns and Refund Policy | Nebeda Threads',
    description: 'Review Nebeda Threads shipping, returns, measurements, and custom garment guidance.',
  },
  '/login': {
    title: 'Customer Login | Nebeda Threads',
    description: 'Sign in to your Nebeda Threads customer account.',
    index: false,
  },
  '/signup': {
    title: 'Create an Account | Nebeda Threads',
    description: 'Create a Nebeda Threads customer account to complete purchases and track orders.',
    index: false,
  },
  '/forgot-password': {
    title: 'Forgot Password | Nebeda Threads',
    description: 'Request a secure password reset for your Nebeda Threads account.',
    index: false,
  },
}

function setMeta(selector, attribute, value, content) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, value)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(url) {
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

function setStructuredData(schemas) {
  const existing = document.head.querySelector('#nebeda-structured-data')
  if (!schemas?.length) {
    existing?.remove()
    return
  }

  const script = existing || document.createElement('script')
  script.id = 'nebeda-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemas,
  })
  if (!existing) document.head.appendChild(script)
}

function applyMetadata({
  canonicalPath,
  description,
  image = DEFAULT_IMAGE,
  index = true,
  schemas = [],
  title,
  type = 'website',
}) {
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString()

  document.title = title
  setCanonical(canonicalUrl)
  setMeta('meta[name="description"]', 'name', 'description', description)
  setMeta('meta[name="robots"]', 'name', 'robots', index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow')
  setMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
  setMeta('meta[property="og:type"]', 'property', 'og:type', type)
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Nebeda Threads')
  setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'en_GB')
  setMeta('meta[property="og:image"]', 'property', 'og:image', image)
  setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', title)
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)
  setMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', title)
  setStructuredData(schemas)
}

function getStaticMetadata(pathname) {
  if (pathname.startsWith('/reset-password/')) {
    return {
      title: 'Reset Password | Nebeda Threads',
      description: 'Set a new password for your Nebeda Threads customer account.',
      index: false,
    }
  }
  if (pathname === '/verify-email') {
    return {
      title: 'Verify Email | Nebeda Threads',
      description: 'Confirm the email address linked to your Nebeda Threads customer account.',
      index: false,
    }
  }
  if (pathname.startsWith('/payment/')) {
    return {
      title: pathname.endsWith('/success') ? 'Payment Successful | Nebeda Threads' : 'Payment Cancelled | Nebeda Threads',
      description: 'Review the payment status for your Nebeda Threads order.',
      index: false,
    }
  }
  return pageMetadata[pathname]
}

function createProductSchemas(product, canonicalUrl, image) {
  const amount = Number(product.priceAmount ?? product.numericPrice)
  const canPurchase = product.isQuoteOnly !== true && Number.isFinite(amount) && amount > 0
  const productSchema = {
    '@type': 'Product',
    '@id': canonicalUrl + '#product',
    name: product.name,
    description: product.shortDescription || product.description,
    image: (product.images || []).map((item) => item.url).filter(Boolean).length
      ? product.images.map((item) => item.url).filter(Boolean)
      : [image],
    sku: product.slug,
    brand: { '@id': SITE_URL + '/#organization' },
    category: product.displayCategory,
    ...(canPurchase && {
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: product.currency || 'GBP',
        price: amount.toFixed(2),
        availability: product.trackInventory && Number(product.inventory) <= 0
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    }),
  }

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    '@id': canonicalUrl + '#breadcrumb',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL + '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: SITE_URL + '/shop',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  }

  return [organizationSchema, productSchema, breadcrumbSchema]
}

function SiteMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    let active = true
    const normalizedPath = pathname !== '/' ? pathname.replace(/\/$/, '') : '/'

    if (normalizedPath.startsWith('/shop/')) {
      const slug = decodeURIComponent(normalizedPath.slice('/shop/'.length))
      applyMetadata({
        canonicalPath: normalizedPath,
        title: 'Product | Nebeda Threads',
        description: 'View this Nebeda Threads luxury African fashion piece.',
        index: false,
      })

      getProductBySlug(slug)
        .then(({ product }) => {
          if (!active || !product) return
          const canonicalUrl = new URL('/shop/' + product.slug, SITE_URL).toString()
          const image = product.mainImage?.url || product.images?.[0]?.url || DEFAULT_IMAGE
          const description = product.shortDescription || product.description
          applyMetadata({
            canonicalPath: '/shop/' + product.slug,
            description,
            image,
            schemas: createProductSchemas(product, canonicalUrl, image),
            title: product.name + ' | Nebeda Threads',
            type: 'product',
          })
        })
        .catch(() => {
          // The product page handles unavailable products; metadata remains noindex.
        })

      return () => {
        active = false
      }
    }

    const metadata = getStaticMetadata(normalizedPath)
    const isPrivate = normalizedPath.startsWith('/admin') || normalizedPath.startsWith('/account')
    applyMetadata({
      canonicalPath: metadata ? normalizedPath : '/',
      description: metadata?.description || 'Luxury African fashion crafted for identity, elegance, and confidence.',
      index: metadata?.index ?? Boolean(metadata && !isPrivate),
      schemas: metadata?.schemas || [],
      title: metadata?.title || 'Nebeda Threads',
    })

    return () => {
      active = false
    }
  }, [pathname])

  return null
}

export { SITE_URL }
export default SiteMetadata
