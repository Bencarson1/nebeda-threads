import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import ProductReviews from '../components/reviews/ProductReviews'
import productFallback from '../assets/images/products/product-1.jpg'
import { useCart } from '../context/cartContextValue'
import { useToast } from '../components/ui/toastContext'
import { getWhatsAppProductLink } from '../data/contactDetails'
import { getProductBySlug } from '../services/productService'
import { findAvailableOption } from '../utils/productOptions'
import { trackViewItem } from '../utils/analytics'

function getProductImage(product) {
  const image = product?.mainImage?.url || product?.images?.[0]?.url
  return typeof image === 'string' && image.startsWith('http') ? image : productFallback
}

function ProductDetails() {
  const { slug } = useParams()
  const { addToCart, cartItems } = useCart()
  const { showToast } = useToast()
  const [requestState, setRequestState] = useState(() => ({
    slug,
    product: null,
    isLoading: true,
    error: '',
  }))
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColour, setSelectedColour] = useState('')
  const isLoading = requestState.slug !== slug || requestState.isLoading
  const product = requestState.slug === slug ? requestState.product : null
  const error = requestState.slug === slug ? requestState.error : ''

  useEffect(() => {
    let active = true
    getProductBySlug(slug)
      .then((data) => {
        if (active) {
          trackViewItem(data.product)
          setRequestState({ slug, product: data.product, isLoading: false, error: '' })
        }
      })
      .catch((apiError) => {
        if (active) {
          setRequestState({
            slug,
            product: null,
            isLoading: false,
            error: apiError.message || 'This product is currently unavailable.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [slug])

  const addSelectedProduct = () => {
    const size = findAvailableOption(product.sizes, selectedSize)
    const colour = findAvailableOption(product.colors, selectedColour)

    if (product.sizes?.length && !selectedSize) {
      showToast({ message: 'Please select a size.', type: 'error' })
      return
    }
    if (product.sizes?.length && !size) {
      showToast({ message: 'This size is not available.', type: 'error' })
      return
    }
    if (product.colors?.length && !selectedColour) {
      showToast({ message: 'Please select a colour.', type: 'error' })
      return
    }
    if (product.colors?.length && !colour) {
      showToast({ message: 'This colour is not available.', type: 'error' })
      return
    }

    const cartCurrency = cartItems[0]?.currency
    if (cartCurrency && cartCurrency !== product.currency) {
      showToast({ message: 'GBP and EUR products must be checked out separately.', type: 'error' })
      return
    }

    addToCart(product, { selectedSize: size, selectedColour: colour })
    showToast({ message: 'Added to cart successfully.', type: 'success' })
  }

  if (isLoading) {
    return (
      <main className="min-h-[65vh] bg-black px-5 py-20 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-8">
          <div className="h-8 w-48 rounded bg-white/10" />
          <div className="mt-8 h-[28rem] rounded-2xl bg-white/10" />
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="min-h-[65vh] bg-black px-5 py-20 text-center text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-8 sm:p-12">
          <h1 className="font-serif text-4xl">Product unavailable</h1>
          <p className="mt-5 text-[var(--color-muted)]">{error}</p>
          <Button className="mt-8" to="/shop" variant="primary">Shop Collection</Button>
        </div>
      </main>
    )
  }

  const isQuoteOnly = product.isQuoteOnly === true
  const isOutOfStock = product.trackInventory && Number(product.inventory) <= 0

  return (
    <main className="bg-black px-5 py-14 text-white sm:px-8 lg:px-10 lg:py-20">
      <article className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/50">
          <Link className="transition hover:text-[var(--color-gold)]" to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link className="transition hover:text-[var(--color-gold)]" to="/shop">Shop</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--color-gold)]">{product.name}</span>
        </nav>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04]"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.55 }}
          >
            <img
              alt={product.mainImage?.alt || product.name + ' by Nebeda Threads'}
              className="aspect-[4/5] h-auto w-full object-cover object-[center_18%]"
              decoding="async"
              fetchPriority="high"
              src={getProductImage(product)}
            />
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-gold)]">{product.displayCategory}</p>
            <h1 className="mt-4 break-words font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">{product.name}</h1>
            <p className="mt-5 text-xl font-semibold text-[var(--color-cream)]">{product.displayPrice || product.price}</p>
            <p className="mt-7 text-base leading-8 text-[var(--color-muted)]">{product.description || product.shortDescription}</p>

            {!isQuoteOnly && (product.sizes?.length || product.colors?.length) ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {product.sizes?.length ? (
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-white/62">
                    Size
                    <select className="mt-2 w-full rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--color-gold)]" onChange={(event) => setSelectedSize(event.target.value)} value={selectedSize}>
                      <option value="">Select size</option>
                      {product.sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </label>
                ) : null}
                {product.colors?.length ? (
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-white/62">
                    Colour
                    <select className="mt-2 w-full rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--color-gold)]" onChange={(event) => setSelectedColour(event.target.value)} value={selectedColour}>
                      <option value="">Select colour</option>
                      {product.colors.map((colour) => <option key={colour} value={colour}>{colour}</option>)}
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {isQuoteOnly ? (
                <Button to="/custom-order" variant="outline">Request Quote</Button>
              ) : isOutOfStock ? (
                <Button disabled variant="outline">Out of Stock</Button>
              ) : (
                <Button onClick={addSelectedProduct} variant="primary">Add to Cart</Button>
              )}
              <Button href={getWhatsAppProductLink(product.name)} rel="noreferrer" target="_blank" variant="outline">WhatsApp Enquiry</Button>
            </div>
          </motion.div>
        </div>
        <ProductReviews productId={product._id} />
      </article>
    </main>
  )
}

export default ProductDetails
