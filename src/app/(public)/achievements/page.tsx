'use client';

import { useState, useEffect } from 'react';
import { Trophy, Award, Star, Lock, CheckCircle, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social' | 'forum' | 'leveling' | 'special';
  xpReward: number;
  unlocked: boolean;
  progress: number;
  unlockedAt?: Date;
}

interface AchievementData {
  achievements: Achievement[];
  grouped: {
    social: Achievement[];
    forum: Achievement[];
    leveling: Achievement[];
    special: Achievement[];
  };
  stats: {
    total: number;
    unlocked: number;
    locked: number;
    percentage: number;
    totalXPEarned: number;
  };
}

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchAchievements();
    }
  }, [status, router]);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/xp/achievements');
      if (response.ok) {
        const achievementData = await response.json();
        setData(achievementData);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="container mx-auto px-4 py-20">
          <div className="glass border border-purple-500/20 rounded-2xl p-8 animate-pulse">
            <div className="h-12 w-64 bg-gray-700 rounded mb-6" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-gray-400">Failed to load achievements</p>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'all', name: 'All', icon: Trophy, count: data.stats.total },
    { id: 'social', name: 'Social', icon: Star, count: data.grouped.social.length },
    { id: 'forum', name: 'Forum', icon: TrendingUp, count: data.grouped.forum.length },
    { id: 'leveling', name: 'Leveling', icon: Award, count: data.grouped.leveling.length },
    { id: 'special', name: 'Special', icon: Trophy, count: data.grouped.special.length },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? data.achievements
    : data.grouped[selectedCategory as keyof typeof data.grouped] || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="fade-in-up">
          <div className="inline-block mb-4 px-4 py-2 glass rounded-full border border-yellow-500/20">
            <span className="text-sm text-yellow-400 font-medium">🏆 Achievements</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text-animated">Your Journey</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track your progress and unlock rewards
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container mx-auto px-4 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass border border-green-500/20 rounded-xl p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{data.stats.unlocked}</div>
            <div className="text-sm text-gray-400">Unlocked</div>
          </div>
          
          <div className="glass border border-gray-500/20 rounded-xl p-6 text-center">
            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{data.stats.locked}</div>
            <div className="text-sm text-gray-400">Locked</div>
          </div>
          
          <div className="glass border border-blue-500/20 rounded-xl p-6 text-center">
            <Trophy className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{data.stats.percentage}%</div>
            <div className="text-sm text-gray-400">Complete</div>
          </div>
          
          <div className="glass border border-purple-500/20 rounded-xl p-6 text-center">
            <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{data.stats.totalXPEarned}</div>
            <div className="text-sm text-gray-400">XP Earned</div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 pb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'glass border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.name}
                <span className="text-xs opacity-75">({category.count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Achievements Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`glass border rounded-2xl p-6 hover-lift transition-all ${
                achievement.unlocked
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-gray-500/20'
              }`}
            >
              {/* Icon */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`text-4xl w-16 h-16 rounded-full flex items-center justify-center ${
                    achievement.unlocked
                      ? 'bg-green-500/20 border-2 border-green-500/50'
                      : 'bg-gray-700/50 border-2 border-gray-600/50'
                  }`}
                >
                  {achievement.unlocked ? achievement.icon : '🔒'}
                </div>
                {achievement.unlocked && (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                )}
              </div>

              {/* Name & Description */}
              <h3 className={`text-xl font-bold mb-2 ${
                achievement.unlocked ? 'text-white' : 'text-gray-400'
              }`}>
                {achievement.name}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {achievement.description}
              </p>

              {/* XP Reward */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Star className={`h-4 w-4 ${
                    achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm font-bold ${
                    achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    +{achievement.xpReward} XP
                  </span>
                </div>
                {achievement.unlocked && achievement.unlockedAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-20">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No achievements in this category yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
