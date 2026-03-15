/** Shimmer skeleton for loading states */

function Base({ className = '' }: { className?: string }) {
  return (
    <div
      className={`shimmer rounded-lg ${className}`}
      role="status"
      aria-label="Loading…"
    />
  )
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <Base className="h-4 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Base key={i} className={`h-3 ${i === rows - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <Base className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2.5 pt-0.5">
        <Base className="h-6 w-16" />
        <Base className="h-3 w-28" />
      </div>
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-2.5">
        <Base className="h-7 w-48" />
        <Base className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><SkeletonCard rows={6} /></div>
        <SkeletonCard rows={4} />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Base className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Base className="h-3.5 w-3/4" />
            <Base className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonResearchCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
      <Base className="h-3.5 w-24 rounded-full" />
      <Base className="h-5 w-full" />
      <Base className="h-4 w-5/6" />
      <div className="flex gap-3 pt-1">
        <Base className="h-3 w-20" />
        <Base className="h-3 w-16" />
        <Base className="h-3 w-14" />
      </div>
    </div>
  )
}

export default Base
