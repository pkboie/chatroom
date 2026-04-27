import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'notification_muted';
const listeners = new Set();

function read() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function write(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* noop — quota / private mode */
  }
  listeners.forEach((fn) => fn(value));
}

// Shared toggle: NotificationButton writes, useNotification reads.
// Module-level listener set keeps every consumer in sync within the tab
// without needing a Context provider.
export function useNotificationMuted() {
  const [muted, setMutedState] = useState(read);

  useEffect(() => {
    const fn = (v) => setMutedState(v);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const setMuted = useCallback((v) => write(Boolean(v)), []);
  const toggle = useCallback(() => write(!read()), []);

  return [muted, setMuted, toggle];
}
