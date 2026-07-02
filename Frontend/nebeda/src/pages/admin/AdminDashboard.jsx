import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'
import DashboardCard from '../../components/admin/DashboardCard'
import Button from '../../components/ui/Button'
import { logoutAdmin } from '../../services/authService'
import { getDashboardActivity, getDashboardStats } from '../../services/dashboardService'

const activityPageSizes = [10, 25, 50]

function formatDate(value) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activityPage, setActivityPage] = useState(1)
  const [activityPageSize, setActivityPageSize] = useState(10)
  const [activityData, setActivityData] = useState({ activities: [], page: 1, pages: 1, total: 0 })
  const [isActivityLoading, setIsActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState('')

  const handleUnauthorized = useCallback(() => {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }, [navigate])

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getDashboardStats()
      setDashboardData(data)
    } catch (apiError) {
      if (apiError.status === 401) {
        handleUnauthorized()
        return
      }
      setError(apiError.message || 'Unable to load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }, [handleUnauthorized])

  const loadActivity = useCallback(async () => {
    setIsActivityLoading(true)
    setActivityError('')

    try {
      const data = await getDashboardActivity({ page: activityPage, limit: activityPageSize })
      setActivityData({
        activities: data.activities || [],
        page: data.page || 1,
        pages: Math.max(1, data.pages || 1),
        total: data.total || 0,
      })
    } catch (apiError) {
      if (apiError.status === 401) {
        handleUnauthorized()
        return
      }
      setActivityError(apiError.message || 'Unable to load recent activity.')
    } finally {
      setIsActivityLoading(false)
    }
  }, [activityPage, activityPageSize, handleUnauthorized])

  useEffect(() => {
    const timer = window.setTimeout(loadDashboardData, 0)
    return () => window.clearTimeout(timer)
  }, [loadDashboardData])

  useEffect(() => {
    const timer = window.setTimeout(loadActivity, 0)
    return () => window.clearTimeout(timer)
  }, [loadActivity])

  const dashboardStats = useMemo(() => {
    const stats = dashboardData?.stats || {}

    return [
      { label: 'Total Users', value: String(stats.totalUsers ?? 0) },
      { label: 'Total Orders', value: String(stats.totalOrders ?? 0) },
      { label: 'Processing Orders', value: String(stats.processingOrders ?? 0) },
      { label: 'Shipped Orders', value: String(stats.shippedOrders ?? 0) },
      { label: 'Delivered Orders', value: String(stats.deliveredOrders ?? 0) },
      { label: 'Pending Payments', value: String(stats.pendingPayments ?? 0) },
      { label: 'Paid Orders', value: String(stats.paidOrders ?? 0) },
      { label: 'Total Revenue', value: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(stats.totalRevenue || 0)) },
      { label: 'Custom Orders', value: String(stats.customOrders ?? 0) },
      { label: 'Enquiries', value: String(stats.enquiries ?? 0) },
      { label: 'Newsletter Subscribers', value: String(stats.newsletterSubscribers ?? 0) },
      { label: 'Products', value: String(stats.totalProducts ?? 0) },
    ]
  }, [dashboardData])

  const changePageSize = (event) => {
    setActivityPageSize(Number(event.target.value))
    setActivityPage(1)
  }

  return (
    <AdminLayout subtitle="Live overview of Nebeda Threads customers, orders, and products.">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <DashboardCard index={index} key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      {isLoading ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-[var(--color-muted)]">
          Loading live dashboard data...
        </p>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-[rgba(190,151,83,0.42)] bg-[rgba(190,151,83,0.1)] px-5 py-4 text-sm text-[var(--color-cream)]">
          <p>{error}</p>
          <Button className="mt-4 px-4 py-2 text-[10px]" onClick={loadDashboardData} variant="outline">
            Retry
          </Button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          className="min-w-0 rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.045)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.25 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">Recent Activity</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{activityData.total} total activities</p>
            </div>
            <label className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
              Show
              <select
                aria-label="Activities per page"
                className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                onChange={changePageSize}
                value={activityPageSize}
              >
                {activityPageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-6 min-h-[28rem]">
            {isActivityLoading ? (
              <div aria-label="Loading recent activity" className="space-y-3">
                {Array.from({ length: Math.min(activityPageSize, 10) }, (_, index) => (
                  <div className="h-[5.25rem] animate-pulse rounded-2xl border border-white/10 bg-black/35" key={index} />
                ))}
              </div>
            ) : activityError ? (
              <div className="rounded-2xl border border-[rgba(190,151,83,0.42)] bg-[rgba(190,151,83,0.1)] p-5 text-sm text-[var(--color-cream)]">
                <p>{activityError}</p>
                <Button className="mt-4 px-4 py-2 text-[10px]" onClick={loadActivity} variant="outline">Retry</Button>
              </div>
            ) : activityData.activities.length ? (
              <div className="space-y-3">
                {activityData.activities.map((activity) => (
                  <article className="min-w-0 rounded-2xl border border-white/10 bg-black/35 p-4" key={activity.type + '-' + activity._id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">{activity.label}</p>
                        <p className="mt-1 break-words font-semibold text-white">{activity.title}</p>
                        <p className="mt-1 break-words text-sm text-[var(--color-muted)]">{activity.description}</p>
                      </div>
                      <time className="shrink-0 text-xs text-white/45" dateTime={activity.createdAt}>{formatDate(activity.createdAt)}</time>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-6">
                <h2 className="font-serif text-3xl text-white">No recent activity yet.</h2>
                <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">Customer, product, and order updates will appear here once records are created.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-sm text-[var(--color-muted)] sm:text-left">
              Page {activityData.page} of {activityData.pages}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="px-4 py-2 text-[10px]"
                disabled={isActivityLoading || activityPage <= 1}
                onClick={() => setActivityPage((page) => Math.max(1, page - 1))}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                className="px-4 py-2 text-[10px]"
                disabled={isActivityLoading || activityPage >= activityData.pages}
                onClick={() => setActivityPage((page) => Math.min(activityData.pages, page + 1))}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="rounded-[1.5rem] border border-[rgba(190,151,83,0.38)] bg-[linear-gradient(135deg,rgba(243,234,217,0.1),rgba(255,255,255,0.035))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.08 }}
          viewport={{ once: true, amount: 0.25 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">Quick Actions</p>
          <div className="mt-6 flex flex-col gap-4">
            <Button to="/admin/products/add" variant="primary">Add New Product</Button>
            <Button to="/admin/products" variant="outline">View Products</Button>
            <Button to="/admin/users" variant="outline">View Users</Button>
            <Button to="/admin/newsletter" variant="outline">View Newsletter</Button>
            <Button to="/admin/orders" variant="outline">View Orders</Button>
            <Button to="/admin/custom-orders" variant="outline">View Custom Orders</Button>
          </div>
        </motion.section>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
