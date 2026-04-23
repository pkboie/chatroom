import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  isNotificationSupported,
  requestNotificationPermission,
  showNotification,
} from '../services/notificationService';
import { sanitizeInput } from '../utils/sanitize';
import { MESSAGE_TYPES } from '../utils/constants';

const tsToMillis = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
};

const previewFor = (type, content) => {
  if (type === MESSAGE_TYPES.IMAGE) return '[圖片]';
  if (type === MESSAGE_TYPES.GIF) return '[GIF]';
  return sanitizeInput(content || '');
};

/**
 * Subscribes to all chatrooms the user is in and shows a browser notification
 * when a new message arrives from someone else, in a chatroom that is not
 * currently active. Skips messages whose createdAt is older than the session
 * start (so loading the page does not flood the user with notifications).
 */
export function useNotification({ currentUserId, chatrooms, activeChatroomId, onClickChatroom }) {
  const activeRef = useRef(activeChatroomId);
  const onClickRef = useRef(onClickChatroom);
  const sessionStartRef = useRef(Date.now());
  const notifiedIdsRef = useRef(new Set());

  useEffect(() => {
    activeRef.current = activeChatroomId;
  }, [activeChatroomId]);

  useEffect(() => {
    onClickRef.current = onClickChatroom;
  }, [onClickChatroom]);

  // Request permission once when the user is signed in.
  useEffect(() => {
    if (!currentUserId || !isNotificationSupported()) return;
    if (Notification.permission === 'default') {
      requestNotificationPermission().catch(() => {});
    }
  }, [currentUserId]);

  // Reset session bookkeeping when the user changes (e.g. logout/login).
  useEffect(() => {
    sessionStartRef.current = Date.now();
    notifiedIdsRef.current = new Set();
  }, [currentUserId]);

  // Subscribe per-chatroom. We key the effect on the sorted list of ids so it
  // only re-runs when the set of chatrooms actually changes, not on every
  // chatrooms object identity change.
  const chatroomIds = (chatrooms || []).map((c) => c.id).sort().join(',');

  useEffect(() => {
    if (!currentUserId || !chatrooms || chatrooms.length === 0) return undefined;
    if (!isNotificationSupported()) return undefined;

    const unsubs = chatrooms.map((room) => {
      const messagesQ = query(
        collection(db, 'chatrooms', room.id, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(15),
      );
      return onSnapshot(messagesQ, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type !== 'added') return;
          const msg = change.doc.data();
          const id = change.doc.id;

          if (notifiedIdsRef.current.has(id)) return;

          // Drop messages that already existed before this session started.
          // serverTimestamp may briefly be null on the sender's own client; we
          // skip those — they will arrive again once the timestamp resolves.
          const createdAtMs = tsToMillis(msg.createdAt);
          if (!createdAtMs) return;
          if (createdAtMs < sessionStartRef.current) {
            notifiedIdsRef.current.add(id);
            return;
          }

          notifiedIdsRef.current.add(id);

          if (msg.senderId === currentUserId) return;
          if (msg.isUnsent) return;
          if (room.id === activeRef.current && document.hasFocus()) return;

          const senderName = sanitizeInput(msg.senderName || '訊息');
          const body = previewFor(msg.type, msg.content);

          showNotification(senderName, body, () => {
            onClickRef.current?.(room.id);
          });
        });
      }, (err) => {
        console.warn('useNotification subscription error:', room.id, err);
      });
    });

    return () => {
      unsubs.forEach((u) => u && u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, chatroomIds]);
}
