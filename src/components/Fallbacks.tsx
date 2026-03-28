'use client';

import { AlertCircle, RefreshCcw, WifiOff, Database } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Spinner size={48} className="mx-auto mb-4 text-primary" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-red-600" size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors mx-auto"
        >
          <RefreshCcw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}

export function NetworkErrorFallback({ retry }: { retry?: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="text-orange-600" size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Network Error
        </h2>
        <p className="text-gray-600 mb-4">
          Unable to connect to the server. Please check your internet connection.
        </p>
        {retry && (
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors mx-auto"
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function DataErrorFallback({ retry }: { retry?: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="text-blue-600" size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to Load Data
        </h2>
        <p className="text-gray-600 mb-4">
          We couldn&apos;t load the data. This might be a temporary issue.
        </p>
        {retry && (
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors mx-auto"
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="text-gray-400" size={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
