"use client";

import { useEffect, useState } from "react";
import { BACKGROUND_OPTIONS, type BackgroundType } from "@/components/backgrounds/BackgroundManager";
import { Check, Monitor, Undo2 } from "lucide-react";

type PrefType = BackgroundType | null;

export default function UserBackgroundSelector() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<PrefType>(null); // null = inherit

  useEffect(() => {
    fetch("/api/user/background")
      .then((r) => r.json())
      .then((d) => setCurrent((d?.preferredBackground ?? null) as PrefType))
      .finally(() => setLoading(false));
  }, []);

  const save = async (value: PrefType) => {
    setSaving(true);
    try {
      await fetch("/api/user/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ background: value }),
      });
      setCurrent(value);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass border border-green-500/20 rounded-2xl p-6">
        <div className="h-6 w-40 bg-gray-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-800/70 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass border border-green-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Background Preference</h2>
          <p className="text-gray-400 text-sm">Choose your personal background, or inherit the site default.</p>
        </div>
        <button
          className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
          onClick={() => save(null)}
          disabled={saving || current === null}
          title="Inherit site default"
        >
          <Undo2 className="h-4 w-4" /> Inherit Default
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BACKGROUND_OPTIONS.filter(o => o.type !== 'none' || true).map((opt) => (
          <button
            key={opt.type}
            onClick={() => save(opt.type)}
            className={`relative group text-left rounded-xl p-4 border transition-all bg-gray-900/50 hover:bg-gray-900/70 ${
              current === opt.type ? "border-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.25)]" : "border-white/10"
            }`}
            disabled={saving}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-gray-400">{opt.description}</div>
              </div>
              {current === opt.type ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <Monitor className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Changes take effect immediately on next navigation; backgrounds remount per page.
      </div>
    </div>
  );
}
