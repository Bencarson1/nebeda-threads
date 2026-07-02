import Button from '../components/ui/Button'
import { useCart } from '../context/cartContextValue'
import { useToast } from '../components/ui/toastContext'

function formatAmount(value, currency = 'GBP') {
  return new Intl.NumberFormat(currency === 'EUR' ? 'en-IE' : 'en-GB', { style: 'currency', currency }).format(Number(value || 0))
}

function Cart() {
  const {
    cartItems,
    clearCart,
    decreaseQuantity,
    increaseQuantity,
    removeFromCart,
    subtotal,
    totalItems,
  } = useCart()
  const { showToast } = useToast()
  const cartCurrency = cartItems[0]?.currency === 'EUR' ? 'EUR' : 'GBP'

  const removeItem = (cartItemId) => {
    removeFromCart(cartItemId)
    showToast({ message: 'Removed from cart.', type: 'info' })
  }

  const increaseItem = (cartItemId) => {
    increaseQuantity(cartItemId)
    showToast({ message: 'Quantity updated.', type: 'success' })
  }

  const decreaseItem = (cartItemId) => {
    decreaseQuantity(cartItemId)
    showToast({ message: 'Quantity updated.', type: 'success' })
  }

  const clearItems = () => {
    clearCart()
    showToast({ message: 'Cart cleared.', type: 'warning' })
  }

  if (!cartItems.length) {
    return (
      <main className="bg-black px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <section className="mx-auto max-w-4xl rounded-[1.75rem] border border-white/10 bg-white/[0.045] px-6 py-16 text-center shadow-[0_28px_90px_rgba(0,0,0,0.3)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Cart
          </p>
          <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">Your cart is empty</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[var(--color-muted)]">
            Explore our collections and add pieces you love.
          </p>
          <Button className="mt-8" to="/shop" variant="primary">
            Continue Shopping
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="bg-black px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
      <section className="mx-auto max-w-7xl 2xl:max-w-[1500px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-gold)]">
              Cart
            </p>
            <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">Review Your Cart</h1>
          </div>
          <Button onClick={clearItems} variant="outline">Clear Cart</Button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-5">
            {cartItems.map((item) => (
              <article
                className="grid gap-5 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 sm:grid-cols-[8rem_1fr] sm:p-5"
                key={item.cartItemId}
              >
                <img
                  alt={item.name}
                  className="h-52 w-full rounded-2xl object-cover sm:h-32"
                  src={item.image}
                />
                <div className="min-w-0">
                  {item.requiresSelectionUpdate ? (
                    <div className="mb-4 rounded-xl border border-[rgba(190,151,83,0.55)] bg-[rgba(190,151,83,0.1)] p-3 text-sm text-[var(--color-cream)]">
                      <p>Please reselect size/colour for this item.</p>
                      <Button className="mt-3 px-4 py-2 text-[10px]" to="/shop" variant="outline">Update Selection</Button>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words font-serif text-2xl text-white">{item.name}</h2>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">{item.displayCategory}</p>
                      {(item.selectedColour || item.selectedSize) ? <p className="mt-2 text-xs text-white/55">{[item.selectedColour && `Colour: ${item.selectedColour}`, item.selectedSize && `Size: ${item.selectedSize}`].filter(Boolean).join(' · ')}</p> : null}
                    </div>
                    <p className="shrink-0 font-semibold text-[var(--color-cream)]">{item.price}</p>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-fit items-center overflow-hidden rounded-full border border-white/10">
                      <button
                        className="grid size-11 place-items-center text-white/72 transition hover:bg-white/10 hover:text-[var(--color-gold)]"
                        onClick={() => decreaseItem(item.cartItemId)}
                        type="button"
                      >
                        -
                      </button>
                      <span className="grid size-11 place-items-center border-x border-white/10 text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        className="grid size-11 place-items-center text-white/72 transition hover:bg-white/10 hover:text-[var(--color-gold)]"
                        onClick={() => increaseItem(item.cartItemId)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-white/62">
                        Subtotal: {formatAmount((item.priceAmount ?? item.numericPrice) * item.quantity, item.currency || cartCurrency)}
                      </p>
                      <Button className="px-4 py-2 text-[10px]" onClick={() => removeItem(item.cartItemId)} variant="outline">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[1.5rem] border border-[rgba(190,151,83,0.38)] bg-white/[0.055] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.3)] lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">
              Cart Summary
            </p>
            <div className="mt-6 space-y-4 border-y border-white/10 py-6">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/58">Items Count</span>
                <span className="font-semibold text-white">{totalItems}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/58">Subtotal</span>
                <span className="font-semibold text-white">{formatAmount(subtotal, cartCurrency)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-white/58">Delivery</span>
                <span className="font-semibold text-white">Calculated later</span>
              </div>
              <div className="flex justify-between gap-4 text-base">
                <span className="text-white">Total</span>
                <span className="font-semibold text-[var(--color-gold)]">{formatAmount(subtotal, cartCurrency)}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              {cartItems.some((item) => item.requiresSelectionUpdate) ? (
                <Button to="/shop" variant="primary">Update Item Selection</Button>
              ) : (
                <Button to="/checkout" variant="primary">Proceed To Checkout</Button>
              )}
              <Button to="/shop" variant="outline">Continue Shopping</Button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default Cart
