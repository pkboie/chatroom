import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

const buildNewUserDoc = (user, overrides = {}) => ({
  uid: user.uid,
  email: user.email ?? '',
  username: overrides.username ?? user.displayName ?? (user.email ? user.email.split('@')[0] : 'User'),
  photoURL: overrides.photoURL ?? user.photoURL ?? '',
  phone: '',
  address: '',
  blockedUsers: [],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const ensureUserDoc = async (user, overrides = {}) => {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, buildNewUserDoc(user, overrides));
  }
};

export async function registerWithEmail(email, password, username) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });
  await setDoc(doc(db, 'users', cred.user.uid), buildNewUserDoc(cred.user, { username }));
  return cred.user;
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(cred.user);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

const FIREBASE_AUTH_ERRORS = {
  'auth/email-already-in-use': '此 Email 已被註冊',
  'auth/invalid-email': 'Email 格式不正確',
  'auth/weak-password': '密碼強度不足（至少 6 字元）',
  'auth/invalid-credential': 'Email 或密碼錯誤',
  'auth/user-not-found': '找不到此使用者',
  'auth/wrong-password': '密碼錯誤',
  'auth/too-many-requests': '嘗試次數過多，請稍後再試',
  'auth/popup-closed-by-user': '已取消 Google 登入',
  'auth/popup-blocked': '彈出視窗被瀏覽器封鎖',
  'auth/network-request-failed': '網路連線異常',
};

export function getAuthErrorMessage(error) {
  if (!error) return '發生未知錯誤';
  return FIREBASE_AUTH_ERRORS[error.code] || error.message || '發生未知錯誤';
}
