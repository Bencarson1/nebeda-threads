import { apiRequest } from './api'

function getReviewInvitation(token) {
  return apiRequest('/reviews/invitation/' + encodeURIComponent(token))
}

function submitReview(token, formData) {
  return apiRequest('/reviews/invitation/' + encodeURIComponent(token), {
    method: 'POST',
    body: formData,
  })
}

function getProductReviews(productId) {
  return apiRequest('/reviews/product/' + productId)
}

function getAdminReviews(params) {
  return apiRequest('/reviews/admin', { params })
}

function approveReview(id) {
  return apiRequest('/reviews/admin/' + id + '/approve', { method: 'PATCH' })
}

function rejectReview(id) {
  return apiRequest('/reviews/admin/' + id + '/reject', { method: 'PATCH' })
}

function deleteReview(id) {
  return apiRequest('/reviews/admin/' + id, { method: 'DELETE' })
}

export {
  approveReview,
  deleteReview,
  getAdminReviews,
  getProductReviews,
  getReviewInvitation,
  rejectReview,
  submitReview,
}
