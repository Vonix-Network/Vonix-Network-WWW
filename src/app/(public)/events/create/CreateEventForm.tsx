"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, Loader2, ArrowLeft } from "lucide-react";

export default function CreateEventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          location: location || undefined,
          startTime: new Date(startTime).toISOString(),
          endTime: endTime ? new Date(endTime).toISOString() : undefined,
          coverImage: coverImage || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create event");
      }

      const event = await res.json();
      router.push(`/events/${event.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/events" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </div>

        <div className="glass border border-brand-cyan/20 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-brand-cyan/10 rounded-xl text-brand-cyan">
              <CalendarPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Create Event</h1>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-400">{error}</div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                className="w-full px-4 py-3 glass border border-brand-cyan/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50"
                placeholder="Event title"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 glass border border-brand-cyan/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50"
                placeholder="What is this event about?"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 glass border border-brand-cyan/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50"
                  placeholder="Server spawn, Discord, etc."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-4 py-3 glass border border-brand-cyan/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 glass border border-brand-cyan/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Time (optional)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 glass border border-brand-cyan/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple text-white rounded-xl font-bold hover-lift disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {submitting ? "Creating..." : "Create Event"}
              </button>
              <Link href="/events" className="text-gray-400 hover:text-white transition-colors">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
