const STATUS_STYLES = {
  SUBMITTED:           'bg-gray-100 text-gray-600',
  KYC_REVIEW:          'bg-blue-50 text-blue-700 border border-blue-200',
  FRAUD_SCREENING:     'bg-amber-50 text-amber-700 border border-amber-200',
  CREDIT_REVIEW:       'bg-citizens-green-light text-citizens-green-dark border border-citizens-green/20',
  INCOME_VERIFICATION: 'bg-teal-50 text-teal-700 border border-teal-200',
  CARD_ISSUED:         'bg-citizens-green-light text-citizens-green-dark border border-citizens-green/30',
  DENIED:              'bg-red-50 text-red-700 border border-red-200',
  MANUAL_REVIEW:       'bg-amber-50 text-amber-700 border border-amber-200',
  AUTH_USER_ADDED:     'bg-citizens-green-light text-citizens-green-dark border border-citizens-green/30',
  AUTH_USER_SKIPPED:   'bg-gray-100 text-gray-600',
  BALANCE_TRANSFER_INITIATED: 'bg-blue-50 text-blue-700 border border-blue-200',
}

const STATUS_DOTS = {
  SUBMITTED:           'bg-gray-400',
  KYC_REVIEW:          'bg-blue-500',
  FRAUD_SCREENING:     'bg-amber-500',
  CREDIT_REVIEW:       'bg-citizens-green',
  INCOME_VERIFICATION: 'bg-teal-500',
  CARD_ISSUED:         'bg-citizens-green',
  DENIED:              'bg-red-500',
  MANUAL_REVIEW:       'bg-amber-500',
  AUTH_USER_ADDED:     'bg-citizens-green',
  AUTH_USER_SKIPPED:   'bg-gray-400',
  BALANCE_TRANSFER_INITIATED: 'bg-blue-500',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
  const dot   = STATUS_DOTS[status]  || 'bg-gray-400'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status?.replace(/_/g, ' ')}
    </span>
  )
}
