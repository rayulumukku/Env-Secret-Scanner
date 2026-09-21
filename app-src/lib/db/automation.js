/**
 * lib/db/automation.js
 *
 * Database persistence and query layer for Autonomous Security Operations & Continuous Protection.
 * Supports PostgreSQL via Prisma and high-performance in-memory fallback with strict tenant scoping.
 */

import { getDb, memoryDb } from './client.js';
import { randomUUID } from 'crypto';

// ── SECURITY EVENTS ──────────────────────────────────────────────────────────

export async function saveSecurityEvent(eventData) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.securityEvent.create({
      data: {
        id: eventData.id,
        organizationId: eventData.organizationId,
        projectId: eventData.projectId,
        repositoryId: eventData.repositoryId,
        eventType: eventData.eventType,
        source: eventData.source,
        actor: eventData.actor,
        severity: eventData.severity,
        category: eventData.category,
        correlationId: eventData.correlationId,
        relatedFindingIdsJson: JSON.stringify(eventData.relatedFindingIds || []),
        relatedFingerprintsJson: JSON.stringify(eventData.relatedFingerprints || []),
        evidenceIdsJson: JSON.stringify(eventData.evidenceIds || []),
        metadataJson: JSON.stringify(eventData.metadata || {}),
        timestamp: new Date(eventData.timestamp || Date.now()),
      },
    });
  }

  memoryDb.securityEvents.set(eventData.id, eventData);
  return eventData;
}

export async function listSecurityEvents({
  organizationId,
  repositoryId = null,
  eventType = null,
  severity = null,
  limit = 50,
  offset = 0,
}) {
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const where = { organizationId };
    if (repositoryId) where.repositoryId = repositoryId;
    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;

    const [events, total] = await Promise.all([
      client.securityEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      client.securityEvent.count({ where }),
    ]);

    return {
      events: events.map(e => ({
        ...e,
        relatedFindingIds: e.relatedFindingIdsJson ? JSON.parse(e.relatedFindingIdsJson) : [],
        relatedFingerprints: e.relatedFingerprintsJson ? JSON.parse(e.relatedFingerprintsJson) : [],
        evidenceIds: e.evidenceIdsJson ? JSON.parse(e.evidenceIdsJson) : [],
        metadata: e.metadataJson ? JSON.parse(e.metadataJson) : {},
      })),
      total,
    };
  }

  let events = Array.from(memoryDb.securityEvents.values());
  if (organizationId) {
    events = events.filter(e => e.organizationId === organizationId);
  }
  if (repositoryId) {
    events = events.filter(e => e.repositoryId === repositoryId);
  }
  if (eventType) {
    events = events.filter(e => e.eventType === eventType);
  }
  if (severity) {
    events = events.filter(e => e.severity === severity);
  }

  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const total = events.length;
  const paginated = events.slice(offset, offset + limit);

  return { events: paginated, total };
}

// ── PLAYBOOKS ────────────────────────────────────────────────────────────────

