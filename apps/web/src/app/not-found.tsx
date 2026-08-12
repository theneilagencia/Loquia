import Link from 'next/link';

/** Root not-found for paths without a locale prefix. */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1>404 — Not found</h1>
          <p>
            <Link href="/pt-BR">Loquia</Link>
          </p>
        </div>
      </body>
    </html>
  );
}
