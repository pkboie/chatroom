import { useEffect, useState } from 'react';
import {
  isNotificationSupported,
  requestNotificationPermission,
  showNotification,
} from '../../services/notificationService';
import { useNotificationMuted } from '../../hooks/useNotificationMuted';
import './NotificationButton.css';

function readPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

function NotificationButton() {
  const [muted, setMuted] = useNotificationMuted();
  const [permission, setPermission] = useState(readPermission);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    const onFocus = () => setPermission(readPermission());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleClick = async () => {
    if (busy) return;

    // Currently OFF → user wants to turn ON.
    if (muted) {
      // Browser-permission still default → ask first so OS notifications work.
      // In-app toast works regardless of OS permission, so even if the user
      // declines we still flip the switch on (toast will fire).
      if (permission === 'default') {
        setBusy(true);
        try {
          await requestNotificationPermission();
          setPermission(readPermission());
        } finally {
          setBusy(false);
        }
      } else if (permission === 'denied') {
        window.alert(
          '瀏覽器已封鎖通知權限。\n仍會顯示應用內提示，但不會有桌面通知。\n如需桌面通知，請點網址列左側的鎖頭圖示 → 將「通知」改為允許 → 重新整理頁面。',
        );
      }
      setMuted(false);
      if (readPermission() === 'granted') {
        showNotification('Chatroom', '通知已開啟 🔔');
      }
      return;
    }

    // Currently ON → user wants to turn OFF.
    setMuted(true);
  };

  const icon = muted ? '🔕' : '🔔';
  const label = muted
    ? '通知已關閉（點擊開啟）'
    : permission === 'denied'
      ? '通知已開啟（桌面通知被瀏覽器封鎖，僅顯示應用內提示）'
      : permission === 'default'
        ? '通知已開啟（首次點擊將請求瀏覽器權限）'
        : '通知已開啟（點擊關閉）';

  const stateClass = muted
    ? 'notif-btn-off'
    : permission === 'granted'
      ? 'notif-btn-on'
      : 'notif-btn-on-partial';

  return (
    <button
      type="button"
      className={`notif-btn ${stateClass}`}
      onClick={handleClick}
      disabled={busy}
      title={label}
      aria-label={label}
      aria-pressed={!muted}
    >
      <span className="notif-btn-icon">{icon}</span>
    </button>
  );
}

export default NotificationButton;
