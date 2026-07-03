import { useEffect, useState } from 'react'
import { getProductReviews } from '../../services/reviewService'

const firstName = (name = 'Customer') => name.trim().split(/\s+/)[0] || 'Customer'

function ProductReviews({ productId }) {
  const [state, setState] = useState({ reviews: [], count: 0, averageRating: 0, loading: true })

  useEffect(() => {
    let active = true
    getProductReviews(productId)
      .then((data) => {
        if (active) setState({ reviews: data.reviews || [], count: data.count || 0, averageRating: data.averageRating || 0, loading: false })
      })
      .catch(() => {
        if (active) setState({ reviews: [], count: 0, averageRating: 0, loading: false })
      })
    return () => { active = false }
  }, [productId])

  if (state.loading) return <section className="mt-16 border-t border-white/10 pt-10 text-sm text-white/45">Loading customer reviews...</section>

  return (
    <section aria-labelledby="customer-reviews" className="mt-16 border-t border-white/10 pt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-gold)]">Verified purchases</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl" id="customer-reviews">Customer Reviews</h2>
        </div>
        {state.count ? <p className="text-sm text-white/60"><span className="text-[var(--color-gold)]">★ {state.averageRating.toFixed(1)}</span> from {state.count} {state.count === 1 ? 'review' : 'reviews'}</p> : null}
      </div>
      {!state.count ? <p className="mt-6 text-white/55">No approved reviews yet.</p> : (
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {state.reviews.map((review) => (
            <article className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6" key={review._id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p aria-label={review.rating + ' out of 5 stars'} className="tracking-widest text-[var(--color-gold)]">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                <span className="rounded-full border border-[rgba(190,151,83,.35)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-gold)]">Verified Purchase</span>
              </div>
              <h3 className="mt-4 break-words font-serif text-xl">{review.title}</h3>
              <p className="mt-3 break-words text-sm leading-6 text-white/65">{review.comment}</p>
              {review.images?.length ? <div className="mt-4 flex flex-wrap gap-2">{review.images.map((image) => <a href={image.url} key={image.publicId} rel="noreferrer" target="_blank"><img alt={image.alt} className="h-20 w-20 rounded-lg object-cover" loading="lazy" src={image.url} /></a>)}</div> : null}
              <p className="mt-5 text-sm text-white/45">{firstName(review.customerName)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default ProductReviews
