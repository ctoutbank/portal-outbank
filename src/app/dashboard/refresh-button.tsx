'use client';

import { useState } from 'react';
import { refreshDashboard } from './actions';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setMessage('');
      
      const result = await refreshDashboard();
      
      setMessage(result.message);
      
      // Recarregar a página após atualização
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage('Erro ao atualizar');
      console.error('Erro ao atualizar dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col items-end space-y-2">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        <ArrowPathIcon 
          className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Dashboard'}</span>
      </button>
      
      {message && (
        <p className={`text-sm ${
          message.includes('sucesso') ? 'text-green-600' : 'text-red-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
} 