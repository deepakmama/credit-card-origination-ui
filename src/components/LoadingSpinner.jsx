export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-12 h-12 mb-4">
        <div className="w-12 h-12 border-4 border-citizens-border rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-citizens-green border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-citizens-gray text-sm">{message}</p>
    </div>
  )
}
