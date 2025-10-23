'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Lock, Globe } from 'lucide-react';
import Link from 'next/link';

interface Group {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  creatorUsername: string;
  privacy: 'public' | 'private';
  memberCount: number;
  userRole?: string;
  createdAt: Date;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/groups?my=true'),
      ]);

      if (allRes.ok) {
        const data = await allRes.json();
        setGroups(data);
      }

      if (myRes.ok) {
        const data = await myRes.json();
        setMyGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = (activeTab === 'my' ? myGroups : groups).filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Community Groups
          </h1>
          <p className="text-gray-400 mt-2">
            Join or create groups to connect with other players
          </p>
        </div>
        <Link
          href="/groups/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'discover'
              ? 'text-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Discover
          {activeTab === 'discover' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-cyan-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'my'
              ? 'text-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Groups
          {activeTab === 'my' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-cyan-600" />
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-800/50 border border-purple-500/30 rounded-lg overflow-hidden animate-pulse"
            >
              <div className="h-32 bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {search
              ? 'No groups found matching your search'
              : activeTab === 'my'
              ? "You haven't joined any groups yet"
              : 'No groups available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="bg-gray-800/50 border border-purple-500/30 rounded-lg overflow-hidden hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all group"
            >
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 relative overflow-hidden">
                {group.coverImage ? (
                  <img
                    src={group.coverImage}
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-12 h-12 text-purple-400/50" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                    {group.name}
                  </h3>
                  {group.privacy === 'private' ? (
                    <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>

                {group.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {group.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{group.memberCount} members</span>
                  </div>
                  {group.userRole && (
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                      {group.userRole}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
