'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

const RULES_KEY = 'secretshield_custom_rules';
const ALLOWLIST_KEY = 'secretshield_allowlist';

/**
 * Hook for managing custom detection rules.
 */
export function useCustomRules() {
  const [rules, setRules] = useLocalStorage(RULES_KEY, []);

  const addRule = useCallback((rule) => {
    const newRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      ...rule,
    };
    setRules(prev => [...(prev || []), newRule]);
    return newRule;
  }, [setRules]);

  const updateRule = useCallback((id, updates) => {
    setRules(prev => (prev || []).map(r => r.id === id ? { ...r, ...updates } : r));
  }, [setRules]);

  const deleteRule = useCallback((id) => {
    setRules(prev => (prev || []).filter(r => r.id !== id));
  }, [setRules]);

  const toggleRule = useCallback((id) => {
    setRules(prev => (prev || []).map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  }, [setRules]);

  return {
    rules: rules || [],
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}

/**
 * Hook for managing the allowlist.
 */
export function useAllowlist() {
  const [allowlist, setAllowlist] = useLocalStorage(ALLOWLIST_KEY, {
    fingerprints: [],
    files: [],
    patterns: [],
  });

  const addFingerprint = useCallback((fingerprint, reason = '') => {
    setAllowlist(prev => ({
      ...(prev || {}),
      fingerprints: [...new Set([...((prev || {}).fingerprints || []), fingerprint])],
    }));
  }, [setAllowlist]);

  const removeFingerprint = useCallback((fingerprint) => {
    setAllowlist(prev => ({
      ...(prev || {}),
      fingerprints: ((prev || {}).fingerprints || []).filter(f => f !== fingerprint),
    }));
  }, [setAllowlist]);

  const addFile = useCallback((filename) => {
    setAllowlist(prev => ({
      ...(prev || {}),
      files: [...new Set([...((prev || {}).files || []), filename])],
    }));
  }, [setAllowlist]);

  const removeFile = useCallback((filename) => {
    setAllowlist(prev => ({
      ...(prev || {}),
      files: ((prev || {}).files || []).filter(f => f !== filename),
    }));
  }, [setAllowlist]);

  const clearAllowlist = useCallback(() => {
    setAllowlist({ fingerprints: [], files: [], patterns: [] });
  }, [setAllowlist]);

  const isAllowlisted = useCallback((fingerprint) => {
    return ((allowlist || {}).fingerprints || []).includes(fingerprint);
  }, [allowlist]);

  return {
    allowlist: allowlist || { fingerprints: [], files: [], patterns: [] },
    addFingerprint,
    removeFingerprint,
    addFile,
    removeFile,
    clearAllowlist,
    isAllowlisted,
  };
}
