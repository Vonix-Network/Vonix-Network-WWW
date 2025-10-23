'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Lock, Globe, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateGroupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverImage: '',
    privacy: 'public',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (formData.name.length > 100) {
      toast.error('Group name must be 100 characters or less');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          coverImage: formData.coverImage.trim() || null,
          privacy: formData.privacy,
        }),
      });

      if (res.ok) {
        const group = await res.json();
        toast.success('Group created successfully!');
        router.push(`/groups/${group.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </Link>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Create New Group
        </h1>
        <p className="text-gray-400 mt-2">
          Start a community for players with shared interests
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Group Name */}
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Group Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Skyblock Enthusiasts"
            maxLength={100}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            disabled={loading}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">Max 100 characters</span>
            <span className={`text-xs ${formData.name.length > 90 ? 'text-red-400' : 'text-gray-500'}`}>
              {formData.name.length}/100
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell members what this group is about..."
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-2">
            Describe the group's purpose, rules, or activities
          </p>
        </div>

        {/* Cover Image */}
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Cover Image URL (Optional)
          </label>
          <input
            type="url"
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            placeholder="https://example.com/cover.jpg"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-2">
            Add a banner image to make your group stand out
          </p>
          
          {/* Preview */}
          {formData.coverImage && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="h-32 rounded-lg overflow-hidden bg-gray-900">
                <img
                  src={formData.coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    toast.error('Invalid image URL');
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Privacy */}
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
          <label className="block text-sm font-semibold text-gray-300 mb-4">
            Privacy Setting
          </label>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, privacy: 'public' })}
              disabled={loading}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                formData.privacy === 'public'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                formData.privacy === 'public' ? 'bg-purple-600' : 'bg-gray-700'
              }`}>
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">Public</p>
                <p className="text-sm text-gray-400">
                  Anyone can find and join this group
                </p>
              </div>
              {formData.privacy === 'public' && (
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, privacy: 'private' })}
              disabled={loading}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                formData.privacy === 'private'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                formData.privacy === 'private' ? 'bg-purple-600' : 'bg-gray-700'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">Private</p>
                <p className="text-sm text-gray-400">
                  Only invited members can join
                </p>
              </div>
              {formData.privacy === 'private' && (
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/groups"
            className="flex-1 px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Users className="w-5 h-5" />
                Create Group
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
