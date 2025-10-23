'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Users, Globe, Lock, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface GroupData {
  id: number;
  name: string;
  description: string | null;
  coverImage: string | null;
  privacy: 'public' | 'private';
  creatorId: number;
}

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const [group, setGroup] = useState<GroupData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverImage: '',
    privacy: 'public',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          coverImage: data.coverImage || '',
          privacy: data.privacy,
        });
      } else if (res.status === 404) {
        toast.error('Group not found');
        router.push('/groups');
      } else if (res.status === 403) {
        toast.error('You do not have permission to edit this group');
        router.push(`/groups/${groupId}`);
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (formData.name.length > 100) {
      toast.error('Group name must be 100 characters or less');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          coverImage: formData.coverImage.trim() || null,
          privacy: formData.privacy,
        }),
      });

      if (res.ok) {
        toast.success('Group updated successfully!');
        router.push(`/groups/${groupId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this group? This will remove all members and cannot be undone!')) {
      return;
    }

    if (!confirm('Are you absolutely sure? This action is permanent!')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Group deleted successfully');
        router.push('/groups');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-800 rounded-lg" />
          <div className="h-48 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <p className="text-gray-400">Group not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Group
        </Link>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Group Settings
        </h1>
        <p className="text-gray-400 mt-2">
          Manage {group.name}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
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
            disabled={saving || deleting}
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
            disabled={saving || deleting}
          />
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
            disabled={saving || deleting}
          />
          
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
              disabled={saving || deleting}
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
              disabled={saving || deleting}
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
        <div className="flex flex-col md:flex-row gap-4">
          <button
            type="submit"
            disabled={saving || deleting || !formData.name.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-gray-400 mb-4">
            Once you delete a group, there is no going back. All members will be removed and all data will be permanently deleted.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? 'Deleting...' : 'Delete Group'}
          </button>
        </div>
      </form>
    </div>
  );
}
