import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getCurrentAdmin, logoutAdmin } from '../../services/authService'
import { email, instagramHandle, instagramUrl, whatsappNumber } from '../../data/contactDetails'

function formatDate(value) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function SettingRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
        {label}
      </p>
      <p className="mt-3 break-words text-white">{value}</p>
    </div>
  )
}

function AdminSettings() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(() => {
    const storedAdmin = localStorage.getItem('nebedaAdmin')
    return storedAdmin ? JSON.parse(storedAdmin) : null
  })
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadAdmin() {
      try {
        const data = await getCurrentAdmin()
        if (isMounted) setAdmin(data.admin)
      } catch (apiError) {
        if (apiError.status === 401) {
          logoutAdmin()
          navigate('/admin/login', { replace: true })
          return
        }
        if (isMounted) setError(apiError.message || 'Unable to load admin profile.')
      }
    }

    loadAdmin()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <AdminLayout subtitle="Admin profile and Nebeda Threads business information.">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">
          Settings
        </p>
        <h2 className="mt-3 font-serif text-4xl text-white">Admin Settings</h2>
      </div>

      {error ? <p className="mt-6 rounded-2xl border border-[rgba(190,151,83,0.42)] bg-[rgba(190,151,83,0.1)] px-5 py-4 text-sm text-[var(--color-cream)]">{error}</p> : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
            Admin Profile
          </p>
          <div className="mt-5 grid gap-4">
            <SettingRow label="Admin Name" value={admin?.name || 'Not available'} />
            <SettingRow label="Admin Email" value={admin?.email || 'Not available'} />
            <SettingRow label="Role" value={admin?.role || 'admin'} />
            <SettingRow label="Last Login" value={formatDate(admin?.lastLogin)} />
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[rgba(190,151,83,0.38)] bg-[rgba(190,151,83,0.08)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
            Business Settings
          </p>
          <div className="mt-5 grid gap-4">
            <SettingRow label="Brand Name" value="Nebeda Threads" />
            <SettingRow label="WhatsApp Number" value={whatsappNumber} />
            <SettingRow label="Instagram Handle" value={instagramHandle} />
            <SettingRow label="Instagram URL" value={instagramUrl} />
            <SettingRow label="Contact Email" value={email} />
            <SettingRow label="Shipping Regions" value="United Kingdom, Nigeria, Worldwide" />
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

export default AdminSettings
