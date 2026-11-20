import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoSaveProps<T> {
  data: T;
  onSave: (data: T, dirtyKeys: string[]) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

function getDirtyKeys<T extends Record<string, any>>(current: T, lastSaved: T): string[] {
  return Object.keys(current).filter(
    (key) => JSON.stringify(current[key]) !== JSON.stringify(lastSaved?.[key])
  );
}

export function useAutoSave<T extends Record<string, any>>({
  data,
  onSave,
  delay = 1500,
  enabled = true,
}: AutoSaveProps<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedDataRef = useRef<T>(data);
  const dataRef = useRef<T>(data);
  dataRef.current = data;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const pendingRerunRef = useRef(false);
  const wasEnabledRef = useRef(enabled);

  // When enabled transitions from false to true (initial DB load completes),
  // initialize lastSavedData with current data so loaded data is not treated as dirty.
  useEffect(() => {
    if (!wasEnabledRef.current && enabled) {
      lastSavedDataRef.current = data;
    }
    wasEnabledRef.current = enabled;
  }, [enabled, data]);

  // Serialized save runner: guarantees only one onSave execution runs at a time.
  // Concurrent triggers coalesce into at most one queued follow-up pass.
  const executeSave = useCallback(async () => {
    if (!enabledRef.current) return;

    if (inFlightRef.current) {
      pendingRerunRef.current = true;
      return inFlightRef.current;
    }

    const run = (async () => {
      setIsSaving(true);
      try {
        do {
          pendingRerunRef.current = false;
          if (!enabledRef.current) break;

          const snapshot = dataRef.current;
          const dirtyKeys = getDirtyKeys(snapshot, lastSavedDataRef.current);
          if (dirtyKeys.length === 0) break;

          try {
            await onSaveRef.current(snapshot, dirtyKeys);
            // Advance lastSaved only for the keys actually included in this snapshot,
            // so edits made to other keys mid-flight remain dirty for the follow-up pass.
            const nextSaved = { ...lastSavedDataRef.current } as T;
            for (const key of dirtyKeys) {
              (nextSaved as Record<string, any>)[key] = snapshot[key];
            }
            lastSavedDataRef.current = nextSaved;
          } catch (error: any) {
            const msg = error instanceof Error ? error.message : (error?.message || JSON.stringify(error));
            console.error('Auto-save failed:', msg, error);
          }
        } while (pendingRerunRef.current && enabledRef.current);
      } finally {
        inFlightRef.current = null;
        setIsSaving(false);
      }
    })();

    inFlightRef.current = run;
    return run;
  }, []);

  // Flush pending debounced or dirty changes immediately through the serialized runner
  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!enabledRef.current) return;
    await executeSave();
  }, [executeSave]);

  // Cancel pending timer and any queued follow-up pass without touching in-flight save
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRerunRef.current = false;
  }, []);

  // Wait until any active auto-save finishes
  const waitForIdle = useCallback(async () => {
    while (inFlightRef.current) {
      await inFlightRef.current;
    }
  }, []);

  // Mark specified keys (or entire snapshot) as clean so unmount/navigation won't re-save
  const markSaved = useCallback((keys?: string[], snapshot?: T) => {
    const source = snapshot ?? dataRef.current;
    if (!keys) {
      lastSavedDataRef.current = source;
    } else {
      const nextSaved = { ...lastSavedDataRef.current } as T;
      for (const key of keys) {
        (nextSaved as Record<string, any>)[key] = source[key];
      }
      lastSavedDataRef.current = nextSaved;
    }
    if (timerRef.current && getDirtyKeys(dataRef.current, lastSavedDataRef.current).length === 0) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Debounce timer: ONLY schedules/resets the timeout; cleanup NEVER flushes!
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const dirtyKeys = getDirtyKeys(data, lastSavedDataRef.current);
    if (dirtyKeys.length > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void executeSave();
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [data, enabled, delay, executeSave]);

  // Flush only on tab hide / page unload / genuine component unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && enabledRef.current) {
        void flush();
      }
    };

    const handleBeforeUnload = () => {
      if (enabledRef.current) {
        void flush();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        if (enabledRef.current && getDirtyKeys(dataRef.current, lastSavedDataRef.current).length > 0) {
          void executeSave();
        }
      }
    };
  }, [flush, executeSave]);

  return { isSaving, flush, cancel, waitForIdle, markSaved };
}
