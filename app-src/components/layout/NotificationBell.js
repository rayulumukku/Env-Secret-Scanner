'use client';

import { useState, useEffect } from 'react';
import { Bell, ShieldAlert, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  function fetchNotifications() {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.isRead).length);
        }
      })
      .catch(() => {});
  }

  function markAsRead(id) {
    fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      .then(() => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      })
      .catch(() => {});
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Notifications {unreadCount > 0 && `(${unreadCount} new)`}
              </span>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                View all
              </Link>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-400 opacity-60" />
                  No new security alerts
                </div>
              ) : (
                notifications.slice(0, 5).map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                      notif.isRead
                        ? 'bg-secondary/20 border-border/30 opacity-70'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">{notif.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</div>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1 font-medium"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
