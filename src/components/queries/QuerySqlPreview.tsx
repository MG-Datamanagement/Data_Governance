"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

interface QuerySqlPreviewProps {
  sql: string;
  tags?: string[];
  className?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
}

const QuerySqlPreview: React.FC<QuerySqlPreviewProps> = ({
  sql,
  tags = [],
  className = "",
  maxHeight = "200px",
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightSql = (text: string) => {
    const keywords = [
      "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "LIMIT",
      "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER",
      "TABLE", "INTO", "VALUES", "SET", "JOIN", "LEFT", "RIGHT",
      "INNER", "OUTER", "ON", "AND", "OR", "NOT", "IN", "IS",
      "NULL", "AS", "DISTINCT", "UNION", "ALL", "CASE", "WHEN",
      "THEN", "ELSE", "END", "WITH", "RECURSIVE", "DESC", "ASC",
    ];

    let highlighted = text;

    // Highlighting strings
    highlighted = highlighted.replace(
      /('[^']*'|"[^"]*")/g,
      '<span class="text-emerald-400 font-medium">$1</span>'
    );

    // Highlighting keywords (Indigo/Blueish in dark mode)
    const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    highlighted = highlighted.replace(
      keywordRegex,
      (match) => `<span class="text-blue-400 font-bold">${match.toUpperCase()}</span>`
    );

    // Highlighting comments
    highlighted = highlighted.replace(
       /(--.*$|\/\*[\s\S]*?\*\/)/gm,
      '<span class="text-gray-500 italic">$1</span>'
    );

    return highlighted;
  };

  const lines = sql.split("\n");

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden bg-gray-100 border border-gray-300 ${className}`}>
      {/* Dark Header Bar */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-gray-300 bg-gray-200">
        <div className="flex items-center gap-2 text-gray-800">
          <Terminal size={12} className="text-gray-800" />
          <span className="text-[10px] font-bold uppercase tracking-widest">SQL</span>
        </div>
        
        {/* Header Tags (e.g., dataset names) */}
        <div className="flex items-center gap-2">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className="px-2 py-0.5 rounded bg-gray-300 text-gray-700 text-[9px] font-bold border border-gray-400 uppercase"
            >
              {tag}
            </span>
          ))}
          <button
            onClick={handleCopy}
            className="ml-2 p-1 rounded-md hover:bg-gray-400 text-gray-800 hover:text-white transition-all flex items-center gap-1.5"
            title="Copy Code"
          >
            {copied ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} />
            )}
            <span className="text-[9px] font-bold uppercase">Copy</span>
          </button>
        </div>
      </div>

      {/* SQL Content with Line Numbers */}
      <div 
        className="flex overflow-auto font-mono text-[13px] leading-6 py-4 px-2 custom-scrollbar"
        style={{ maxHeight }}
      >
        {showLineNumbers && (
          <div className="flex flex-col text-right px-3 text-gray-600 select-none border-r border-[#1e293b] mr-3">
            {lines.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
        )}
        <div 
          className="flex-1 text-gray-800 whitespace-pre px-1"
          dangerouslySetInnerHTML={{ __html: highlightSql(sql) }}
        />
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e5e7eb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default QuerySqlPreview;
