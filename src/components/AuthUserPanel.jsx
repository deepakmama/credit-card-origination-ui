import { useState } from 'react'
import { addAuthUser, skipAuthUser } from '../api/cardApi'

const RELATIONSHIPS = ['SPOUSE', 'DOMESTIC_PARTNER', 'CHILD', 'OTHER']

export default function AuthUserPanel({ app, onUpdate }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', relationship: 'SPOUSE', email: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(null)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName) {
      setError('First name and last name are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const updated = await addAuthUser(app.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob || null,
        relationship: form.relationship,
        email: form.email || null,
      })
      setAdded({ name: `${form.firstName} ${form.lastName}`, relationship: form.relationship })
      onUpdate()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setSkipping(true)
    setError(null)
    try {
      await skipAuthUser(app.id)
      onUpdate()
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setSkipping(false)
    }
  }

  if (added) {
    return (
      <div className="card p-5 border border-citizens-green/30 bg-citizens-green-pale">
        <div className="flex items-center gap-2 mb-2">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#008555" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="font-semibold text-citizens-green-dark">Authorized User Added</h3>
        </div>
        <p className="text-sm text-citizens-green-dark">
          <span className="font-semibold">{added.name}</span> ({added.relationship.replace(/_/g, ' ')}) has been enrolled as an authorized user.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5 border-2 border-creditcard-purple/20 bg-purple-50">
      <h3 className="font-semibold text-purple-900 mb-1">Add Authorized User</h3>
      <p className="text-xs text-purple-700 mb-4">Optionally add someone to use this card on your account.</p>

      {error && <div className="text-red-600 text-xs mb-3 p-2 bg-red-50 rounded">{error}</div>}

      <form onSubmit={handleAdd} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
            <input name="firstName" value={form.firstName} onChange={handleChange}
              className="form-input text-sm" placeholder="Jane" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
            <input name="lastName" value={form.lastName} onChange={handleChange}
              className="form-input text-sm" placeholder="Smith" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input type="date" name="dob" value={form.dob} onChange={handleChange}
              className="form-input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
            <select name="relationship" value={form.relationship} onChange={handleChange}
              className="form-input text-sm">
              {RELATIONSHIPS.map(r => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            className="form-input text-sm" placeholder="jane@example.com" />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={submitting}
            className="btn-primary flex-1 py-2 text-sm">
            {submitting ? 'Adding...' : 'Add Authorized User'}
          </button>
          <button type="button" onClick={handleSkip} disabled={skipping}
            className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors">
            {skipping ? 'Skipping...' : 'Skip this step'}
          </button>
        </div>
      </form>
    </div>
  )
}
