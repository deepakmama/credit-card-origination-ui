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

// Configurations
export const getConfigurations = (category) =>
  api.get('/system-config', { params: category ? { category } : {} }).then(r => r.data)

export const resetConfiguration = (key) =>
  api.post(`/system-config/${key}/reset`).then(r => r.data)

// Config Change Requests (approval workflow)
export const getChangeRequests = (status) =>
  api.get('/config-change-request', { params: status ? { status } : {} }).then(r => r.data)

export const submitChangeRequest = (configKey, proposedValue, requestedBy, justification) =>
  api.post(`/config-change-request/${configKey}/submit`, { proposedValue, requestedBy, justification }).then(r => r.data)

export const approveChangeRequest = (id, actor, comments) =>
  api.post(`/config-change-request/${id}/approve`, { actor, comments }).then(r => r.data)

export const rejectChangeRequest = (id, actor, comments) =>
  api.post(`/config-change-request/${id}/reject`, { actor, comments }).then(r => r.data)

export const publishChangeRequest = (id, publishedBy) =>
  api.post(`/config-change-request/${id}/publish`, null, { params: publishedBy ? { publishedBy } : {} }).then(r => r.data)

export const publishAllChangeRequests = (publishedBy) =>
  api.post('/config-change-request/publish-all', null, { params: publishedBy ? { publishedBy } : {} }).then(r => r.data)

// ── AI Assistant ──────────────────────────────────────────────────────────────

export const CHAT_SYSTEM_PROMPT = `You are an AI credit card application assistant for Citizens Bank. Help customers apply for a credit card by collecting required information conversationally, one step at a time.

Collect these fields (1-2 at a time, in order):
1. First name, Last name
2. Date of birth (YYYY-MM-DD format)
3. SSN (format: XXX-XX-XXXX)
4. Email, Phone
5. Address (full address as one string)
6. Employment type — must be exactly one of: EMPLOYED, SELF_EMPLOYED, STUDENT, UNEMPLOYED, RETIRED
7. Employer name (skip if STUDENT, UNEMPLOYED, or RETIRED)
8. Annual income (number, in dollars)
9. Monthly housing payment (number — ask them to enter 0 if they have no housing payment)
10. Existing Citizens Bank customer? (yes/no)
11. Need to transfer a balance from another card? (yes/no)
12. Card type — guide them with these options:
    - CASH_BACK: best for everyday spending rewards (recommended for income ≥ $30,000)
    - BALANCE_TRANSFER: best for consolidating existing debt from other cards
    - NEW_TO_CREDIT: ideal for first-time cardholders or those rebuilding credit
13. Requested credit limit (optional — they can skip, we'll use our standard limits)

Guidelines:
- Friendly, professional tone — you represent Citizens Bank
- Never ask more than 2 fields at a time
- Validate format: SSN must be XXX-XX-XXXX, DOB must be YYYY-MM-DD, income and payments must be numbers
- If they say they're a student or unemployed, gently guide them toward NEW_TO_CREDIT
- If they mention transferring a balance, suggest BALANCE_TRANSFER
- When all fields are collected, show a clear summary table and ask "Shall I submit your application?"
- When the user confirms, output EXACTLY this on a single line with no markdown, no code fences, no newlines inside the JSON:
[SUBMIT_APPLICATION]{"applicant":{"firstName":"VALUE","lastName":"VALUE","dob":"VALUE","ssn":"VALUE","email":"VALUE","phone":"VALUE","address":"VALUE","employmentType":"VALUE","employerName":"VALUE","annualIncome":0,"monthlyHousingPayment":0,"existingBankRelationship":false},"cardRequest":{"cardType":"CASH_BACK","requestedCreditLimit":0}}

CRITICAL RULES for the submit line:
- Must start with [SUBMIT_APPLICATION] immediately followed by { — no space, no newline
- cardType must be exactly: CASH_BACK, BALANCE_TRANSFER, or NEW_TO_CREDIT
- employmentType must be exactly: EMPLOYED, SELF_EMPLOYED, STUDENT, UNEMPLOYED, or RETIRED
- All numeric fields (annualIncome, monthlyHousingPayment, requestedCreditLimit) must be numbers not strings
- existingBankRelationship must be boolean true or false (not "true"/"false")
- requestedCreditLimit: use 0 if not specified by the customer
- No markdown code fences (no triple backticks) anywhere around the submit line
- Output this line only once, at the very end, after the user explicitly confirms`

export const updateDocumentOcr = (appId, docId, data) =>
  api.patch(`/card-application/${appId}/documents/${docId}/ocr`, data).then(r => r.data)

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const OCR_PROMPTS = {
  PAY_STUB: 'Extract the following fields from this pay stub and return ONLY a JSON object: employerName, employeeName, payPeriod, grossPay, netPay, yearToDateGross.',
  GOVERNMENT_ID: 'Extract the following fields from this government ID and return ONLY a JSON object: fullName, dateOfBirth, idNumber, address, expirationDate, idType.',
  BANK_STATEMENT: 'Extract the following fields from this bank statement and return ONLY a JSON object: accountHolder, accountNumberLast4, bankName, statementPeriod, endingBalance, averageBalance.',
  TAX_RETURN: 'Extract the following fields from this tax return and return ONLY a JSON object: taxpayerName, taxYear, filingStatus, totalIncome, adjustedGrossIncome, totalTax.',
}

export async function analyzeDocumentWithOcr(file, documentType) {
  const base64 = await fileToBase64(file)
  const mediaType = file.type
  const prompt = OCR_PROMPTS[documentType] || 'Extract all key information from this document and return ONLY a JSON object.'

  const contentBlock = mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }

  const { data } = await axios.post('/anthropic-api/v1/messages', {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'You are a document OCR specialist. Extract structured data from documents. Return ONLY raw JSON, no markdown, no code fences.',
    messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: prompt }] }],
  })

  const raw = data.content?.[0]?.text || '{}'
  const clean = raw.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim()
  return JSON.parse(clean)
}

export async function sendAgentMessage(systemPrompt, userMessage) {
  const { data } = await axios.post('/anthropic-api/v1/messages', {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  return data
}

export async function sendChatMessage(messages) {
  const { data } = await axios.post('/anthropic-api/v1/messages', {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: CHAT_SYSTEM_PROMPT,
    messages,
  })
  return data
}
