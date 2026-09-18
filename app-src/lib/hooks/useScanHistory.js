'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const HISTORY_KEY = 'secretshield_scan_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Hook for managing scan history in localStorage.
 * SECURITY: Only stores masked findings and fingerprints, never raw secrets.
 */
export function useScanHistory() {
  const [history, setHistory] = useLocalStorage(HISTORY_KEY, []);

  /**
   * Add a scan result to history.
   * Strips raw content from files before storing.
   *
   * @param {object} scanResult - result from the scanner engine
   * @param {string[]} fileNames - names of scanned files (content NOT stored)
   */
  const addToHistory = useCallback((scanResult, fileNames = []) => {
    const historyEntry = {
      id: scanResult.id,
      timestamp: scanResult.timestamp,
      fileNames, // Only names, not content
      stats: scanResult.stats,
      // Store only fingerprints + masked values — NEVER raw secrets
      findingSummaries: (scanResult.findings || []).slice(0, 100).map(f => ({
        fingerprint: f.fingerprint,
        type: f.type,
        name: f.name,
        severity: f.severity,
        file: f.file,
        line: f.line,
        maskedValue: f.maskedValue,
        confidence: f.confidence,
      })),
    };

    setHistory(prev => {
      const updated = [historyEntry, ...(prev || [])];
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  }, [setHistory]);

  /**
   * Remove a scan from history.
   * @param {string} id
   */
  const removeFromHistory = useCallback((id) => {
    setHistory(prev => (prev || []).filter(h => h.id !== id));
  }, [setHistory]);

  /**
   * Clear all scan history.
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return {
    history: history || [],
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
