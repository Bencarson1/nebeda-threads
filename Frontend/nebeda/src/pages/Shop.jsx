import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import productOne from '../assets/images/products/product-1.jpg'
import { useCart } from '../context/cartContextValue'
import { useToast } from '../components/ui/toastContext'
import { findAvailableOption } from '../utils/productOptions'
import { getProducts } from '../services/productService'
import { getWhatsAppProductLink, whatsappLink } from '../data/contactDetails'

const filters = ['All', 'Men', 'Women', 'Ready to Wear', 'Bespoke', 'Wedding']
const productsPerPage = 6

function getProductImage(product) {
  const mainImage = product.mainImage?.url
  const firstImage = product.images?.[0]?.url

  if (typeof mainImage === 'string' && mainImage.startsWith('http')) return mainImage
  if (typeof firstImage === 'string' && firstImage.startsWith('http')) return firstImage
  return productOne
}

function ProductCard({ product, index, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColour, setSelectedColour] = useState('')
  const isQuoteOnly = product.isQuoteOnly === true
  const isOutOfStock = product.trackInventory && Number(product.inventory) <= 0

  return (
    <motion.article
      className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.045)] shadow-[0_24px_80px_rgba(0,0,0,0.32)] transition duration-500 hover:-translate-y-1 hover:border-[rgba(190,151,83,0.66)] hover:shadow-[0_30px_90px_rgba(190,151,83,0.14)]"
      initial={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.65, ease: 'easeOut', delay: index * 0.05 }}
      viewport={{ once: true, amount: 0.18 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="relative h-[320px] overflow-hidden bg-black sm:h-[360px] lg:h-[400px]">
        <img
          alt={product.mainImage?.alt || product.name}
          className="h-full w-full object-cover object-[center_18%] transition duration-700 ease-out group-hover:scale-[1.025]"
          loading="lazy"
          src={getProductImage(product)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.52),rgba(0,0,0,0.06)_58%,rgba(0,0,0,0.02))]" />
        <div className="absolute left-4 top-4 rounded-full border border-[rgba(190,151,83,0.5)] bg-black/55 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)] backdrop-blur">
          {product.badge}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
          {product.displayCategory}
        </p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <h3 className="min-w-0 font-serif text-2xl leading-tight text-white">{product.name}</h3>
          <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-[var(--color-cream)]">
            {product.displayPrice || product.price}
          </p>
        </div>

        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          {product.shortDescription || product.description}
        </p>

        {!isQuoteOnly && (product.sizes?.length || product.colors?.length) ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {product.sizes?.length ? (
              <label className="text-xs font-semibold uppercase tracking-[.16em] text-white/58">Size
                <select className="mt-2 w-full rounded-xl border border-white/10 bg-black/55 px-3 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--color-gold)]" onChange={(event) => setSelectedSize(event.target.value)} value={selectedSize}>
                  <option value="">Select size</option>{product.sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            ) : null}
            {product.colors?.length ? (
              <label className="text-xs font-semibold uppercase tracking-[.16em] text-white/58">Colour
                <select className="mt-2 w-full rounded-xl border border-white/10 bg-black/55 px-3 py-3 text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--color-gold)]" onChange={(event) => setSelectedColour(event.target.value)} value={selectedColour}>
                  <option value="">Select colour</option>{product.colors.map((colour) => <option key={colour} value={colour}>{colour}</option>)}
                </select>
              </label>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {isQuoteOnly ? (
            <Button className="px-4 py-2.5 text-[11px]" to="/custom-order" variant="outline">Request Quote</Button>
          ) : isOutOfStock ? (
            <Button className="px-4 py-2.5 text-[11px]" disabled variant="outline">Out of Stock</Button>
          ) : (
            <Button className="px-4 py-2.5 text-[11px]" onClick={() => onAddToCart(product, { selectedColour, selectedSize })} variant="outline">Add to Cart</Button>
          )}
          <Button
            className="px-4 py-2.5 text-[11px]"
            href={getWhatsAppProductLink(product.name)}
            rel="noreferrer"
            target="_blank"
            variant="primary"
          >
            WhatsApp Enquiry
          </Button>
        </div>
      </div>
    </motion.article>
  )
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Product pagination"
      className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row"
    >
      <p className="text-xs uppercase tracking-[0.24em] text-white/52">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-[rgba(190,151,83,0.72)] hover:text-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-35"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
          const isActive = page === currentPage

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              className={[
                'grid size-10 place-items-center rounded-full border text-sm font-semibold transition',
                isActive
                  ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-black'
                  : 'border-white/12 text-white/72 hover:border-[rgba(190,151,83,0.72)] hover:text-[var(--color-gold)]',
              ].join(' ')}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          )
        })}
        <button
          className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-[rgba(190,151,83,0.72)] hover:text-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-35"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </nav>
  )
}

