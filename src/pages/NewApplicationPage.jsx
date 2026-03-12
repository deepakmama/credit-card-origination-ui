import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitApplication } from '../api/cardApi'
import CardTypeSelector from '../components/CardTypeSelector'
import CardRecommenderPanel from '../components/CardRecommenderPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import ProveVerificationPanel from '../components/ProveVerificationPanel'

const STEPS = ['Personal Info', 'Card Selection']

const EMPLOYMENT_TYPES = [
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'SELF_EMPLOYED', label: 'Self Employed' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
  { value: 'RETIRED', label: 'Retired' },
]

// Simulated bank-on-file financial data keyed by phone
const BANK_FINANCIAL_DATA = {
  '617-555-0001': { annualIncome: 87500,  monthlyHousingPayment: 1850 },
  '617-555-0002': { annualIncome: 142000, monthlyHousingPayment: 2800 },
  '617-555-0003': { annualIncome: 58000,  monthlyHousingPayment: 1100 },
  '617-555-0004': { annualIncome: 103000, monthlyHousingPayment: 2200 },
}

const initialForm = {
  firstName: '', lastName: '', ssn: '', dob: '', email: '', phone: '', address: '',
  employmentType: 'EMPLOYED', employerName: '', annualIncome: '', monthlyHousingPayment: '',
  existingBankRelationship: false,
  cardType: 'CASH_BACK', requestedCreditLimit: '', balanceTransferAmount: '', balanceTransferBank: '',
}

