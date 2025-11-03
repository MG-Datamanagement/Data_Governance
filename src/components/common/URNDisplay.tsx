'use client';

import { useState } from 'react';
import {
  Clipboard,
  Check,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface URNDisplayProps {
  urn: string;
  variant?: 'compact' | 'expanded' | 'card';
  showLabel?: boolean;
  className?: string;
}

export default function URNDisplay({ 
  urn, 
  variant = 'expanded', 
  showLabel = true,
  className = ''
}: URNDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(variant !== 'compact');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(urn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URN:', err);
    }
  };

  // Parse URN components for color coding
  const parseURN = (urn: string) => {
    const parts = urn.split(':');
    if (parts.length >= 3) {
      const scheme = parts[0]; // 'urn'
      const namespace = parts[1]; // 'infinity'
      const resourceAndPath = parts.slice(2).join(':');
      
      // Further parse resource type and path
      const resourceMatch = resourceAndPath.match(/^([^(]+)\((.+)\)$/);
      if (resourceMatch) {
        const resourceType = resourceMatch[1];
        const resourcePath = resourceMatch[2];
        return { scheme, namespace, resourceType, resourcePath };
      }
    }
    return null;
  };

  const urnParts = parseURN(urn);

  const renderFullURN = () => (
    <div className={`group relative ${className}`}>
      <div className="flex items-start gap-3">
        {showLabel && (
          <div className="flex items-center gap-2 pt-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
              Resource URN
            </span>
          </div>
        )}
        
        <div className="flex-1">
          <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            {/* URN Content */}
            <div className="flex items-center justify-between p-3">
              <div className="flex-1 min-w-0">
                {urnParts ? (
                  <div className="font-mono text-sm flex flex-wrap items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{urnParts.scheme}</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">{urnParts.namespace}</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{urnParts.resourceType}</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-orange-600 dark:text-orange-400 break-all">({urnParts.resourcePath})</span>
                  </div>
                ) : (
                  <code className="font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
                    {urn}
                  </code>
                )}
              </div>
              
              {/* Copy Button */}
              <div className="ml-3 flex-shrink-0">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-all duration-150 shadow-sm hover:shadow"
                  title="Copy URN to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompactURN = () => (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Info className="h-3 w-3 text-blue-500" />
        <span>URN</span>
      </button>
      
      {isExpanded && (
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 max-w-xs truncate">
            {urn}
          </code>
          <button
            onClick={copyToClipboard}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Copy URN"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Clipboard className="h-3 w-3" />
            )}
          </button>
        </div>
      )}
    </div>
  );

  const renderCardURN = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          Resource Identifier
        </h4>
        <button
          onClick={copyToClipboard}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
        >
          {copied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <code className="font-mono text-sm text-gray-700 dark:text-gray-300 break-all block">
        {urn}
      </code>
    </div>
  );

  switch (variant) {
    case 'compact':
      return renderCompactURN();
    case 'card':
      return renderCardURN();
    default:
      return renderFullURN();
  }
}