'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, X, ArrowRight, ShieldCheck, Wrench, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    // Load dismissed IDs from localStorage
    try {
      const saved = localStorage.getItem('secretshield_dismissed_announcements');
      if (saved) setDismissed(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }

    // Fetch announcements from API
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = (id) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      localStorage.setItem('secretshield_dismissed_announcements', JSON.stringify(Array.from(next)));
    } catch { /* ignore */ }

    // Notify backend
    fetch(`/api/announcements/${id}/read`, { method: 'POST' }).catch(() => {});
  };

  const activeAnnouncements = announcements.filter(a => !dismissed.has(a.id));
  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[0];

  const iconMap = {
    feature: Sparkles,
    security: ShieldCheck,
    maintenance: Wrench,
    documentation: FileText,
  };
  const Icon = iconMap[current.type] || Sparkles;

  return (
    <div className="relative mb-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background p-4 shadow-sm transition-all duration-300 animate-in fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 border-primary/30 text-primary">
                {current.type}
              </Badge>
              <h4 className="text-sm font-semibold text-foreground">{current.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">{current.content}</p>
            {current.actionUrl && (
              <div className="mt-2.5">
                <Link
                  href={current.actionUrl}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>{current.actionLabel || 'Learn more'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => handleDismiss(current.id)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          title="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