export async function createPlaybook(playbookData) {
  const { isPostgres, client } = await getDb();
  const id = playbookData.id || `pb_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const record = {
    ...playbookData,
    id,
    version: playbookData.version || '1.0.0',
    isEnabled: playbookData.isEnabled !== false,
    approvalRequired: Boolean(playbookData.approvalRequired),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isPostgres) {
    return await client.playbook.create({
      data: {
        id: record.id,
        organizationId: record.organizationId,
        name: record.name,
        description: record.description,
        isEnabled: record.isEnabled,
        version: record.version,
        conditionsJson: JSON.stringify(record.conditions || []),
        actionsJson: JSON.stringify(record.actions || []),
        approvalRequired: record.approvalRequired,
      },
    });
  }

  memoryDb.playbooks.set(id, record);
  return record;
}

export async function listPlaybooks({ organizationId, isEnabled = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (isEnabled !== null) where.isEnabled = isEnabled;
    const playbooks = await client.playbook.findMany({ where, orderBy: { createdAt: 'desc' } });
    return playbooks.map(p => ({
      ...p,
      conditions: p.conditionsJson ? JSON.parse(p.conditionsJson) : [],
      actions: p.actionsJson ? JSON.parse(p.actionsJson) : [],
    }));
  }

  let playbooks = Array.from(memoryDb.playbooks.values());
  if (organizationId) {
    playbooks = playbooks.filter(p => p.organizationId === organizationId);
  }
  if (isEnabled !== null) {
    playbooks = playbooks.filter(p => p.isEnabled === isEnabled);
  }
  return playbooks;
}

export async function getPlaybookById(id, organizationId) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const p = await client.playbook.findFirst({ where: { id, organizationId } });
    if (!p) return null;
    return {
      ...p,
      conditions: p.conditionsJson ? JSON.parse(p.conditionsJson) : [],
      actions: p.actionsJson ? JSON.parse(p.actionsJson) : [],
    };
  }

  const p = memoryDb.playbooks.get(id);
  if (!p || (organizationId && p.organizationId !== organizationId)) return null;
  return p;
}

export async function updatePlaybook(id, organizationId, updates) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const data = { updatedAt: new Date() };
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.isEnabled !== undefined) data.isEnabled = updates.isEnabled;
    if (updates.approvalRequired !== undefined) data.approvalRequired = updates.approvalRequired;
    if (updates.conditions !== undefined) data.conditionsJson = JSON.stringify(updates.conditions);
    if (updates.actions !== undefined) data.actionsJson = JSON.stringify(updates.actions);

    return await client.playbook.update({
      where: { id },
      data,
    });
  }

  const existing = memoryDb.playbooks.get(id);
  if (!existing || (organizationId && existing.organizationId !== organizationId)) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  memoryDb.playbooks.set(id, updated);
  return updated;
}

export async function deletePlaybook(id, organizationId) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    await client.playbook.deleteMany({ where: { id, organizationId } });
    return true;
  }
  const existing = memoryDb.playbooks.get(id);
  if (existing && (!organizationId || existing.organizationId === organizationId)) {
    memoryDb.playbooks.delete(id);
    return true;
  }
  return false;
}

// ── APPROVAL REQUESTS ────────────────────────────────────────────────────────

export async function saveApprovalRequest(appr) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.approvalRequest.create({ data: appr });
  }
  memoryDb.approvalRequests.set(appr.id, appr);
  return appr;
}

export async function listApprovalRequests({ organizationId, status = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (status) where.status = status;
    return await client.approvalRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  let requests = Array.from(memoryDb.approvalRequests.values());
  if (organizationId) requests = requests.filter(r => r.organizationId === organizationId);
  if (status) requests = requests.filter(r => r.status === status);
  return requests;
}

export async function updateApprovalRequestStatus(id, organizationId, status, approver, comment) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.approvalRequest.update({
      where: { id },
      data: { status, approver, comment, updatedAt: new Date() },
    });
  }

  const req = memoryDb.approvalRequests.get(id);
  if (!req || (organizationId && req.organizationId !== organizationId)) return null;
  req.status = status;
  req.approver = approver;
  req.comment = comment;
  req.updatedAt = new Date().toISOString();
  memoryDb.approvalRequests.set(id, req);
  return req;
}

// ── AUTOMATION ACTIONS & QUEUE ───────────────────────────────────────────────

export async function saveAutomationAction(action) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.automationAction.create({
      data: {
        id: action.id,
        organizationId: action.organizationId,
        policyId: action.policyId,
        playbookId: action.playbookId,
        triggeringEventId: action.triggeringEventId,
        actionType: action.actionType,
        status: action.status,
        targetResource: action.targetResource,
        resultJson: action.result ? JSON.stringify(action.result) : null,
        error: action.error,
        executedAt: action.executedAt ? new Date(action.executedAt) : null,
      },
    });
  }
  memoryDb.automationActions.set(action.id, action);
  return action;
}

export async function listAutomationActions({ organizationId, status = null, limit = 50 }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (status) where.status = status;
    return await client.automationAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  let actions = Array.from(memoryDb.automationActions.values());
  if (organizationId) actions = actions.filter(a => a.organizationId === organizationId);
  if (status) actions = actions.filter(a => a.status === status);
  return actions.slice(0, limit);
}

// ── SECURITY INCIDENTS ───────────────────────────────────────────────────────

export async function saveSecurityIncident(incident) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.securityIncident.create({
      data: {
        id: incident.id,
        organizationId: incident.organizationId,
        title: incident.title,
        status: incident.status,
        severity: incident.severity,
        assignedToId: incident.assignedToId,
        relatedFingerprintsJson: JSON.stringify(incident.relatedFingerprints || []),
        relatedFindingIdsJson: JSON.stringify(incident.relatedFindingIds || []),
        clustersCount: incident.clustersCount,
      },
    });
  }
  memoryDb.securityIncidents.set(incident.id, incident);
  return incident;
}

export async function listSecurityIncidents({ organizationId, status = null, limit = 50 }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (status) where.status = status;
    const incidents = await client.securityIncident.findMany({
      where,
      include: { notes: true, events: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return incidents.map(inc => ({
      ...inc,
      relatedFingerprints: inc.relatedFingerprintsJson ? JSON.parse(inc.relatedFingerprintsJson) : [],
      relatedFindingIds: inc.relatedFindingIdsJson ? JSON.parse(inc.relatedFindingIdsJson) : [],
    }));
  }

  let incidents = Array.from(memoryDb.securityIncidents.values());
  if (organizationId) incidents = incidents.filter(i => i.organizationId === organizationId);
  if (status) incidents = incidents.filter(i => i.status === status);

  return incidents.map(inc => ({
    ...inc,
    notes: memoryDb.incidentNotes.filter(n => n.incidentId === inc.id),
    events: memoryDb.incidentEvents.filter(e => e.incidentId === inc.id),
  })).slice(0, limit);
}

export async function getIncidentById(id, organizationId) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const inc = await client.securityIncident.findFirst({
      where: { id, organizationId },
      include: { notes: { orderBy: { createdAt: 'desc' } }, events: true },
    });
    if (!inc) return null;
    return {
      ...inc,
      relatedFingerprints: inc.relatedFingerprintsJson ? JSON.parse(inc.relatedFingerprintsJson) : [],
      relatedFindingIds: inc.relatedFindingIdsJson ? JSON.parse(inc.relatedFindingIdsJson) : [],
    };
  }

  const inc = memoryDb.securityIncidents.get(id);
  if (!inc || (organizationId && inc.organizationId !== organizationId)) return null;
  return {
    ...inc,
    notes: memoryDb.incidentNotes.filter(n => n.incidentId === id),
    events: memoryDb.incidentEvents.filter(e => e.incidentId === id),
  };
}

export async function addIncidentNote(note) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.incidentNote.create({
      data: {
        id: note.id,
        incidentId: note.incidentId,
        organizationId: note.organizationId,
        authorId: note.authorId,
        authorName: note.authorName,
        content: note.content,
      },
    });
  }
  memoryDb.incidentNotes.push(note);
  return note;
}

// ── SCHEDULED SCANS ──────────────────────────────────────────────────────────

export async function saveScheduledScan(scan) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.scheduledScan.create({
      data: {
        id: scan.id,
        organizationId: scan.organizationId,
        repositoryId: scan.repositoryId,
        schedule: scan.schedule,
        cronExpression: scan.cronExpression,
        isEnabled: scan.isEnabled,
        nextRunAt: scan.nextRunAt ? new Date(scan.nextRunAt) : null,
      },
    });
  }
  memoryDb.scheduledScans.set(scan.id, scan);
  return scan;
}

export async function listScheduledScans({ organizationId, repositoryId = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (repositoryId) where.repositoryId = repositoryId;
    return await client.scheduledScan.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  let scans = Array.from(memoryDb.scheduledScans.values());
  if (organizationId) scans = scans.filter(s => s.organizationId === organizationId);
  if (repositoryId) scans = scans.filter(s => s.repositoryId === repositoryId);
  return scans;
}
