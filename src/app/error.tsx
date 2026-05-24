'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong!</h1>
      <p style={{ color: 'var(--muted)' }}>{error.toString()}</p>
      <button
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--card)',
          color: 'var(--foreground)',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
