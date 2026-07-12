import { NavLink, useNavigate } from 'react-router-dom'
import { logoutAdmin } from '../../services/authService'

const sidebarLinks = [
  { label: 'Overview', to: '/admin/dashboard' },
  { label: 'Products', to: '/admin/products' },
  { label: 'Add Product', to: '/admin/products/add' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Newsletter', to: '/admin/newsletter' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Custom Orders', to: '/admin/custom-orders' },
  { label: 'Enquiries', to: '/admin/enquiries' },
  { label: 'Payments', to: '/admin/payments' },
  { label: 'Email Logs', to: '/admin/email-logs' },
  { label: 'AI Assistant', to: '/admin/ai-assistant' },
  { label: 'Reviews', to: '/admin/reviews' },
  { label: 'Settings', to: '/admin/settings' },
]

function AdminSidebar({ onNavigate }) {
  const navigate = useNavigate()

  const logout = () => {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  return (
    <aside className="h-full bg-black/95 px-5 py-5 text-white backdrop-blur-xl lg:border-r lg:border-white/10 lg:px-6">
      <div className="flex h-full flex-col gap-5">
        <div>
          <p className="font-serif text-2xl text-white">Nebeda Threads</p>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-[var(--color-gold)]">
            Admin
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sidebarLinks.map((link) => (
            <NavLink
              className={({ isActive }) =>
                [
                  'rounded-2xl border px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] transition duration-300',
                  isActive
                    ? 'border-[rgba(190,151,83,0.58)] bg-[rgba(190,151,83,0.12)] text-[var(--color-gold)]'
                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-[rgba(190,151,83,0.5)] hover:text-[var(--color-gold)]',
                ].join(' ')
              }
              key={link.to}
              onClick={onNavigate}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition duration-300 hover:border-[rgba(190,151,83,0.5)] hover:text-[var(--color-gold)]"
          onClick={logout}
          type="button"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
