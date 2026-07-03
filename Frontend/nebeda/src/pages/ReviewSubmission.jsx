import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/toastContext'
import { getReviewInvitation, submitReview } from '../services/reviewService'

const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const maxFileSize = 5 * 1024 * 1024

function productImage(product) {
  return product?.mainImage?.url || product?.images?.[0]?.url || ''
}

function ReviewSubmission() {
  const { token } = useParams()
  const { showToast } = useToast()
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState([])
  const imagesRef = useRef([])

  useEffect(() => {
    let active = true
    getReviewInvitation(token)
      .then((data) => { if (active) setInvitation(data.invitation) })
      .catch((apiError) => { if (active) setError(apiError.message || 'This review invitation is unavailable.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => () => {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview))
  }, [])

  const imagePreviews = useMemo(() => images.map((image) => image.preview), [images])

  const selectImages = (event) => {
    const selected = [...event.target.files]
    event.target.value = ''
    if (images.length + selected.length > 3) {
      showToast({ message: 'You can upload up to 3 review images.', type: 'error' })
      return
    }
    const invalid = selected.find((file) => !acceptedTypes.includes(file.type) || file.size > maxFileSize)
    if (invalid) {
      showToast({ message: 'Images must be JPG, PNG, or WebP and no larger than 5MB.', type: 'error' })
      return
    }
    setImages((current) => [...current, ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
  }

  const removeImage = (index) => {
    setImages((current) => {
      URL.revokeObjectURL(current[index].preview)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!rating || !title.trim() || !comment.trim()) {
      showToast({ message: 'Please add a rating, title, and comment.', type: 'error' })
      return
    }

    const formData = new FormData()
    formData.append('rating', String(rating))
    formData.append('title', title.trim())
    formData.append('comment', comment.trim())
    images.forEach(({ file }) => formData.append('images', file))

    setSubmitting(true)
    try {
      const response = await submitReview(token, formData)
      setSubmitted(true)
      showToast({ message: response.message, type: 'success' })
    } catch (apiError) {
      showToast({ message: apiError.message || 'Unable to submit your review.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="min-h-[65vh] bg-black px-5 py-24 text-center text-white/60">Loading your review invitation...</main>
  }

  if (error) {
    return (
      <main className="min-h-[65vh] bg-black px-5 py-20 text-white">
        <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center sm:p-12">
          <h1 className="font-serif text-4xl">Review Link Unavailable</h1>
          <p className="mt-5 text-white/60">{error}</p>
          <Button className="mt-8" to="/shop" variant="primary">Shop Collection</Button>
        </section>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-[65vh] bg-black px-5 py-20 text-white">
        <section className="mx-auto max-w-2xl rounded-2xl border border-[rgba(190,151,83,.4)] bg-white/[0.04] p-8 text-center sm:p-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Verified Purchase</p>
          <h1 className="mt-4 font-serif text-4xl">Thank You for Your Review</h1>
          <p className="mt-5 text-white/65">Your review has been submitted and will appear after approval.</p>
          <Button className="mt-8" to={'/shop/' + invitation.product.slug} variant="primary">View Product</Button>
        </section>
      </main>
    )
  }

  return (
    <main className="bg-black px-5 py-14 text-white sm:px-8 lg:py-20">
      <motion.section animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl" initial={{ opacity: 0, y: 16 }}>
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Verified Purchase Review</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl">How was your piece?</h1>
        <div className="mt-8 flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          {productImage(invitation.product) ? <img alt={invitation.product.name} className="h-24 w-20 shrink-0 rounded-xl object-cover" src={productImage(invitation.product)} /> : null}
          <div className="min-w-0">
            <p className="break-words font-serif text-2xl">{invitation.product.name}</p>
            <p className="mt-2 text-sm text-white/55">Delivered order · review link expires {new Date(invitation.expiresAt).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <form className="mt-6 space-y-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-8" onSubmit={submit}>
          <fieldset>
            <legend className="text-sm font-semibold text-white">Your rating</legend>
            <div className="mt-3 flex gap-2" role="radiogroup">
              {[1, 2, 3, 4, 5].map((star) => (
                <button aria-label={star + ' star rating'} aria-pressed={rating === star} className={'text-3xl transition ' + (star <= rating ? 'text-[var(--color-gold)]' : 'text-white/25 hover:text-white/60')} key={star} onClick={() => setRating(star)} type="button">★</button>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold">
            Short title
            <input className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-normal outline-none focus:border-[var(--color-gold)]" maxLength={100} onChange={(event) => setTitle(event.target.value)} required value={title} />
          </label>
          <label className="block text-sm font-semibold">
            Your review
            <textarea className="mt-2 min-h-36 w-full resize-y rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-normal outline-none focus:border-[var(--color-gold)]" maxLength={2000} onChange={(event) => setComment(event.target.value)} required value={comment} />
          </label>
          <div>
            <label className="inline-flex cursor-pointer rounded-xl border border-white/15 px-4 py-3 text-sm text-white/75 transition hover:border-[var(--color-gold)] hover:text-white">
              Add photos (optional)
              <input accept=".jpg,.jpeg,.png,.webp" className="sr-only" multiple onChange={selectImages} type="file" />
            </label>
            {imagePreviews.length ? (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div className="relative aspect-square overflow-hidden rounded-xl" key={preview}>
                    <img alt={'Review upload ' + (index + 1)} className="h-full w-full object-cover" src={preview} />
                    <button aria-label="Remove image" className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-1 text-xs" onClick={() => removeImage(index)} type="button">×</button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <Button disabled={submitting} type="submit" variant="primary">{submitting ? 'Submitting...' : 'Submit Review'}</Button>
        </form>
        <p className="mt-6 text-center text-xs text-white/40">Only verified purchases can be reviewed. Reviews are moderated before publication.</p>
      </motion.section>
    </main>
  )
}

export default ReviewSubmission
