import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const usersCol = () => collection(db, 'users');

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllUsers({ excludeUid } = {}) {
  const snap = await getDocs(usersCol());
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => (excludeUid ? u.uid !== excludeUid : true));
}

export async function searchUsers(queryText, { excludeUid } = {}) {
  const all = await getAllUsers({ excludeUid });
  const q = (queryText || '').trim().toLowerCase();
  if (!q) return all;
  return all.filter((u) => {
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return username.includes(q) || email.includes(q);
  });
}

export async function updateUserProfile(userId, data) {
  await updateDoc(doc(db, 'users', userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function blockUser(currentUserId, targetUserId) {
  await updateDoc(doc(db, 'users', currentUserId), {
    blockedUsers: arrayUnion(targetUserId),
    updatedAt: serverTimestamp(),
  });
}

export async function unblockUser(currentUserId, targetUserId) {
  await updateDoc(doc(db, 'users', currentUserId), {
    blockedUsers: arrayRemove(targetUserId),
    updatedAt: serverTimestamp(),
  });
}
