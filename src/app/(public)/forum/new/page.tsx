'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { BBCodeEditor } from '@/components/forum/bbcode-editor';

export default function NewTopicPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    content: '',
  });

  useEffect(() => {
    // Fetch categories
    fetch('/api/forum/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: parseInt(formData.categoryId),
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create topic');
      }

      const { post } = await response.json();
      const category = categories.find((c) => c.id === parseInt(formData.categoryId));

      toast.success('Topic created!');
      router.push(`/forum/${category?.slug}/${post.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create topic');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forum
        </Link>
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Create</span> New Topic
        </h1>
        <p className="text-gray-400 mt-2">Start a new discussion in the community</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass border border-green-500/20 rounded-2xl p-6 space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-300">
            Category
          </label>
          <select
            id="category"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-300">
            Topic Title
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter a descriptive title"
            maxLength={200}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-slate-900/50 border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            required
          />
          <div className="flex justify-end text-xs text-gray-500">
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
            placeholder="Write your topic content..."
            maxLength={10000}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-bold overflow-hidden hover-lift glow-green disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? 'Creating...' : 'Create Topic'}
            {!isLoading && <Send className="h-5 w-5" />}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </form>
    </div>
  );
}
