import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const chatroomsCol = () => collection(db, 'chatrooms');

export async function createChatroom({ name, type, members, createdBy }) {
  const ref = await addDoc(chatroomsCol(), {
    name,
    type,
    members,
    createdBy,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function findPrivateChatroom(currentUserId, otherUserId) {
  const q = query(
    chatroomsCol(),
    where('type', '==', 'private'),
    where('members', 'array-contains', currentUserId),
  );
  const snap = await getDocs(q);
  const found = snap.docs.find((d) => {
    const members = d.data().members || [];
    return members.length === 2 && members.includes(otherUserId);
  });
  return found ? { id: found.id, ...found.data() } : null;
}

const tsToMillis = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
};

export function subscribeToChatrooms(userId, callback, onError) {
  // No orderBy → avoids composite index requirement; sort client-side instead.
  // Also lets us display newly-created rooms immediately even while serverTimestamp is pending.
  const q = query(chatroomsCol(), where('members', 'array-contains', userId));
  return onSnapshot(
    q,
    (snap) => {
      const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rooms.sort((a, b) => {
        const ta = tsToMillis(a.lastMessageAt) || tsToMillis(a.createdAt);
        const tb = tsToMillis(b.lastMessageAt) || tsToMillis(b.createdAt);
        return tb - ta;
      });
      callback(rooms);
    },
    (err) => {
      if (onError) onError(err);
      else console.error('subscribeToChatrooms error:', err);
    },
  );
}

export async function getChatroom(chatroomId) {
  const snap = await getDoc(doc(db, 'chatrooms', chatroomId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function inviteMembers(chatroomId, newMemberIds) {
  await updateDoc(doc(db, 'chatrooms', chatroomId), {
    members: arrayUnion(...newMemberIds),
  });
}

export async function renameChatroom(chatroomId, name) {
  await updateDoc(doc(db, 'chatrooms', chatroomId), { name });
}
