import { useState } from 'react'
import { uploadDocument, updateDocumentOcr, analyzeDocumentWithOcr } from '../api/cardApi'

const DOC_TYPES = [
  { value: 'PAY_STUB', label: 'Pay Stub' },
  { value: 'GOVERNMENT_ID', label: 'Government ID' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'TAX_RETURN', label: 'Tax Return' },
]

const OCR_FIELD_LABELS = {
  PAY_STUB: {
    employerName: 'Employer',
    employeeName: 'Employee',
    payPeriod: 'Pay Period',
    grossPay: 'Gross Pay',
    netPay: 'Net Pay',
    yearToDateGross: 'YTD Gross',
  },
  GOVERNMENT_ID: {
    fullName: 'Full Name',
    dateOfBirth: 'Date of Birth',
    idNumber: 'ID Number',
    address: 'Address',
    expirationDate: 'Expires',
    idType: 'ID Type',
  },
  BANK_STATEMENT: {
    accountHolder: 'Account Holder',
    accountNumberLast4: 'Acct (Last 4)',
    bankName: 'Bank',
    statementPeriod: 'Period',
    endingBalance: 'Ending Balance',
    averageBalance: 'Avg Balance',
  },
  TAX_RETURN: {
    taxpayerName: 'Taxpayer',
    taxYear: 'Tax Year',
    filingStatus: 'Filing Status',
    totalIncome: 'Total Income',
    adjustedGrossIncome: 'AGI',
    totalTax: 'Total Tax',
  },
}

function OcrResults({ docType, data }) {
  const fieldLabels = OCR_FIELD_LABELS[docType] || {}
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== '')
  if (entries.length === 0) return null
  return (
    <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-blue-500 text-xs">🔍</span>
        <span className="text-xs font-semibold text-blue-700">OCR Extracted Data</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-[10px] text-blue-400 uppercase tracking-wide">
              {fieldLabels[key] || key}
            </span>
            <span className="text-xs text-gray-700 font-medium truncate">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
    const capturedFile = file
    const capturedDocType = docType
    try {
      // 1. Upload file to backend
      const doc = await uploadDocument(applicationId, capturedDocType, capturedFile)
      const entry = {
        ...doc,
        label: DOC_TYPES.find(d => d.value === capturedDocType)?.label,
        ocrStatus: 'analyzing',
        ocrData: null,
        ocrError: null,
      }
      setUploaded(prev => [...prev, entry])
      setFile(null)
      setUploading(false)

      // 2. Run OCR via Claude vision
      let ocrData = null
      let ocrError = null
      try {
        ocrData = await analyzeDocumentWithOcr(capturedFile, capturedDocType)
        // 3. Save OCR results to backend
        await updateDocumentOcr(applicationId, doc.id, {
          extractedText: JSON.stringify(ocrData),
          confidence: 0.95,
          ocrStatus: 'DONE',
        })
      } catch (e) {
        ocrError = 'OCR failed: ' + (e.message || 'unknown error')
        try {
          await updateDocumentOcr(applicationId, doc.id, {
            extractedText: null,
            confidence: null,
            ocrStatus: 'FAILED',
          })
        } catch (_) { /* ignore save failure */ }
      }

      // 4. Update entry with OCR results
      setUploaded(prev => prev.map(d =>
        d.id === doc.id
          ? { ...d, ocrStatus: ocrError ? 'failed' : 'done', ocrData, ocrError }
          : d
      ))
    } catch (e) {
      setUploading(false)
      setError('Upload failed: ' + (e.response?.data?.message || e.message))
    }
  }

  if (status !== 'MANUAL_REVIEW' && status !== 'DENIED') return null

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Upload Supporting Documents</h3>
      <p className="text-sm text-gray-500 mb-4">
        Upload documents to support your application. OCR will automatically extract key fields.
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
        <div className="space-y-3">
          {uploaded.map((doc, i) => (
            <div key={i} className="rounded-lg border border-green-100 bg-green-50 p-3">
              {/* File row */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span className="font-medium">{doc.label}</span>
                <span className="text-gray-400">—</span>
                <span className="text-gray-500 truncate">{doc.fileName}</span>
                {/* OCR status badge */}
                {doc.ocrStatus === 'analyzing' && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-blue-600">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing…
                  </span>
                )}
                {doc.ocrStatus === 'done' && (
                  <span className="ml-auto text-xs text-blue-600 font-medium">🔍 OCR done</span>
                )}
                {doc.ocrStatus === 'failed' && (
                  <span className="ml-auto text-xs text-amber-600">⚠ OCR failed</span>
                )}
              </div>
              {/* OCR results */}
              {doc.ocrStatus === 'done' && doc.ocrData && (
                <OcrResults docType={doc.documentType} data={doc.ocrData} />
              )}
              {doc.ocrStatus === 'failed' && doc.ocrError && (
                <p className="mt-1 text-xs text-amber-600">{doc.ocrError}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
