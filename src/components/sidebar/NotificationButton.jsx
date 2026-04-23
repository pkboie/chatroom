import { useEffect, useState } from 'react';
import {
  isNotificationSupported,
  requestNotificationPermission,
  showNotification,
} from '../../services/notificationService';
import './NotificationButton.css';

function readPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

function NotificationButton() {
  const [permission, setPermission] = useState(readPermission);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    const onFocus = () => setPermission(readPermission());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (permission === 'unsupported') return null;

  const handleClick = async () => {
    if (busy) return;

    if (permission === 'granted') {
      showNotification('Chatroom', '通知功能已啟用 ✅');
      return;
    }

    if (permission === 'denied') {
      window.alert(
        '瀏覽器已封鎖通知權限。\n請點網址列左側的鎖頭圖示 → 將「通知」改為允許 → 重新整理頁面。',
      );
      return;
    }

    setBusy(true);
    try {
      const ok = await requestNotificationPermission();
      setPermission(readPermission());
      if (ok) showNotification('Chatroom', '通知功能已啟用 ✅');
    } finally {
      setBusy(false);
    }
  };

  const icon = permission === 'granted' ? '🔔' : permission === 'denied' ? '🔕' : '🔔';
  const label =
    permission === 'granted'
      ? '通知已啟用（點擊測試）'
      : permission === 'denied'
        ? '通知被封鎖（點擊查看處理方式）'
        : '啟用瀏覽器通知';

  return (
    <button
      type="button"
      className={`notif-btn notif-btn-${permission}`}
      onClick={handleClick}
      disabled={busy}
      title={label}
      aria-label={label}
    >
      <span className="notif-btn-icon">{icon}</span>
      {permission !== 'granted' && <span className="notif-btn-dot" />}
    </button>
  );
}

export default NotificationButton;
