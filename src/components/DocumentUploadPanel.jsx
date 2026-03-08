import { useState } from 'react'
import { uploadDocument, getDocuments } from '../api/cardApi'

const DOC_TYPES = [
  { value: 'PAY_STUB', label: 'Pay Stub' },
  { value: 'GOVERNMENT_ID', label: 'Government ID' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'TAX_RETURN', label: 'Tax Return' },
]

export default function DocumentUploadPanel({ applicationId, status }) {
  const [docType, setDocType] = useState('PAY_STUB')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState([])
  const [error, setError] = useState(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const doc = await uploadDocument(applicationId, docType, file)
      setUploaded(prev => [...prev, { ...doc, label: DOC_TYPES.find(d => d.value === docType)?.label }])
      setFile(null)
    } catch (e) {
      setError('Upload failed: ' + (e.response?.data?.message || e.message))
    } finally {
      setUploading(false)
    }
  }

  if (status !== 'MANUAL_REVIEW' && status !== 'DENIED') return null

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Upload Supporting Documents</h3>
      <p className="text-sm text-gray-500 mb-4">
        Upload documents to support your application for manual review.
      </p>

      <div className="flex gap-3 flex-wrap mb-4">
        <select
          value={docType}
          onChange={e => setDocType(e.target.value)}
          className="form-input w-44"
        >
          {DOC_TYPES.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <label className="flex-1 cursor-pointer">
          <div className="form-input flex items-center gap-2 text-gray-500">
            <span>📎</span>
            <span className="truncate">{file ? file.name : 'Choose file...'}</span>
          </div>
          <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png" />
        </label>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-primary whitespace-nowrap"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      {uploaded.length > 0 && (
        <div className="space-y-2">
          {uploaded.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-green-50 rounded-lg p-2 border border-green-100">
              <span className="text-green-500">✓</span>
              <span className="font-medium">{doc.label}</span>
              <span className="text-gray-400">—</span>
              <span className="text-gray-500 truncate">{doc.fileName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
