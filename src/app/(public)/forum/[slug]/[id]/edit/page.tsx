'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { BBCodeEditor } from '@/components/forum/bbcode-editor';

export default function EditForumPostPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [post, setPost] = useState<any>(null);

  const postId = params.id as string;
  const categorySlug = params.slug as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchPost();
    }
  }, [status, postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();
      
      // Check if user is author or moderator
      if (data.post.authorId !== parseInt(session?.user?.id || '0') && 
          session?.user?.role !== 'admin' && 
          session?.user?.role !== 'moderator') {
        toast.error('You do not have permission to edit this post');
        router.push(`/forum/${categorySlug}/${postId}`);
        return;
      }

      setPost(data.post);
      setFormData({
        title: data.post.title,
        content: data.post.content,
      });
    } catch (error) {
      toast.error('Failed to load post');
      router.push('/forum');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update post');
      }

      toast.success('Post updated successfully');
      router.push(`/forum/${categorySlug}/${postId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update post');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/forum/${categorySlug}/${postId}`}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit Post</h1>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass border border-green-500/20 rounded-2xl p-6">
          {/* Title */}
          <div className="space-y-2 mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter post title..."
              maxLength={200}
              className="w-full px-4 py-3 bg-slate-900 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
              required
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.title.length} / 200
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-300">
              Content
            </label>
            <BBCodeEditor
              value={formData.content}
              onChange={(content: string) => setFormData({ ...formData, content })}
              placeholder="Edit your post content..."
              maxLength={10000}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/forum/${categorySlug}/${postId}`}
            className="px-6 py-3 border border-gray-500/30 text-gray-300 rounded-lg hover:border-gray-500/50 hover:bg-white/5 transition-all font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover-lift glow-green disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
