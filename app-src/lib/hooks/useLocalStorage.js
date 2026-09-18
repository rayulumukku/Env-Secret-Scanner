'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * localStorage hook with SSR safety.
 * Reads initial value lazily via useState initializer (no effect setState).
 *
 * @param {string} key - localStorage key
 * @param {*} initialValue - default value
 * @returns {[value, setValue, removeValue]}
 */
export function useLocalStorage(key, initialValue) {
  // Lazy initializer — reads localStorage once on mount, avoids setState-in-effect
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch {
      // localStorage unavailable or quota exceeded
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
