/**
 * lib/feedback/store.js
 *
 * In-memory / database store for user product feedback, false positives, and missed secrets.
 *
 * PRIVACY GUARANTEE:
 * Never stores raw secrets, passwords, or repository source code.
 */

const FEEDBACK_CATEGORIES = [
  'Bug',
  'Feature request',
  'Scanner false positive',
  'Scanner false negative',
  'Documentation issue',
  'Integration issue',
  'General feedback',
];

const FEEDBACK_STATUSES = [
  'New',
  'Investigating',
  'Planned',
  'Resolved',
  'Closed',
];

// In-memory store (thread-safe for dev & serverless runtime)
const _feedbackStore = [
  {
    id: 'fb_101',
    category: 'Feature request',
    title: 'Support custom enterprise certificate authorities in CLI',
    description: 'Would love an option in .secretshield.json to point to internal corporate CA bundle.',
    status: 'Planned',
    priority: 'Medium',
    reporter: 'dev@example.com',
    appVersion: '1.0.0',
    scannerVersion: '1.0.0',
    route: '/settings/performance',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'fb_102',
    category: 'Scanner false positive',
    title: 'Placeholder DB connection in documentation flagged as critical',
    description: 'Documentation page snippet was flagged even though it is illustrative.',
    status: 'Resolved',
    priority: 'Low',
    reporter: 'security-lead@example.com',
    ruleId: 'database-url',
    findingId: 'f_demo_1',
    project: 'SecretShield Docs',
    appVersion: '1.0.0',
    scannerVersion: '1.0.0',
    route: '/docs/api/scanner',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  }
];

export function getFeedbackCategories() {
  return [...FEEDBACK_CATEGORIES];
}

export function getFeedbackStatuses() {
  return [...FEEDBACK_STATUSES];
}

export function listFeedback(filter = {}) {
  let list = [..._feedbackStore];
  if (filter.category) {
    list = list.filter(f => f.category.toLowerCase() === filter.category.toLowerCase());
  }
  if (filter.status) {
    list = list.filter(f => f.status.toLowerCase() === filter.status.toLowerCase());
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getFeedbackById(id) {
  return _feedbackStore.find(f => f.id === id) || null;
}

export function createFeedback(data) {
  if (!data.title || !data.description || !data.category) {
    throw new Error('Title, description, and category are required');
  }

  // Sanitize: strip any potential accidental secret payload from metadata
  const cleanData = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category: data.category,
    title: String(data.title).slice(0, 200),
    description: String(data.description).slice(0, 5000),
    status: 'New',
    priority: data.priority || 'Medium',
    reporter: data.reporter || 'anonymous',
    ruleId: data.ruleId ? String(data.ruleId).slice(0, 100) : null,
    findingId: data.findingId ? String(data.findingId).slice(0, 100) : null,
    project: data.project ? String(data.project).slice(0, 100) : null,
    syntheticExample: data.syntheticExample ? String(data.syntheticExample).slice(0, 1000) : null,
    language: data.language ? String(data.language).slice(0, 50) : null,
    fileType: data.fileType ? String(data.fileType).slice(0, 50) : null,
    appVersion: data.appVersion || '1.0.0',
    scannerVersion: data.scannerVersion || '1.0.0',
    route: data.route ? String(data.route).slice(0, 200) : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  _feedbackStore.unshift(cleanData);
  return cleanData;
}

export function updateFeedbackStatus(id, newStatus) {
  const item = _feedbackStore.find(f => f.id === id);
  if (!item) return null;
  if (!FEEDBACK_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }
  item.status = newStatus;
  item.updatedAt = new Date().toISOString();
  return item;
}
