import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoSaveProps<T> {
  data: T;
  onSave: (data: T, dirtyKeys: string[]) => Promise<void>;
  delay?: number;
  enabled?: boolean;
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wasEnabledRef = useRef(enabled);

  // When enabled transitions from false to true (initial DB load completes),
  // initialize lastSavedData with current data so loaded data is not treated as dirty
  useEffect(() => {
    if (!wasEnabledRef.current && enabled) {
      lastSavedDataRef.current = data;
    }
    wasEnabledRef.current = enabled;
  }, [enabled, data]);

  // Flush pending changes immediately
  const flush = useCallback(async () => {
    if (!enabled) return;
    const currentData = dataRef.current;
    const dirtyKeys = Object.keys(currentData).filter(
      (key) => JSON.stringify(currentData[key]) !== JSON.stringify(lastSavedDataRef.current[key])
    );

    if (dirtyKeys.length > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsSaving(true);
      try {
        await onSaveRef.current(currentData, dirtyKeys);
        lastSavedDataRef.current = currentData;
      } catch (error: any) {
        console.error("Auto-save flush failed:", error?.message || error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Determine what has changed since last save
    const dirtyKeys = Object.keys(data).filter(
      (key) => JSON.stringify(data[key]) !== JSON.stringify(lastSavedDataRef.current[key])
    );

    if (dirtyKeys.length > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSaveRef.current(data, dirtyKeys);
          lastSavedDataRef.current = data;
        } catch (error: any) {
          const msg = error instanceof Error ? error.message : (error?.message || JSON.stringify(error));
          console.error("Auto-save failed:", msg, error);
        } finally {
          setIsSaving(false);
        }
      }, delay);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };

    const handleBeforeUnload = () => {
      flush();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        flush();
      }
    };
  }, [data, enabled, delay, flush]);

  return { isSaving, flush };
}
