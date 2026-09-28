import { useState, useEffect, useRef } from 'react';

interface AutoSaveProps<T> {
  data: T;
  onSave: (data: T, dirtyKeys: string[]) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T extends Record<string, any>>({
  data,
  onSave,
  delay = 30000,
  enabled = true,
}: AutoSaveProps<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<T>(data);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Determine what has changed since last save
    const dirtyKeys = Object.keys(data).filter(
      (key) => JSON.stringify(data[key]) !== JSON.stringify(lastSavedData[key])
    );

    if (dirtyKeys.length > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSave(data, dirtyKeys);
          setLastSavedData(data); // Update last saved data to prevent re-saving
        } catch (error) {
          console.error("Auto-save failed:", error instanceof Error ? error.message : error);
        } finally {
          setIsSaving(false);
        }
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, onSave, delay, lastSavedData]);

  return { isSaving };
}
