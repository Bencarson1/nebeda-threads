import { useCallback, useEffect, useMemo, useState } from 'react'
import productFallback from '../assets/images/products/product-1.jpg'
import { CartContext } from './cartContextValue'
import { getCartItemId, loadStoredCart, parsePriceValue, saveStoredCart } from '../services/cartService'
import { cleanOption } from '../utils/productOptions'
import { trackAddToCart } from '../utils/analytics'

function getProductImage(product) {
  const mainImage = product.mainImage?.url
  const firstImage = product.images?.[0]?.url
  if (typeof mainImage === 'string' && mainImage.startsWith('http')) return mainImage
  if (typeof firstImage === 'string' && firstImage.startsWith('http')) return firstImage
  return productFallback
}

function createCartItem(product, selection = {}) {
  const selectedSize = cleanOption(selection.selectedSize)
  const selectedColour = cleanOption(selection.selectedColour)
  const productId = product._id || product.id
  return {
    cartItemId: getCartItemId(productId, selectedSize, selectedColour),
    productId,
    name: product.name,
    price: product.displayPrice || product.price || 'Price pending',
    priceAmount: parsePriceValue(product),
    numericPrice: parsePriceValue(product),
    currency: product.currency === 'EUR' ? 'EUR' : 'GBP',
    image: getProductImage(product),
    displayCategory: product.displayCategory || 'Nebeda Threads',
    selectedSize,
    selectedColour,
    availableSizes: Array.isArray(product.sizes) ? product.sizes.map(cleanOption).filter(Boolean) : [],
    availableColours: Array.isArray(product.colors) ? product.colors.map(cleanOption).filter(Boolean) : [],
    requiresSelectionUpdate: false,
    quantity: 1,
  }
}

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => loadStoredCart())
  useEffect(() => saveStoredCart(cartItems), [cartItems])

  const addToCart = useCallback((product, selection) => {
    const nextItem = createCartItem(product, selection)
    trackAddToCart(nextItem)
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.cartItemId === nextItem.cartItemId)
      return existingItem
        ? currentItems.map((item) => item.cartItemId === nextItem.cartItemId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...currentItems, nextItem]
    })
  }, [])

  const removeFromCart = useCallback((cartItemId) => setCartItems((items) => items.filter((item) => item.cartItemId !== cartItemId)), [])
  const increaseQuantity = useCallback((cartItemId) => setCartItems((items) => items.map((item) => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item)), [])
  const decreaseQuantity = useCallback((cartItemId) => setCartItems((items) => items.map((item) => item.cartItemId === cartItemId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item)), [])
  const clearCart = useCallback(() => setCartItems([]), [])

  const subtotal = useMemo(() => cartItems.reduce((total, item) => total + Number(item.priceAmount ?? item.numericPrice ?? 0) * item.quantity, 0), [cartItems])
  const totalItems = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems])
  const getCartTotal = useCallback(() => subtotal, [subtotal])
  const getCartCount = useCallback(() => totalItems, [totalItems])
  const value = useMemo(() => ({ addToCart, cartItems, clearCart, decreaseQuantity, getCartCount, getCartTotal, increaseQuantity, removeFromCart, subtotal, totalItems }), [addToCart, cartItems, clearCart, decreaseQuantity, getCartCount, getCartTotal, increaseQuantity, removeFromCart, subtotal, totalItems])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export { CartProvider }
