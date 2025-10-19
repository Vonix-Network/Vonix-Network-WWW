'use client';

import { useState, useEffect } from 'react';
import { Search, Users, FileText, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/date-utils';
import { AddFriendButton } from '@/components/friends/add-friend-button';
import { useSession } from 'next-auth/react';

interface SearchResult {
  type: 'user' | 'post' | 'forum';
  id: number;
  title: string;
  description: string;
  link: string;
  timestamp?: number;
  author?: string;
}

export default function SearchPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'users' | 'posts' | 'forum'>('all');

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [query, filter]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&filter=${filter}`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-5 w-5 text-blue-400" />;
      case 'post':
        return <FileText className="h-5 w-5 text-green-400" />;
      case 'forum':
        return <MessageSquare className="h-5 w-5 text-purple-400" />;
      default:
        return <Search className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-4">
          <span className="gradient-text">Search</span> Vonix Network
        </h1>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, posts, topics..."
            className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-green-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all text-lg"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400 animate-spin" />
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          {['all', 'users', 'posts', 'forum'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'bg-slate-900/30 text-gray-400 border border-white/10 hover:border-green-500/30'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {query.trim().length === 0 ? (
          <div className="glass border border-green-500/20 rounded-2xl p-12 text-center">
            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Start typing to search...</p>
          </div>
        ) : results.length === 0 && !isSearching ? (
          <div className="glass border border-green-500/20 rounded-2xl p-12 text-center">
            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No results found for "{query}"</p>
          </div>
        ) : (
          results.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="glass border border-green-500/10 rounded-xl p-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  {getIcon(result.type)}
                </div>
                <div className="flex-1">
                  <Link href={result.link} className="hover:text-green-400 transition-colors">
                    <h3 className="font-semibold text-white mb-1">{result.title}</h3>
                  </Link>
                  <p className="text-sm text-gray-400 line-clamp-2">{result.description}</p>
                  {result.timestamp && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      {result.author && <span>by {result.author}</span>}
                      <span>•</span>
                      <span>{formatTimeAgo(result.timestamp)}</span>
                    </div>
                  )}
                </div>
                {/* Add Friend button for user results */}
                {result.type === 'user' && session && session.user.id !== result.id.toString() && (
                  <div className="flex-shrink-0">
                    <AddFriendButton userId={result.id} username={result.title} variant="compact" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
