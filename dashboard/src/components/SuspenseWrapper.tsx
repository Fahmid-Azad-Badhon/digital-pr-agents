'use client'

import { Suspense } from 'react'

export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>{children}</Suspense>
}