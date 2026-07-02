import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import Button from '../ui/Button'
import { navLinks } from '../../data/navLinks'
import logo from '../../assets/images/logo.png'
import { useCart } from '../../context/cartContextValue'
import { whatsappLink } from '../../data/contactDetails'
import { isAdminAuthenticated } from '../../services/authService'
import { getStoredUser, isUserAuthenticated, logoutUser } from '../../services/userAuthService'
import { useToast } from '../ui/toastContext'

const desktopNavClass = ({ isActive }) =>
  [
    'group relative py-2 text-sm uppercase tracking-[0.16em] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[var(--color-gold)]',
    isActive
      ? 'font-semibold text-[var(--color-gold)]'
      : 'font-medium text-white/74 hover:text-[var(--color-gold)]',
  ].join(' ')

const mobileNavClass = ({ isActive }) =>
  [
    'rounded-r-full border-l px-4 py-3 text-sm uppercase tracking-[0.18em] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]',
    isActive
      ? 'border-[var(--color-gold)] bg-[rgba(190,151,83,0.12)] font-semibold text-[var(--color-gold)]'
      : 'border-transparent font-medium text-white/76 hover:border-[rgba(190,151,83,0.55)] hover:bg-white/5 hover:text-[var(--color-gold)]',
  ].join(' ')

function CartIconLink({ onClick, totalItems }) {
  const countLabel = totalItems > 99 ? '99+' : String(totalItems)

  return (
    <NavLink
      aria-label={totalItems ? `View cart with ${totalItems} items` : 'View cart'}
      className={({ isActive }) => [
        'relative grid size-11 shrink-0 place-items-center rounded-full border transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-gold)]',
        isActive
          ? 'border-[var(--color-gold)] bg-[rgba(190,151,83,0.12)] text-[var(--color-gold)]'
          : 'border-white/15 text-white/78 hover:border-[rgba(190,151,83,0.72)] hover:text-[var(--color-gold)]',
      ].join(' ')}
      onClick={onClick}
      title="Shopping cart"
      to="/cart"
    >
      <ShoppingBag aria-hidden="true" size={20} strokeWidth={1.8} />
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-black bg-[var(--color-gold)] px-1 text-[10px] font-bold leading-none text-black">
          {countLabel}
        </span>
      ) : null}
    </NavLink>
  )
}

