
'use client';
import React, { useState, useEffect, useRef, MutableRefObject } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Search, Settings, User, Bell, Loader2, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';
import Image from 'next/image';
import { useDebounce } from "@/hooks/useDebounce";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Suggestion = {
  id: number;
  text: string;
  type: string;
};

export function Header() {

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const debouncedSearch = useDebounce(query, 600);
  const abortControllerRef = useRef<AbortController | null>(null);


  useEffect(() => {
    if (debouncedSearch.trim() === "") {
      setSuggestions([]);
      return;
    }

    fetchSuggestions(debouncedSearch);
  }, [debouncedSearch]);


  function groupByType(suggestions: Suggestion[]) {
    return suggestions.reduce((groups: Record<string, Suggestion[]>, item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
      return groups;
    }, {});
  }


  const fetchSuggestions = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const res = await axios.get(
        `${API_URL}/search/suggestions?q=${encodeURIComponent(q)}`, {
        signal: abortControllerRef.current?.signal
      }
      );

      setSuggestions(res.data.suggestions || []);
      if (!res.data.suggestions.length) {
        toast.error("No, Search results matching query! Try with different query.")
      }
    } catch (err) {
      console.error("Error fetching suggestions", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
  };

  const handleClearSearch = () => {
    setQuery("");
    setSuggestions([]);
    abortControllerRef.current?.abort();
  }

  const handleSelect = (s: Suggestion) => {
    const path = s.type === 'tables' ? 'catalog' : s.type;
    const route = `/${path}/${s.id}`;
    router.push(route as any);
    setSuggestions([]);
  };


  const grouped = groupByType(suggestions);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200/60 dark:border-slate-700/60">
      <div className="px-6 py-4 max-w-[100%]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="h-12 w-12 relative">
                <Image
                  src="/icons/logo.png"
                  alt="Infinity Governance Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                Infinity Governance
              </div>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              {/* Search icon */}
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />

              {/* Input */}
              <input
                type="text"
                placeholder="Search tables, domains, tags..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                value={query}
                onChange={handleChange}
              />
              {loading && (
                <Loader2 className="absolute right-3 top-4 h-5 w-5 text-gray-400 animate-spin" />
              )}
              {((suggestions || []) && query) && (
                <button type="button" title='Clear Search' onClick={handleClearSearch} className="absolute right-12 top-4">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}

              {/* Suggestions dropdown */}

              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 rounded-xl shadow-lg z-50 max-h-64 overflow-auto">
                  {Object.keys(grouped).map((type) =>
                    grouped[type].map((s) => (
                      <div
                        key={`${type}-${s.id}`}
                        onClick={() => handleSelect(s)}
                        className="flex justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer"
                      >
                        <span className="text-slate-900 dark:text-white">{s.text}</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${type === 'tags'
                            ? 'bg-green-100 text-green-600 shadow-[0_0_8px_rgba(34,197,94,0.7)]'
                            : type === 'domains'
                              ? 'bg-blue-100 text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.7)]'
                              : 'bg-red-100 text-red-600 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                            }`}
                        >
                          {type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}