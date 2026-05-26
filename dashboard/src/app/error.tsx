'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error.tsx]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111827] p-6">
      <div className="max-w-xl w-full rounded-xl border border-[#334155] bg-[#1E293B] p-6">
        <h1 className="text-xl font-semibold text-white mb-3">Something went wrong</h1>
        <p className="text-sm text-[#94A3B8] mb-4">
          We hit an unexpected error while loading this page.
        </p>
        <p className="text-xs text-[#64748B] mb-6 break-all">
          {error.message || 'Unexpected application error.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

