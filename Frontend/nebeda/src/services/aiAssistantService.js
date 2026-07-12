import { apiRequest, getList } from './api'

function getAssistantKnowledge() {
  return apiRequest('/ai-assistant/knowledge').then((data) => getList(data, 'knowledge'))
}

function getAssistantAnalytics() {
  return apiRequest('/ai-assistant/admin/analytics').then((data) => data?.data || {})
}

function getAdminAssistantKnowledge() {
  return apiRequest('/ai-assistant/admin/knowledge').then((data) => getList(data, 'knowledge'))
}

function updateAssistantKnowledge(id, payload) {
  return apiRequest(`/ai-assistant/admin/knowledge/${id}`, {
    body: payload,
    method: 'PUT',
  }).then((data) => data?.data || null)
}

function recordAssistantEvent(payload) {
  return apiRequest('/ai-assistant/events', {
    body: payload,
    method: 'POST',
  })
}

function recordAssistantEventQuietly(payload) {
  recordAssistantEvent(payload).catch(() => {
    // Assistant analytics must never interrupt customer support.
  })
}

export {
  getAdminAssistantKnowledge,
  getAssistantAnalytics,
  getAssistantKnowledge,
  recordAssistantEventQuietly,
  updateAssistantKnowledge,
}
