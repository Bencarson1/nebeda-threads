import { useCallback, useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { approveReview, deleteReview, getAdminReviews, rejectReview } from '../../services/reviewService'

function AdminReviews() {
  const { showToast } = useToast()
  const [reviews, setReviews] = useState([])
  const [filters, setFilters] = useState({ search: '', status: 'pending', page: 1, limit: 20 })
  const [meta, setMeta] = useState({ total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminReviews(filters)
      setReviews(data.reviews || [])
      setMeta({ total: data.total || 0, pages: data.pages || 1 })
    } catch (error) {
      showToast({ message: error.message || 'Unable to load reviews.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filters, showToast])

  useEffect(() => {
    const timer = window.setTimeout(loadReviews, 200)
    return () => window.clearTimeout(timer)
  }, [loadReviews])

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value, page: 1 }))
  }

  const runAction = async (action, fallback) => {
    try {
      const response = await action()
      showToast({ message: response.message || fallback, type: 'success' })
      await loadReviews()
    } catch (error) {
      showToast({ message: error.message || 'Review action failed.', type: 'error' })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await runAction(() => deleteReview(deleteTarget._id), 'Review deleted successfully.')
    setDeleteTarget(null)
  }

  return (
    <AdminLayout subtitle="Moderate verified customer product reviews.">
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-gold)]">Customer feedback</p>
            <h1 className="mt-2 font-serif text-4xl">Reviews</h1>
          </div>
          <p className="text-sm text-white/55">{meta.total} submitted reviews</p>
        </div>

        <div className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_12rem]">
          <input aria-label="Search reviews" className="min-w-0 rounded-xl border border-white/10 bg-black/45 px-4 py-3 outline-none focus:border-[var(--color-gold)]" name="search" onChange={updateFilter} placeholder="Search customer, title, or review" value={filters.search} />
          <select className="rounded-xl border border-white/10 bg-black px-4 py-3" name="status" onChange={updateFilter} value={filters.status}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? <div className="mt-6 rounded-2xl border border-white/10 p-8 text-center text-white/55">Loading reviews...</div> : null}
        {!loading && !reviews.length ? <div className="mt-6 rounded-2xl border border-white/10 p-8 text-center text-white/55">No reviews found.</div> : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <article className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5" key={review._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-serif text-xl">{review.productId?.name || 'Unavailable product'}</p>
                  <p className="mt-1 break-words text-sm text-white/55">{review.customerName} · Verified Purchase</p>
                </div>
                <span className="rounded-full border border-[rgba(190,151,83,.35)] px-3 py-1 text-xs capitalize text-[var(--color-gold)]">{review.status}</span>
              </div>
              <p aria-label={review.rating + ' out of 5 stars'} className="mt-4 tracking-widest text-[var(--color-gold)]">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
              <h2 className="mt-3 break-words font-semibold">{review.title}</h2>
              <p className="mt-2 break-words text-sm leading-6 text-white/65">{review.comment}</p>
              {review.images?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {review.images.map((image) => <a href={image.url} key={image.publicId} rel="noreferrer" target="_blank"><img alt={image.alt} className="h-16 w-16 rounded-lg object-cover" src={image.url} /></a>)}
                </div>
              ) : null}
              <p className="mt-4 text-xs text-white/35">{new Date(review.submittedAt).toLocaleString('en-GB')}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {review.status !== 'approved' ? <Button className="px-4 py-2 text-[10px]" onClick={() => runAction(() => approveReview(review._id), 'Review approved.')} variant="primary">Approve</Button> : null}
                {review.status !== 'rejected' ? <Button className="px-4 py-2 text-[10px]" onClick={() => runAction(() => rejectReview(review._id), 'Review rejected.')} variant="outline">Reject</Button> : null}
                <Button className="px-4 py-2 text-[10px]" onClick={() => setDeleteTarget(review)} variant="outline">Delete</Button>
              </div>
            </article>
          ))}
        </div>

        {meta.pages > 1 ? (
          <nav aria-label="Review pages" className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} variant="outline">Previous</Button>
            <span className="text-sm text-white/55">Page {filters.page} of {meta.pages}</span>
            <Button disabled={filters.page >= meta.pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} variant="outline">Next</Button>
          </nav>
        ) : null}
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-5">
          <div aria-modal="true" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0b] p-6" role="dialog">
            <h2 className="font-serif text-2xl">Delete Review?</h2>
            <p className="mt-3 text-sm text-white/60">This permanently removes the submitted review.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setDeleteTarget(null)} variant="outline">Cancel</Button>
              <Button onClick={confirmDelete} variant="primary">Delete Review</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default AdminReviews