function Navbar() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { totalItems } = useCart()
  const dropdownRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [user, setUser] = useState(() => getStoredUser())
  const [adminLoggedIn, setAdminLoggedIn] = useState(() => isAdminAuthenticated())

  const userLoggedIn = Boolean(user) || isUserAuthenticated()
  const adminPath = adminLoggedIn ? '/admin/dashboard' : '/admin/login'

  const closeMenu = () => setIsOpen(false)
  const closeAccount = () => setIsAccountOpen(false)
  const closeAll = () => {
    closeMenu()
    closeAccount()
  }

  const handleCustomerLogout = () => {
    logoutUser()
    setUser(null)
    closeAll()
    showToast({ message: 'Logged out successfully.', type: 'success' })
    navigate('/')
  }

  useEffect(() => {
    const syncAuthState = () => {
      setUser(getStoredUser())
      setAdminLoggedIn(isAdminAuthenticated())
    }

    window.addEventListener('nebedaUserAuthChanged', syncAuthState)
    window.addEventListener('storage', syncAuthState)

    return () => {
      window.removeEventListener('nebedaUserAuthChanged', syncAuthState)
      window.removeEventListener('storage', syncAuthState)
    }
  }, [])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeAccount()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeAccount()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/78 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link
          className="group flex shrink-0 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-gold)]"
          onClick={closeAll}
          to="/"
        >
          <img
            alt="Nebeda Threads"
            className="h-12 w-auto max-w-[180px] object-contain opacity-100 transition duration-500 group-hover:drop-shadow-[0_0_18px_rgba(190,151,83,0.24)] sm:h-14 xl:h-16"
            src={logo}
          />
        </Link>

        <div className="hidden min-w-0 items-center gap-5 xl:flex xl:gap-7 2xl:gap-8">
          {navLinks.map((link) => (
            <NavLink className={desktopNavClass} key={link.path} to={link.path}>
              {({ isActive }) => (
                <>
                  <span className="whitespace-nowrap">{link.label}</span>
                  <span
                    className={[
                      'absolute bottom-0 left-0 h-px bg-[var(--color-gold)] transition-all duration-300',
                      isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100',
                    ].join(' ')}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <Button className="px-5" href={whatsappLink} rel="noreferrer" target="_blank" variant="outline">
            WhatsApp Order
          </Button>

          <div className="relative" ref={dropdownRef}>
            <button
              aria-expanded={isAccountOpen}
              aria-haspopup="menu"
              className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white/74 transition duration-300 hover:border-[rgba(190,151,83,0.72)] hover:text-[var(--color-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-gold)]"
              onClick={() => setIsAccountOpen((current) => !current)}
              type="button"
            >
              Account
            </button>

            {isAccountOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-2xl border border-[rgba(190,151,83,0.42)] bg-black/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"
                role="menu"
              >
                {userLoggedIn ? (
                  <>
                    <Link className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={closeAccount} role="menuitem" to="/account">Account Dashboard</Link>
                    <Link className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={closeAccount} role="menuitem" to="/account/orders">My Orders</Link>
                    <Link className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={closeAccount} role="menuitem" to="/account/custom-orders">Custom Orders</Link>
                    <Link className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={closeAccount} role="menuitem" to="/account/profile">Profile</Link>
                    <button className="block w-full rounded-xl px-4 py-3 text-left text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={handleCustomerLogout} role="menuitem" type="button">Logout</button>
                  </>
                ) : (
                  <>
                    <Link className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={closeAccount} role="menuitem" to="/login">Login</Link>
                    <Link className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={closeAccount} role="menuitem" to="/signup">Sign Up</Link>
                  </>
                )}
                <Link className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[var(--color-gold)]" onClick={closeAccount} role="menuitem" to={adminPath}>
                  {adminLoggedIn ? 'Admin Dashboard' : 'Admin Login'}
                </Link>
              </div>
            ) : null}
          </div>

          <CartIconLink onClick={closeAll} totalItems={totalItems} />
        </div>

        <div className="flex shrink-0 items-center gap-2 xl:hidden">
          <CartIconLink onClick={closeAll} totalItems={totalItems} />

        <button
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          className="flex size-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-white/15 text-white transition hover:border-[var(--color-gold)] xl:hidden"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className={`h-px w-5 bg-current transition ${isOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`h-px w-5 bg-current transition ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`h-px w-5 bg-current transition ${isOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
        </div>
      </nav>

      {isOpen ? (
        <div className="max-h-[calc(100vh-82px)] overflow-y-auto border-t border-white/10 bg-black/95 px-5 pb-6 pt-3 xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink className={mobileNavClass} key={link.path} onClick={closeAll} to={link.path}>
                {link.label}
              </NavLink>
            ))}
            <div className="my-3 border-t border-white/10 pt-4">
              <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-gold)]">
                Account
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {userLoggedIn ? (
                  <>
                    <NavLink className={mobileNavClass} onClick={closeAll} to="/account">Account Dashboard</NavLink>
                    <NavLink className={mobileNavClass} onClick={closeAll} to="/account/orders">My Orders</NavLink>
                    <NavLink className={mobileNavClass} onClick={closeAll} to="/account/custom-orders">Custom Orders</NavLink>
                    <NavLink className={mobileNavClass} onClick={closeAll} to="/account/profile">Profile</NavLink>
                    <button className="rounded-r-full border-l border-transparent px-4 py-3 text-left text-sm font-medium uppercase tracking-[0.18em] text-white/76 transition hover:border-[rgba(190,151,83,0.55)] hover:bg-white/5 hover:text-[var(--color-gold)]" onClick={handleCustomerLogout} type="button">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink className={mobileNavClass} onClick={closeAll} to="/login">Login</NavLink>
                    <NavLink className={mobileNavClass} onClick={closeAll} to="/signup">Sign Up</NavLink>
                  </>
                )}
                <NavLink className={mobileNavClass} onClick={closeAll} to={adminPath}>
                  {adminLoggedIn ? 'Admin Dashboard' : 'Admin Login'}
                </NavLink>
              </div>
            </div>

            <Button className="mt-3 w-full" href={whatsappLink} onClick={closeAll} rel="noreferrer" target="_blank" variant="primary">
              WhatsApp Order
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default Navbar
