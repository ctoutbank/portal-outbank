'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1>❌ Erro Crítico</h1>
          <p>A aplicação encontrou um erro grave.</p>
          <button 
            onClick={reset}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Recarregar
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              marginTop: '20px',
              padding: '20px',
              background: '#fee',
              borderRadius: '8px',
              maxWidth: '800px',
              overflow: 'auto'
            }}>
              {error.message}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
