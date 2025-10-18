'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  description: string;
  color: string | null;
}

interface NewTopicFormProps {
  categories: Category[];
}

export function NewTopicForm({ categories }: NewTopicFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategory = categories.find(cat => cat.id.toString() === formData.category_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Please enter content for your topic');
      return;
    }

    if (!formData.category_id) {
      toast.error('Please select a category');
      return;
    }

    if (formData.title.length > 200) {
      toast.error('Title is too long (max 200 characters)');
      return;
    }

    if (formData.content.length > 10000) {
      toast.error('Content is too long (max 10,000 characters)');
      return;
    }

    // Show warnings for very short content but don't block submission
    if (formData.title.length < 5) {
      toast.warning('Consider making your title more descriptive (at least 5 characters recommended)');
    }

    if (formData.content.length < 20) {
      toast.warning('Consider adding more detail to your post (at least 20 characters recommended)');
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          categoryId: parseInt(formData.category_id),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create topic');
      }

      const result = await response.json();
      toast.success('Topic created successfully!');
      router.push(`/forum/topic/${result.post.id}`);
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Topic Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter a clear, descriptive title..."
          maxLength={200}
          className="text-lg"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Make it descriptive and engaging</span>
          <span>{formData.title.length}/200</span>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category_id} onValueChange={(value: string) => handleInputChange('category_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color || '#10b981' }}
                  />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategory && (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              style={{ borderColor: selectedCategory.color || '#10b981' }}
            >
              {selectedCategory.name}
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCategory.description}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="Share your thoughts, ask questions, or start a discussion..."
          className="min-h-[300px] resize-none"
          maxLength={50000}
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Use clear formatting and be detailed</span>
          <span>{formData.content.length}/50,000</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Link href="/forum">
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Button>
        </Link>

        <Button
          type="submit"
          disabled={isSubmitting || !formData.title.trim() || !formData.content.trim() || !formData.category_id}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Topic...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Create Topic
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