export default function NewApplicationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [provedFields, setProvedFields] = useState(new Set())
  const [bankFields, setBankFields] = useState(new Set())
  const [bankLoading, setBankLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleProvePrefill = (data) => {
    setForm(f => ({
      ...f,
      firstName: data.firstName || f.firstName,
      lastName:  data.lastName  || f.lastName,
      ssn:       data.ssn       || f.ssn,
      dob:       data.dob       || f.dob,
      email:     data.email     || f.email,
      phone:     data.phone     || f.phone,
      address:   data.address   || f.address,
    }))
    setProvedFields(new Set(['firstName', 'lastName', 'ssn', 'dob', 'email', 'phone', 'address']))
  }

  const handleBankRelationshipChange = async (checked) => {
    set('existingBankRelationship', checked)
    if (checked) {
      setBankLoading(true)
      await new Promise(r => setTimeout(r, 900))
      const data = BANK_FINANCIAL_DATA[form.phone] || { annualIncome: 72000, monthlyHousingPayment: 1500 }
      setForm(f => ({
        ...f,
        annualIncome: String(data.annualIncome),
        monthlyHousingPayment: String(data.monthlyHousingPayment),
      }))
      setBankFields(new Set(['annualIncome', 'monthlyHousingPayment']))
      setBankLoading(false)
    } else {
      setForm(f => ({ ...f, annualIncome: '', monthlyHousingPayment: '' }))
      setBankFields(new Set())
    }
  }

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    if (name === 'existingBankRelationship') {
      handleBankRelationshipChange(checked)
    } else {
      set(name, type === 'checkbox' ? checked : value)
    }
  }

  const handleNext = e => {
    e.preventDefault()
    setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        applicant: {
          firstName: form.firstName,
          lastName: form.lastName,
          ssn: form.ssn,
          dob: form.dob || null,
          email: form.email,
          phone: form.phone,
          address: form.address,
          employmentType: form.employmentType,
          employerName: form.employerName,
          annualIncome: parseFloat(form.annualIncome) || 0,
          monthlyHousingPayment: parseFloat(form.monthlyHousingPayment) || 0,
          existingBankRelationship: form.existingBankRelationship,
        },
        cardRequest: {
          cardType: form.cardType,
          requestedCreditLimit: form.requestedCreditLimit ? parseFloat(form.requestedCreditLimit) : null,
          balanceTransferAmount: form.balanceTransferAmount ? parseFloat(form.balanceTransferAmount) : null,
          balanceTransferBank: form.balanceTransferBank || null,
        }
      }
      const result = await submitApplication(payload)
      navigate(`/applications/${result.id}/confirmation`)
    } catch (e) {
      setError('Submission failed: ' + (e.response?.data?.message || e.message))
      setSubmitting(false)
    }
  }

  if (submitting) return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <LoadingSpinner message="Processing your application through the pipeline..." />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Apply for a Credit Card</h1>
        <p className="text-gray-500 mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8 gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < step ? 'bg-citizens-green text-white' : i === step ? 'bg-citizens-green text-white' : 'bg-citizens-gray-light text-citizens-gray border border-citizens-border'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`ml-1.5 text-sm font-medium ${i === step ? 'text-citizens-green' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-citizens-green' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Step 1: Personal Info */}
      {step === 0 && (
        <form onSubmit={handleNext} className="space-y-4">
          <ProveVerificationPanel onPrefill={handleProvePrefill} />

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Personal Information</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">
                  First Name *
                  {provedFields.has('firstName') && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">PROVE</span>
                  )}
                </label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required className="form-input" />
              </div>
              <div>
                <label className="section-label">
                  Last Name *
                  {provedFields.has('lastName') && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">PROVE</span>
                  )}
                </label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">
                  SSN * (XXX-XX-XXXX)
                  {provedFields.has('ssn') && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">PROVE</span>
                  )}
                </label>
                <input name="ssn" value={form.ssn} onChange={handleChange} required placeholder="123-45-6789" className="form-input" />
              </div>
              <div>
                <label className="section-label">
                  Date of Birth
                  {provedFields.has('dob') && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">PROVE</span>
                  )}
                </label>
                <input name="dob" type="date" value={form.dob} onChange={handleChange} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">
                  Email
                  {provedFields.has('email') && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">PROVE</span>
                  )}
                </label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="section-label">
                  Phone
                  {provedFields.has('phone') && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">PROVE</span>
                  )}
                </label>
                <input name="phone" value={form.phone} onChange={handleChange} className="form-input" />
              </div>
            </div>
            <div>
              <label className="section-label">
                Address
                {provedFields.has('address') && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">PROVE</span>
                )}
              </label>
              <input name="address" value={form.address} onChange={handleChange} className="form-input" />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Employment & Income</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">Employment Type *</label>
                <select name="employmentType" value={form.employmentType} onChange={handleChange} className="form-input">
                  {EMPLOYMENT_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="section-label">Employer Name</label>
                <input name="employerName" value={form.employerName} onChange={handleChange} className="form-input" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="existingBankRelationship" type="checkbox" checked={form.existingBankRelationship} onChange={handleChange} disabled={bankLoading} className="w-4 h-4 accent-green-600" />
              <span className="text-sm text-gray-700">I have an existing bank relationship</span>
              {bankLoading && (
                <span className="flex items-center gap-1 text-xs text-green-700">
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Fetching bank data…
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label">
                  Annual Income ($) *
                  {bankFields.has('annualIncome') && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">BANK</span>
                  )}
                </label>
                <input name="annualIncome" type="number" value={form.annualIncome} onChange={handleChange} required min="0" className="form-input" />
              </div>
              <div>
                <label className="section-label">
                  Monthly Housing Payment ($)
                  {bankFields.has('monthlyHousingPayment') && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">BANK</span>
                  )}
                </label>
                <input name="monthlyHousingPayment" type="number" value={form.monthlyHousingPayment} onChange={handleChange} min="0" className="form-input" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary px-8 py-2.5">Next: Card Selection →</button>
          </div>
        </form>
      )}

      {/* Step 2: Card Selection */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardRecommenderPanel onRecommend={v => set('cardType', v)} />

          <div className="card p-6 space-y-6">
            <CardTypeSelector value={form.cardType} onChange={v => set('cardType', v)} />

            <div>
              <label className="section-label">Requested Credit Limit ($) <span className="normal-case font-normal text-gray-400">(optional)</span></label>
              <input name="requestedCreditLimit" type="number" value={form.requestedCreditLimit} onChange={handleChange} min="0" placeholder="Leave blank for auto-assignment" className="form-input" />
            </div>

            {form.cardType === 'BALANCE_TRANSFER' && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-medium text-blue-900 text-sm">Balance Transfer Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="section-label">Transfer Amount ($)</label>
                    <input name="balanceTransferAmount" type="number" value={form.balanceTransferAmount} onChange={handleChange} min="0" className="form-input" />
                  </div>
                  <div>
                    <label className="section-label">Current Bank/Issuer</label>
                    <input name="balanceTransferBank" value={form.balanceTransferBank} onChange={handleChange} placeholder="e.g. Chase, Citibank" className="form-input" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test SSNs reference */}
          <div className="card p-4 bg-amber-50 border border-amber-200">
            <div className="text-xs font-semibold text-amber-800 mb-2">Test SSNs</div>
            <div className="grid grid-cols-2 gap-1 text-xs text-amber-700">
              <span>123-45-6789 → Score 750 (Approve)</span>
              <span>000-00-0000 → Identity Fail (Deny)</span>
              <span>999-99-9999 → Watchlist Hit (Deny)</span>
              <span>111-11-1111 → Fraud Score 92 (Deny)</span>
              <span>444-44-4444 → Score 800 (Approve)</span>
              <span>333-33-3333 → Score 720 (Approve)</span>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={handleBack} className="btn-secondary px-6 py-2.5">← Back</button>
            <button type="submit" className="btn-primary px-8 py-2.5">Submit Application</button>
          </div>
        </form>
      )}
    </div>
  )
}
