import { cleanOption, findAvailableOption, normalizeOption } from '../utils/productOptions'

const CART_STORAGE_KEY = 'nebedaCart'

function getCartItemId(productId, selectedSize = '', selectedColour = '') {
  return [productId, normalizeOption(selectedSize) || '-', normalizeOption(selectedColour) || '-'].join('::')
}

function loadStoredCart() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY)
    const items = storedCart ? JSON.parse(storedCart) : []
    if (!Array.isArray(items)) return []
    return items.filter((item) => item?.productId).map((item) => {
      const storedSize = cleanOption(item.selectedSize ?? item.size)
      const storedColour = cleanOption(item.selectedColour ?? item.selectedColor ?? item.colour ?? item.color)
      const availableSizes = Array.isArray(item.availableSizes) ? item.availableSizes.map(cleanOption).filter(Boolean) : []
      const availableColours = Array.isArray(item.availableColours)
        ? item.availableColours.map(cleanOption).filter(Boolean)
        : []
      const selectedSize = availableSizes.length ? findAvailableOption(availableSizes, storedSize) : storedSize
      const selectedColour = availableColours.length ? findAvailableOption(availableColours, storedColour) : storedColour

      return {
        ...item,
        cartItemId: getCartItemId(item.productId, selectedSize, selectedColour),
        selectedSize,
        selectedColour,
        availableSizes,
        availableColours,
        requiresSelectionUpdate: Boolean(
          (availableSizes.length && !selectedSize) || (availableColours.length && !selectedColour)
        ),
      }
    })
  } catch {
    return []
  }
}

function saveStoredCart(cartItems) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
}

function parsePriceValue(product) {
  for (const candidate of [product.priceAmount, product.numericPrice]) {
    const amount = Number(candidate)
    if (Number.isFinite(amount) && amount > 0) return amount
  }
  const match = String(product.price || product.displayPrice || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : 0
}

export { CART_STORAGE_KEY, getCartItemId, loadStoredCart, parsePriceValue, saveStoredCart }