function Shop() {
  const { addToCart, cartItems } = useCart()
  const { showToast } = useToast()
  const [activeFilter, setActiveFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      setIsLoading(true)
      setError('')

      try {
        const params =
          activeFilter === 'All'
            ? { page: 1, limit: 48 }
            : { category: activeFilter, page: 1, limit: 48 }
        const data = await getProducts(params)

        if (isMounted) {
          setProducts(data.products || [])
          setCurrentPage(1)
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message || 'Unable to load products.')
          setProducts([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [activeFilter])

  const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage))
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage
    return products.slice(start, start + productsPerPage)
  }, [currentPage, products])

  const setFilter = (filter) => {
    setActiveFilter(filter)
    setCurrentPage(1)
  }

  const handleAddToCart = (product, selection) => {
    const selectedSize = findAvailableOption(product.sizes, selection.selectedSize)
    const selectedColour = findAvailableOption(product.colors, selection.selectedColour)
    const cartCurrency = cartItems[0]?.currency
    if (cartCurrency && cartCurrency !== product.currency) {
      showToast({ message: 'GBP and EUR products must be checked out separately.', type: 'error' })
      return
    }
    if (product.sizes?.length && !selection.selectedSize) {
      showToast({ message: 'Please select a size.', type: 'error' })
      return
    }
    if (product.sizes?.length && !selectedSize) {
      showToast({ message: 'This size is not available.', type: 'error' })
      return
    }
    if (product.colors?.length && !selection.selectedColour) {
      showToast({ message: 'Please select a colour.', type: 'error' })
      return
    }
    if (product.colors?.length && !selectedColour) {
      showToast({ message: 'This colour is not available.', type: 'error' })
      return
    }
    addToCart(product, { selectedSize, selectedColour })
    showToast({ message: 'Added to cart successfully.', type: 'success' })
  }

  return (
    <main className="overflow-hidden bg-black text-white">
      <section className="relative px-5 py-20 sm:px-8 md:py-24 lg:px-10 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(190,151,83,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_34%)]" />
        <div className="relative mx-auto max-w-7xl 2xl:max-w-[1500px]">
          <motion.div
            className="max-w-4xl"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
          >
            <div className="mb-7 h-px w-20 bg-[var(--color-gold)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--color-gold)]">
              SHOP NEBEDA
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-tight text-[var(--color-soft-white)] sm:text-5xl lg:text-7xl">
              Luxury African Fashion for Every Occasion
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              Explore men&rsquo;s and women&rsquo;s African fashion, from ready to wear pieces to bespoke
              designs crafted for weddings, celebrations, and everyday elegance.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button onClick={() => setFilter('Ready to Wear')} variant="primary">
                View Ready to Wear
              </Button>
              <Button to="/custom-order" variant="outline">
                Start Bespoke Order
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-7xl 2xl:max-w-[1500px]">
          <div className="flex gap-3 overflow-x-auto border-y border-white/10 py-6 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
            {filters.map((filter) => {
              const isActive = activeFilter === filter

              return (
                <button
                  className={[
                    'shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition duration-300',
                    isActive
                      ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-black'
                      : 'border-white/12 bg-white/[0.03] text-white/72 hover:border-[rgba(190,151,83,0.72)] hover:text-[var(--color-gold)]',
                  ].join(' ')}
                  key={filter}
                  onClick={() => setFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <motion.div
              className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-6 py-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <p className="font-serif text-3xl text-white">Loading Nebeda pieces...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              className="mt-10 rounded-[1.5rem] border border-[rgba(190,151,83,0.42)] bg-[rgba(190,151,83,0.1)] px-6 py-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <p className="font-serif text-3xl text-white">Unable to load products.</p>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                {error}
              </p>
            </motion.div>
          ) : products.length > 0 ? (
            <>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {paginatedProducts.map((product, index) => (
                  <ProductCard
                    index={index}
                    key={product._id}
                    onAddToCart={handleAddToCart}
                    product={product}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                totalPages={totalPages}
              />
            </>
          ) : (
            <motion.div
              className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-6 py-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <p className="font-serif text-3xl text-white">No pieces found in this collection yet.</p>
              <Button className="mt-7" to="/custom-order" variant="primary">
                Start Custom Order
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <motion.div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-[rgba(190,151,83,0.38)] bg-[linear-gradient(135deg,rgba(243,234,217,0.1),rgba(255,255,255,0.035))] px-6 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.34)] sm:px-10 lg:px-14 2xl:max-w-[1500px]"
          initial={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.35 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(190,151,83,0.18),transparent_30%)]" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
              Bespoke Service
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-white sm:text-5xl">
              Need a Piece Made Just for You?
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              Start a bespoke order and let Nebeda Threads create a garment around your style,
              measurements, fabric choice, and occasion.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button to="/custom-order" variant="primary">
                Start Custom Order
              </Button>
              <Button
                href={whatsappLink}
                rel="noreferrer"
                target="_blank"
                variant="outline"
              >
                Chat on WhatsApp
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}

export default Shop
