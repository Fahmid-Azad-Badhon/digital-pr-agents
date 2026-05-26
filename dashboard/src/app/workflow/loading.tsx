export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#7209B7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading...</p>
      </div>
    </div>
  )
}