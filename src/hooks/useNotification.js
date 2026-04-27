import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { isNotificationSupported, showNotification } from '../services/notificationService';
import { sanitizeInput } from '../utils/sanitize';
import { MESSAGE_TYPES } from '../utils/constants';
import { useNotificationMuted } from './useNotificationMuted';

const previewFor = (type, content) => {
  if (type === MESSAGE_TYPES.IMAGE) return '[圖片]';
  if (type === MESSAGE_TYPES.GIF) return '[GIF]';
  return sanitizeInput(content || '');
};

/**
 * Subscribes to all chatrooms the user is in and shows a browser notification
 * when a new message arrives from someone else, in a chatroom that is not
 * currently active (or while the tab is unfocused).
 *
 * Permission is NOT requested here — modern browsers (Chrome/Edge) require a
 * user gesture for that. The Sidebar exposes a manual button. We just check
 * `Notification.permission === 'granted'` before firing.
 */
export function useNotification({
  currentUserId,
  chatrooms,
  activeChatroomId,
  onClickChatroom,
  onNotify,
}) {
  const [muted] = useNotificationMuted();
  const activeRef = useRef(activeChatroomId);
  const onClickRef = useRef(onClickChatroom);
  const onNotifyRef = useRef(onNotify);
  const mutedRef = useRef(muted);

  useEffect(() => {
    activeRef.current = activeChatroomId;
  }, [activeChatroomId]);

  useEffect(() => {
    onClickRef.current = onClickChatroom;
  }, [onClickChatroom]);

  useEffect(() => {
    onNotifyRef.current = onNotify;
  }, [onNotify]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Subscribe per-chatroom. Re-run only when the set of chatroom ids actually
  // changes (not on every chatrooms list reorder).
  const chatroomIds = (chatrooms || []).map((c) => c.id).sort().join(',');

  useEffect(() => {
    if (!currentUserId || !chatrooms || chatrooms.length === 0) return undefined;

    const unsubs = chatrooms.map((room) => {
      // Per-chatroom bookkeeping: on the first snapshot we mark every existing
      // message as already seen so we don't notify for history. Anything that
      // arrives in subsequent snapshots is genuinely new.
      let firstSnapshot = true;
      const seen = new Set();

      const messagesQ = query(
        collection(db, 'chatrooms', room.id, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(20),
      );

      return onSnapshot(
        messagesQ,
        (snap) => {
          if (firstSnapshot) {
            snap.docs.forEach((d) => seen.add(d.id));
            firstSnapshot = false;
            return;
          }

          snap.docChanges().forEach((change) => {
            if (change.type !== 'added') return;
            const id = change.doc.id;
            if (seen.has(id)) return;
            seen.add(id);

            const msg = change.doc.data();
            if (msg.senderId === currentUserId) return;
            if (msg.isUnsent) return;
            if (msg.type === MESSAGE_TYPES.SYSTEM) return;
            if (room.id === activeRef.current && document.hasFocus()) return;
            // User toggled the bell off — suppress both toast & browser notif.
            if (mutedRef.current) return;

            const senderName = sanitizeInput(msg.senderName || '訊息');
            const body = previewFor(msg.type, msg.content);

            // In-app toast always fires (works even when OS notifications
            // are blocked or silenced by Focus Assist / Do Not Disturb).
            onNotifyRef.current?.({
              id: `${room.id}:${id}`,
              chatroomId: room.id,
              title: senderName,
              body,
            });

            // Browser notification — best-effort, requires permission.
            if (isNotificationSupported() && Notification.permission === 'granted') {
              showNotification(senderName, body, () => {
                onClickRef.current?.(room.id);
              });
            }
          });
        },
        (err) => {
          console.warn('useNotification subscription error:', room.id, err);
        },
      );
    });

    return () => {
      unsubs.forEach((u) => u && u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, chatroomIds]);
}
