'use client';

import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Award, Clock } from 'lucide-react';
import { XPBadge } from './xp-badge';
import { XPProgressBar } from './xp-progress-bar';

interface XPData {
  user: {
    id: number;
    username: string;
    xp: number;
    level: number;
    title: string;
    levelColor: string;
  };
  progress: {
    level: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
    percentage: number;
  };
  recentTransactions: Array<{
    amount: number;
    source: string;
    description: string;
    createdAt: Date;
  }>;
}

export function XPCard() {
  const [data, setData] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchXPData();
  }, []);

  const fetchXPData = async () => {
    try {
      const response = await fetch('/api/xp');
      if (response.ok) {
        const xpData = await response.json();
        setData(xpData);
      }
    } catch (error) {
      console.error('Error fetching XP data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass border border-purple-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-20 bg-gray-700 rounded-lg mb-4" />
        <div className="h-4 bg-gray-700 rounded w-3/4" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="glass border border-purple-500/20 rounded-2xl p-6 hover-lift">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <XPBadge 
              level={data.user.level} 
              xp={data.user.xp}
              levelColor={data.user.levelColor}
              size="lg"
            />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {data.user.title}
          </h3>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">Total XP</div>
          <div className="text-2xl font-bold text-white">
            {data.user.xp.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <XPProgressBar
        currentXP={data.progress.currentLevelXP}
        nextLevelXP={data.progress.nextLevelXP}
        level={data.user.level}
        levelColor={data.user.levelColor}
        showNumbers={true}
      />

      {/* Recent Activity */}
      {data.recentTransactions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {data.recentTransactions.slice(0, 5).map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/30"
              >
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-sm text-gray-300">
                    {transaction.description}
                  </span>
                </div>
                <span className={`text-sm font-bold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="glass border border-blue-500/20 rounded-lg p-4 text-center">
          <TrendingUp className="h-6 w-6 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{data.user.level}</div>
          <div className="text-xs text-gray-400">Current Level</div>
        </div>
        
        <div className="glass border border-purple-500/20 rounded-lg p-4 text-center">
          <Award className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{data.progress.percentage.toFixed(0)}%</div>
          <div className="text-xs text-gray-400">To Next Level</div>
        </div>
      </div>
    </div>
  );
}
