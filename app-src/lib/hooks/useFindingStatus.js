/**
 * lib/hooks/useFindingStatus.js
 *
 * Manages user-assigned status for findings.
 * Persists to localStorage (status metadata only — no raw secrets).
 *
 * Status options: OPEN | CONFIRMED | FALSE_POSITIVE | IGNORED | REMEDIATED
 */

'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { FindingStatus } from '@/lib/models/index';

const STORAGE_KEY = 'secretshield_finding_status';

function loadStatusMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatusMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

/**
 * Hook for managing finding status by fingerprint.
 *
 * @returns {{
 *   getStatus: (fingerprint: string) => object,
 *   setStatus: (fingerprint: string, status: string, notes?: string) => void,
 *   clearStatus: (fingerprint: string) => void,
 *   statusMap: object
 * }}
 */
export function useFindingStatus() {
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    startTransition(() => {
      setStatusMap(loadStatusMap());
    });
  }, []);

  const getStatus = useCallback((fingerprint) => {
    return statusMap[fingerprint] || { status: FindingStatus.OPEN, notes: '', updatedAt: null };
  }, [statusMap]);

  const setStatus = useCallback((fingerprint, status, notes = '') => {
    if (!fingerprint) return;

    const entry = {
      status,
      notes: notes.slice(0, 500), // cap note length
      updatedAt: new Date().toISOString(),
    };

    setStatusMap(prev => {
      const updated = { ...prev, [fingerprint]: entry };
      saveStatusMap(updated);
      return updated;
    });
  }, []);

  const clearStatus = useCallback((fingerprint) => {
    setStatusMap(prev => {
      const updated = { ...prev };
      delete updated[fingerprint];
      saveStatusMap(updated);
      return updated;
    });
  }, []);

  return { getStatus, setStatus, clearStatus, statusMap };
}
