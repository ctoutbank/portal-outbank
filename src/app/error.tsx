'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      url: window.location.href
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Algo deu errado
          </h2>
          <p className="text-gray-600">
            Encontramos um problema ao carregar a aplicação.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-red-50 p-4 rounded border border-red-200">
            <summary className="cursor-pointer font-medium text-red-800 mb-2">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="text-xs text-red-700 overflow-auto whitespace-pre-wrap">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-3">
          <button 
            onClick={reset}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Voltar para início
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}
