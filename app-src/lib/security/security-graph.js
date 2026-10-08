export class SecurityGraphService {
  constructor({ organizationId = 'default' } = {}) {
    this.organizationId = organizationId;
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode({ entityType, entityId, organizationId = this.organizationId, ...rest }) {
    const key = `${entityType}:${entityId}`;
    const node = {
      entityType: String(entityType).toUpperCase(),
      entityId: String(entityId),
      organizationId,
      label: rest.label || entityId,
      metadata: rest.metadata || {},
      createdAt: rest.createdAt || new Date().toISOString(),
    };
    this.nodes.set(key, node);
    if (!this.edges.has(key)) this.edges.set(key, []);
    return node;
  }

  getNode(entityId, entityType, organizationId = this.organizationId) {
    const key = `${String(entityType).toUpperCase()}:${String(entityId)}`;
    const node = this.nodes.get(key);
    if (!node) return null;
    if (organizationId && node.organizationId !== organizationId) return null;
    return node;
  }

  addEdge({ sourceId, sourceType, targetId, targetType, relationshipType, organizationId = this.organizationId, metadata = {} }) {
    const sourceKey = `${String(sourceType).toUpperCase()}:${String(sourceId)}`;
    const targetKey = `${String(targetType).toUpperCase()}:${String(targetId)}`;
    const edge = {
      sourceId: String(sourceId),
      sourceType: String(sourceType).toUpperCase(),
      targetId: String(targetId),
      targetType: String(targetType).toUpperCase(),
      relationshipType: String(relationshipType).toUpperCase(),
      organizationId,
      metadata,
      createdAt: new Date().toISOString(),
    };

    this.addNode({ entityType: sourceType, entityId: sourceId, organizationId });
    this.addNode({ entityType: targetType, entityId: targetId, organizationId });

    const list = this.edges.get(sourceKey) || [];
    list.push(edge);
    this.edges.set(sourceKey, list);
    return edge;
  }

  removeEdge({ sourceId, sourceType, targetId, targetType, relationshipType }) {
    const sourceKey = `${String(sourceType).toUpperCase()}:${String(sourceId)}`;
    const current = this.edges.get(sourceKey) || [];
    const next = current.filter((edge) => !(edge.targetId === String(targetId) && edge.targetType === String(targetType).toUpperCase() && edge.relationshipType === String(relationshipType).toUpperCase()));
    this.edges.set(sourceKey, next);
    return next.length;
  }

  getNeighbors(entityId, entityType, organizationId = this.organizationId) {
    const key = `${String(entityType).toUpperCase()}:${String(entityId)}`;
    const result = [];
    for (const edge of this.edges.get(key) || []) {
      if (organizationId && edge.organizationId !== organizationId) continue;
      result.push({
        ...edge,
        neighborId: edge.targetId,
        neighborType: edge.targetType,
      });
    }
    return result;
  }

  findPaths(startEntityId, targetEntityTypeOrId, maxDepth = 5) {
    const startType = 'REPOSITORY';
    const targetType = typeof targetEntityTypeOrId === 'string' ? targetEntityTypeOrId.toUpperCase() : null;
    const targetId = typeof targetEntityTypeOrId === 'object' ? targetEntityTypeOrId.entityId : null;

    const queue = [{ entityId: String(startEntityId), entityType: startType, path: [{ entityId: String(startEntityId), entityType: startType }] }];
    const visited = new Set();
    const paths = [];

    while (queue.length > 0 && maxDepth > 0) {
      const current = queue.shift();
      const marker = `${current.entityType}:${current.entityId}`;
      if (visited.has(marker)) continue;
      visited.add(marker);

      const neighbors = this.getNeighbors(current.entityId, current.entityType, this.organizationId);
      for (const neighbor of neighbors) {
        const nextPath = [...current.path, { entityId: neighbor.neighborId, entityType: neighbor.neighborType }];

        const matchesTarget = targetType
          ? neighbor.neighborType === targetType
          : targetId === neighbor.neighborId;

        if (matchesTarget) {
          paths.push(nextPath);
        }

        if (nextPath.length < maxDepth + 1) {
          queue.push({ entityId: neighbor.neighborId, entityType: neighbor.neighborType, path: nextPath });
        }
      }
      maxDepth -= 1;
    }

    return paths;
  }

  findRelatedEntities(entityId, entityType, { limit = 20 } = {}) {
    const seen = new Set();
    const related = [];
    for (const edge of this.edges.values()) {
      for (const item of edge) {
        if (item.sourceId === String(entityId) && item.sourceType === String(entityType).toUpperCase()) {
          if (!seen.has(`${item.targetType}:${item.targetId}`)) {
            seen.add(`${item.targetType}:${item.targetId}`);
            related.push({ entityType: item.targetType, entityId: item.targetId, relationshipType: item.relationshipType });
          }
        }
      }
    }
    return related.slice(0, limit);
  }

  findShortestRiskPath(startEntityId, targetEntityType, maxDepth = 5) {
    const paths = this.findPaths(startEntityId, targetEntityType, maxDepth);
    if (!paths.length) return [];
    return paths.sort((a, b) => a.length - b.length)[0];
  }

  findAttackPaths(startEntityId, targetEntityType, maxDepth = 5) {
    return this.findPaths(startEntityId, targetEntityType, maxDepth);
  }

  getEntityTimeline(entityId, entityType) {
    const events = [];
    const node = this.getNode(entityId, entityType, this.organizationId);
    if (node) events.push({ type: 'NODE', ...node });
    for (const edgeList of this.edges.values()) {
      for (const edge of edgeList) {
        if (edge.sourceId === String(entityId) || edge.targetId === String(entityId)) {
          events.push({ type: 'EDGE', ...edge });
        }
      }
    }
    return events;
  }
}
