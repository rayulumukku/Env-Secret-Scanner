/**
 * lib/announcements/store.js
 *
 * In-app announcements store for product updates, maintenance alerts, security notices, and docs.
 */

const ANNOUNCEMENT_TYPES = ['feature', 'maintenance', 'security', 'documentation'];

const _announcements = [
  {
    id: 'ann_launch_v1',
    type: 'feature',
    title: 'SecretShield v1.0 Launch Edition Released',
    content: 'Unified secret detection ecosystem with 50+ detection rules, VS Code Extension, CI/CD Actions, and zero external AI calls.',
    actionLabel: 'Explore Documentation',
    actionUrl: '/docs',
    pinned: true,
    publishedAt: new Date().toISOString(),
    expiresAt: null,
    author: 'SecretShield Team',
  },
  {
    id: 'ann_vscode_pack',
    type: 'feature',
    title: 'Visual Studio Code Extension Available',
    content: 'Detect secrets in real-time right in your editor with gutter icons and instant quick-fixes.',
    actionLabel: 'View Extension Guide',
    actionUrl: '/docs/integrations/editor',
    pinned: false,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: null,
    author: 'SecretShield Team',
  }
];

export function listAnnouncements(options = {}) {
  let list = [..._announcements];
  if (options.type) {
    list = list.filter(a => a.type === options.type);
  }
  return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.publishedAt) - new Date(a.publishedAt));
}

export function getAnnouncementById(id) {
  return _announcements.find(a => a.id === id) || null;
}

export function createAnnouncement(data) {
  if (!data.title || !data.content || !data.type) {
    throw new Error('Title, content, and type are required');
  }
  if (!ANNOUNCEMENT_TYPES.includes(data.type)) {
    throw new Error(`Invalid type. Allowed: ${ANNOUNCEMENT_TYPES.join(', ')}`);
  }

  const announcement = {
    id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: data.type,
    title: String(data.title).slice(0, 150),
    content: String(data.content).slice(0, 1000),
    actionLabel: data.actionLabel ? String(data.actionLabel).slice(0, 50) : null,
    actionUrl: data.actionUrl ? String(data.actionUrl).slice(0, 200) : null,
    pinned: Boolean(data.pinned),
    publishedAt: new Date().toISOString(),
    expiresAt: data.expiresAt || null,
    author: data.author || 'Administrator',
  };

  _announcements.unshift(announcement);
  return announcement;
}

export function deleteAnnouncement(id) {
  const idx = _announcements.findIndex(a => a.id === id);
  if (idx === -1) return false;
  _announcements.splice(idx, 1);
  return true;
}
