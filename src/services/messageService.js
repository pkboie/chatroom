import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MESSAGE_TYPES } from '../utils/constants';

const UNSENT_PREVIEW = '訊息已收回';

const messagesCol = (chatroomId) => collection(db, 'chatrooms', chatroomId, 'messages');
const messageDoc = (chatroomId, messageId) => doc(db, 'chatrooms', chatroomId, 'messages', messageId);
const chatroomDoc = (chatroomId) => doc(db, 'chatrooms', chatroomId);

const previewFor = (type, content) => {
  if (type === MESSAGE_TYPES.TEXT) return content;
  if (type === MESSAGE_TYPES.IMAGE) return '[圖片]';
  if (type === MESSAGE_TYPES.GIF) return '[GIF]';
  if (type === MESSAGE_TYPES.SYSTEM) return content;
  return '';
};

export async function sendMessage(chatroomId, messageData) {
  const payload = {
    type: MESSAGE_TYPES.TEXT,
    isEdited: false,
    isUnsent: false,
    emojis: {},
    ...messageData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await addDoc(messagesCol(chatroomId), payload);

  const updates = {
    lastMessage: previewFor(payload.type, payload.content),
    lastMessageAt: serverTimestamp(),
  };

  // Bump unread count for every member except the sender. Read members
  // off the chatroom doc; missing field → no recipients to notify.
  const roomSnap = await getDoc(chatroomDoc(chatroomId));
  const members = roomSnap.exists() ? (roomSnap.data().members || []) : [];
  members.forEach((uid) => {
    if (uid && uid !== payload.senderId) {
      updates[`unreadCounts.${uid}`] = increment(1);
    }
  });

  await updateDoc(chatroomDoc(chatroomId), updates);
}

export async function markChatroomRead(chatroomId, userId) {
  if (!chatroomId || !userId) return;
  await updateDoc(chatroomDoc(chatroomId), {
    [`unreadCounts.${userId}`]: 0,
  });
}

export function subscribeToMessages(chatroomId, callback) {
  const q = query(messagesCol(chatroomId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function editMessage(chatroomId, messageId, newContent) {
  await updateDoc(messageDoc(chatroomId, messageId), {
    content: newContent,
    isEdited: true,
    updatedAt: serverTimestamp(),
  });
}

export async function addReaction(chatroomId, messageId, emoji, userId) {
  await updateDoc(messageDoc(chatroomId, messageId), {
    [`emojis.${emoji}`]: arrayUnion(userId),
  });
}

export async function removeReaction(chatroomId, messageId, emoji, userId) {
  await updateDoc(messageDoc(chatroomId, messageId), {
    [`emojis.${emoji}`]: arrayRemove(userId),
  });
}

export async function unsendMessage(chatroomId, messageId) {
  await updateDoc(messageDoc(chatroomId, messageId), {
    isUnsent: true,
    updatedAt: serverTimestamp(),
  });

  const latestQ = query(messagesCol(chatroomId), orderBy('createdAt', 'desc'), limit(1));
  const latestSnap = await getDocs(latestQ);
  const latest = latestSnap.docs[0];
  if (latest && latest.id === messageId) {
    await updateDoc(chatroomDoc(chatroomId), {
      lastMessage: UNSENT_PREVIEW,
    });
  }
}
