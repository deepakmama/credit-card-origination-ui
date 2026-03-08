import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export const submitApplication = (payload) =>
  api.post('/card-application', payload).then(r => r.data)

export const getApplications = () =>
  api.get('/card-application').then(r => r.data)

export const getApplication = (id) =>
  api.get(`/card-application/${id}`).then(r => r.data)

export const reprocessApplication = (id, ssn) =>
  api.post(`/card-application/${id}/reprocess`, { ssn }).then(r => r.data)

export const uploadDocument = (appId, documentType, file) => {
  const formData = new FormData()
  formData.append('documentType', documentType)
  formData.append('file', file)
  return api.post(`/card-application/${appId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

export const getDocuments = (appId) =>
  api.get(`/card-application/${appId}/documents`).then(r => r.data)

export const addAuthUser = (appId, data) =>
  api.post(`/card-application/${appId}/auth-user`, data).then(r => r.data)

export const skipAuthUser = (appId) =>
  api.post(`/card-application/${appId}/auth-user/skip`).then(r => r.data)

export const initiateBalanceTransfer = (appId) =>
  api.post(`/card-application/${appId}/balance-transfer`).then(r => r.data)

export const prefillWithProve = (phone) =>
  api.post('/card-application/prefill', { phone }).then(r => r.data)
