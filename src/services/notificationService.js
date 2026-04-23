export const isNotificationSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showNotification(title, body, onClick) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return null;
  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: title,
      renotify: true,
    });
    if (onClick) {
      n.onclick = (e) => {
        e.preventDefault();
        try {
          window.focus();
        } catch {
          /* noop */
        }
        onClick();
        n.close();
      };
    }
    return n;
  } catch (err) {
    console.warn('showNotification failed:', err);
    return null;
  }
}
