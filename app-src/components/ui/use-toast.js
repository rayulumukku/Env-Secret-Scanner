'use client';

/**
 * useToast hook - wraps the base-ui toast manager from shadcn v4
 * Provides a familiar API: toast({ title, description, variant })
 */

import { toast as toastManager } from '@/components/ui/toast';

/**
 * @returns {{ toast: (opts: { title?: string, description?: string, variant?: string }) => void }}
 */
export function useToast() {
  const toast = ({ title, description, variant } = {}) => {
    const type = variant === 'destructive' ? 'error' : 'success';
    toastManager.create({
      title: title || '',
      description: description || '',
      type,
    });
  };

  return { toast };
}
