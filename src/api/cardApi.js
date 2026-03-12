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

export const prefillWithProve = (phone, ssn4) =>
  api.post('/card-application/prefill', { phone, ssn4 }).then(r => r.data)

// Feature 1: Pre-qualification
export const prequalify = (data) =>
  api.post('/prequalification', data).then(r => r.data)

// Feature 2: Card Activation
export const activateCard = (appId) =>
  api.post(`/card-application/${appId}/activate`).then(r => r.data)

// Feature 4: Spend Controls
export const getSpendControls = (appId) =>
  api.get(`/card-application/${appId}/spend-controls`).then(r => r.data)

export const saveSpendControls = (appId, controls) =>
  api.post(`/card-application/${appId}/spend-controls`, controls).then(r => r.data)

// Feature 5: Manual Review Queue
export const approveApplication = (appId, data) =>
  api.post(`/card-application/${appId}/approve`, data).then(r => r.data)

export const denyApplication = (appId, data) =>
  api.post(`/card-application/${appId}/deny`, data).then(r => r.data)

// Feature 6: Audit Trail
export const getAuditTrail = (appId) =>
  api.get(`/card-application/${appId}/audit`).then(r => r.data)

// Feature 8: Re-engagement Campaigns
export const getReengagement = (appId) =>
  api.get(`/card-application/${appId}/reengagement`).then(r => r.data)

export const cancelCampaign = (campaignId) =>
  api.post(`/reengagement/${campaignId}/cancel`).then(r => r.data)

// Pre-approved offer submit (customer fills income/housing then submits through pipeline)
export const submitPreapproved = (appId, data) =>
  api.post(`/card-application/${appId}/submit-preapproved`, data).then(r => r.data)

// New Feature 1: Card Recommender
export const getCardRecommendation = (data) =>
  api.post('/card-recommendation', data).then(r => r.data)

// New Feature 2: Pre-approved Offers
export const getOffers = () =>
  api.get('/preapproved-offer').then(r => r.data)

export const getOffer = (id) =>
  api.get(`/preapproved-offer/${id}`).then(r => r.data)

export const createOffer = (data) =>
  api.post('/preapproved-offer', data).then(r => r.data)

export const createOfferBatch = (list) =>
  api.post('/preapproved-offer/batch', list).then(r => r.data)

export const acceptOffer = (id) =>
  api.post(`/preapproved-offer/${id}/accept`).then(r => r.data)

export const cancelOffer = (id) =>
  api.post(`/preapproved-offer/${id}/cancel`).then(r => r.data)

// New Feature 3: Autopay
export const getAutopay = (appId) =>
  api.get(`/card-application/${appId}/autopay`).then(r => r.data)

export const enrollAutopay = (appId, data) =>
  api.post(`/card-application/${appId}/autopay`, data).then(r => r.data)

export const cancelAutopay = (appId) =>
  api.post(`/card-application/${appId}/autopay/cancel`).then(r => r.data)

export const enrollPaperless = (appId) =>
  api.post(`/card-application/${appId}/paperless`).then(r => r.data)

export const cancelPaperless = (appId) =>
  api.post(`/card-application/${appId}/paperless/cancel`).then(r => r.data)

// New Feature 4: A/B Testing
export const getExperiments = () =>
  api.get('/ab-test/experiment').then(r => r.data)

export const createExperiment = (data) =>
  api.post('/ab-test/experiment', data).then(r => r.data)

export const addVariant = (expId, data) =>
  api.post(`/ab-test/experiment/${expId}/variant`, data).then(r => r.data)

export const activateExperiment = (id) =>
  api.post(`/ab-test/experiment/${id}/activate`).then(r => r.data)

export const pauseExperiment = (id) =>
  api.post(`/ab-test/experiment/${id}/pause`).then(r => r.data)

export const completeExperiment = (id) =>
  api.post(`/ab-test/experiment/${id}/complete`).then(r => r.data)

export const getExperimentResults = (id) =>
  api.get(`/ab-test/experiment/${id}/results`).then(r => r.data)
