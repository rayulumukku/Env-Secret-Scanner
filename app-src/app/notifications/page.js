'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink,
  RefreshCw, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?unread=${unreadOnly}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Notifications & Security Alerts
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Real-time alerts on exposed credentials, CI pipeline runs, and member activities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`text-xs ${unreadOnly ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
            >
              {unreadOnly ? 'Showing Unread' : 'All Alerts'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadNotifications}
              className="gap-1.5 text-xs border-border/60 hover:bg-secondary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-20 px-4 border border-dashed border-border/60 rounded-2xl bg-card/20">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3 opacity-80" />
            <h3 className="text-base font-bold text-foreground">All caught up!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {unreadOnly ? 'No unread notifications.' : 'No alerts have been dispatched yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all text-xs flex items-start justify-between gap-4 ${
                  n.isRead
                    ? 'bg-card/40 border-border/40 opacity-75'
                    : 'bg-red-500/5 border-red-500/30 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.isRead ? 'bg-secondary text-muted-foreground' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="font-bold text-foreground text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-2 font-mono">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {n.link && (
                    <Link href={n.link}>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  )}

                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkRead(n.id)}
                      className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Mark read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
