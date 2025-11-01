'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  icon: string | null;
  orderIndex: number;
}

interface CategoryFormProps {
  category?: Category;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    slug: category?.slug || '',
    icon: category?.icon || '📁',
    orderIndex: category?.orderIndex || 0,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: category ? prev.slug : generateSlug(name), // Only auto-generate for new categories
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = category
        ? `/api/moderation/categories/${category.id}`
        : '/api/moderation/categories';
      
      const method = category ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }

      // Success - redirect to moderation dashboard
      router.push('/moderation');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/moderation/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      // Success - redirect to moderation dashboard
      router.push('/moderation');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">Error</p>
            <p className="text-sm text-gray-300 mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="General Discussion"
            required
            maxLength={100}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400">
            The display name for this category
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="A brief description of what this category is for"
            rows={3}
            maxLength={500}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400">
            Optional description shown below the category name
          </p>
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug *</Label>
          <Input
            id="slug"
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="general-discussion"
            required
            pattern="[a-z0-9-]+"
            maxLength={100}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400">
            URL-friendly identifier (lowercase letters, numbers, and hyphens only)
          </p>
        </div>

        {/* Icon */}
        <div className="space-y-2">
          <Label htmlFor="icon">Icon/Emoji</Label>
          <div className="flex gap-2">
            <Input
              id="icon"
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="📁"
              maxLength={10}
              disabled={isLoading}
              className="w-20 text-2xl text-center"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                Current icon: <span className="text-2xl">{formData.icon}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Emoji or icon to display next to the category name
          </p>
        </div>

        {/* Order Index */}
        <div className="space-y-2">
          <Label htmlFor="orderIndex">Display Order</Label>
          <Input
            id="orderIndex"
            type="number"
            value={formData.orderIndex}
            onChange={(e) => setFormData(prev => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
            placeholder="0"
            min={0}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400">
            Lower numbers appear first (0 = highest priority)
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div>
          {category && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {!isDeleting && <Trash2 className="h-4 w-4 mr-2" />}
              Delete Category
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading || isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isDeleting}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {!isLoading && <Save className="h-4 w-4 mr-2" />}
            {category ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </div>
    </form>
  );
}
