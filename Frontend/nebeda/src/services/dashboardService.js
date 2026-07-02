import { apiRequest } from './api'

function getDashboardStats() {
  return apiRequest('/dashboard/stats')
}

function getDashboardActivity(params) {
  return apiRequest('/dashboard/activity', { params })
}

export { getDashboardActivity, getDashboardStats }
