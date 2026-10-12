'use client';

// The last resort, when the site's own frame fails to draw: no shared styles or parts can be relied on here.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0c0e0d', color: '#fff', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
    <main style={{ padding: 24 }}>
      <title>Something went wrong — Supporter XI</title>
      <h1 style={{ margin: '0 0 12px', fontSize: 32 }}>Play has stopped</h1>
      <p role="alert" style={{ margin: '0 0 24px', color: '#b9bcb2' }}>Something went wrong. Your XI is still saved in this browser.</p>
      <button type="button" onClick={reset} style={{ minHeight: 44, padding: '0 18px', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
    </main>
  </body></html>;
}
