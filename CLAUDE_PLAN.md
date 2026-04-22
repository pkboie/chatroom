# Chatroom Midterm Project — Claude Code 執行計畫

> **本文件是給 Claude Code 的完整執行指令。請按照 Phase 順序逐步實作。**
> **每完成一個 Phase 就 git commit 一次，commit message 請參考各 Phase 末尾的建議。**

---

## 專案資訊

- **專案路徑**: `c:\Users\pkboi\OneDrive\文件\大學\大二下\軟體設計與實驗\chatroom`
- **學號**: 113062330
- **技術棧**: React (Vite) + Firebase (Auth, Firestore, Storage) + Vanilla CSS
- **截止日期**: 2026/05/07
- **部署**: Firebase Hosting

---

## 重要規則

1. **所有樣式使用 Vanilla CSS**，不使用 Tailwind 或其他 CSS 框架
2. **UI 風格**: 深色 Messenger 風格（深藍紫配色），現代感、質感優先
3. **每個 Phase 完成後必須 `git add . && git commit`**
4. **不要把 API keys 硬編碼**，全部用 `.env` 環境變數 (`import.meta.env.VITE_*`)
5. **XSS 防護**: 所有使用者輸入都要 sanitize
6. **RWD**: 所有元件在各種螢幕尺寸下都必須可見，不能因為螢幕小就消失，也不能需要滾動才能看到主要功能
7. **使用 Google Font `Inter`** 作為主要字體

---

## 環境變數 (.env)

在專案根目錄建立 `.env` 檔案（注意：使用者會在建好後手動填入 API keys）：

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_GEMINI_API_KEY=
VITE_GIPHY_API_KEY=
```

同時建立 `.env.example` 內容相同但不含值，供 README 參考。

---

## 設計系統 (Design Tokens)

在 `src/index.css` 中定義全域 CSS 變數：

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Color Palette - Dark Theme */
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --bg-chat: #1a1a2e;
  --bg-input: #2a2a4a;

  --text-primary: #e8e8e8;
  --text-secondary: #a0a0b0;
  --text-muted: #6c6c7e;

  --accent-primary: #6c63ff;
  --accent-secondary: #e94560;
  --accent-gradient: linear-gradient(135deg, #6c63ff, #e94560);

  --bubble-self: #6c63ff;
  --bubble-other: #2a2a4a;

  --success: #4ade80;
  --warning: #fbbf24;
  --error: #ef4444;

  --border-color: rgba(255, 255, 255, 0.08);
  --hover-color: rgba(255, 255, 255, 0.05);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 50%;

  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;

  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --sidebar-width: 340px;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

---

## Firestore 資料庫結構

```
users/{userId}
  ├── uid: string
  ├── email: string
  ├── username: string
  ├── photoURL: string           # Firebase Storage 下載連結
  ├── phone: string
  ├── address: string
  ├── blockedUsers: string[]     # 被封鎖的 UID 列表
  ├── createdAt: timestamp
  └── updatedAt: timestamp

chatrooms/{chatroomId}
  ├── name: string
  ├── type: "private" | "group"
  ├── members: string[]          # 成員 UID 列表
  ├── createdBy: string
  ├── createdAt: timestamp
  ├── lastMessage: string
  ├── lastMessageAt: timestamp
  │
  └── messages/{messageId}       # 子集合
      ├── senderId: string
      ├── senderName: string
      ├── senderPhoto: string
      ├── type: "text" | "image" | "gif" | "system"
      ├── content: string        # 文字內容 或 圖片/GIF URL
      ├── isEdited: boolean
      ├── isUnsent: boolean
      ├── emojis: map            # { "👍": ["uid1", "uid2"], "❤️": ["uid3"] }
      ├── createdAt: timestamp
      └── updatedAt: timestamp
```

---

## 專案檔案結構

```
chatroom/
├── public/
│   └── firebase-messaging-sw.js    # Service Worker (Chrome 通知)
│
├── src/
│   ├── main.jsx
│   ├── App.jsx                     # React Router 路由設定
│   ├── App.css
│   ├── index.css                   # 全域樣式 + CSS Variables
│   │
│   ├── config/
│   │   └── firebase.js             # Firebase 初始化
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx         # Auth 狀態 Context
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useChatrooms.js
│   │   ├── useMessages.js
│   │   ├── useNotification.js
│   │   └── useUserProfile.js
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── ChatPage.jsx            # 主頁面 (Sidebar + ChatArea)
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Avatar.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── GoogleLoginBtn.jsx
│   │   │
│   │   ├── sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatroomList.jsx
│   │   │   ├── ChatroomItem.jsx
│   │   │   ├── CreateRoomModal.jsx
│   │   │   └── InviteMemberModal.jsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatArea.jsx
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   ├── MessageSearch.jsx
│   │   │   ├── EmojiReaction.jsx
│   │   │   ├── ImagePreview.jsx
│   │   │   └── GifPicker.jsx
│   │   │
│   │   ├── profile/
│   │   │   └── ProfileModal.jsx
│   │   │
│   │   └── chatbot/
│   │       └── ChatbotModal.jsx
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── chatroomService.js
│   │   ├── messageService.js
│   │   ├── userService.js
│   │   ├── storageService.js
│   │   ├── notificationService.js
│   │   ├── geminiService.js
│   │   └── giphyService.js
│   │
│   └── utils/
│       ├── sanitize.js
│       ├── formatTime.js
│       └── constants.js
│
├── .env
├── .env.example
├── .gitignore
├── .firebaserc
├── firebase.json
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Phase 0: 專案初始化

### Step 0.1 — 建立 Vite + React 專案

```bash
npx -y create-vite@latest ./ -- --template react
npm install
```

如果目錄非空（已有 PDF 等檔案），需先處理衝突。

### Step 0.2 — 安裝依賴

```bash
npm install firebase react-router-dom dompurify
```

### Step 0.3 — 設定 .gitignore

確保 `.gitignore` 包含：
```
node_modules
dist
.env
.firebase
```

### Step 0.4 — 建立 Firebase 配置

建立 `src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

注意：`getMessaging` 只在需要的地方 import，因為它在 SSR 或無瀏覽器環境會報錯。

### Step 0.5 — 設定 `index.html`

在 `<head>` 中加入 Google Font：
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Step 0.6 — 建立設計系統

把上面「設計系統」區塊的 CSS 寫入 `src/index.css`。

### Step 0.7 — 建立工具函式

`src/utils/sanitize.js`:
```javascript
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};
```

`src/utils/formatTime.js`:
```javascript
export const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '剛剛';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分鐘前`;
  if (diff < 86400000) return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
};

export const formatFullTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('zh-TW');
};
```

`src/utils/constants.js`:
```javascript
export const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏'];

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  GIF: 'gif',
  SYSTEM: 'system',
};
```

**Git commit**: `chore: initial project setup with Vite + React and Firebase config`

---

## Phase 1: 會員系統 (Membership — 5% + Google 1%)

### Step 1.1 — AuthContext

建立 `src/contexts/AuthContext.jsx`:
- `createContext` + `useContext` 管理全域 auth 狀態
- 用 `onAuthStateChanged` 監聽使用者登入/登出
- 提供 `currentUser`, `loading`, `userProfile` 狀態
- 在 `AuthProvider` 中包裝 children

### Step 1.2 — Auth Service

建立 `src/services/authService.js`:
- `registerWithEmail(email, password, username)`:
  1. `createUserWithEmailAndPassword(auth, email, password)`
  2. `updateProfile(user, { displayName: username })`
  3. 在 Firestore `users/{uid}` 建立文件：`{ uid, email, username, photoURL: '', phone: '', address: '', blockedUsers: [], createdAt: serverTimestamp() }`
- `loginWithEmail(email, password)`: `signInWithEmailAndPassword`
- `loginWithGoogle()`:
  1. `signInWithPopup(auth, googleProvider)`
  2. 檢查 Firestore 是否已有此使用者文件，沒有的話建立
- `logout()`: `signOut`

### Step 1.3 — 登入/註冊頁面

建立 `src/pages/LoginPage.jsx`:
- 居中的卡片式登入表單（glassmorphism 風格）
- Email + Password 輸入
- 「登入」按鈕（gradient 背景）
- Google 登入按鈕（Google logo icon）
- 「還沒有帳號？」連結到 RegisterPage
- 表單驗證 + 錯誤訊息
- **CSS 動畫**: 整個卡片有 fadeIn + slideUp 進場動畫

建立 `src/pages/RegisterPage.jsx`:
- 類似 LoginPage 但多一個 Username 欄位
- 密碼長度驗證（至少 6 字）
- 「已有帳號？」連結到 LoginPage

### Step 1.4 — App.jsx 路由

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={
            <PrivateRoute><ChatPage /></PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Git commit**: `feat: implement authentication system with Email and Google login`

---

## Phase 2: 聊天室核心 (Chatroom — 25%)

### Step 2.1 — Chatroom Service

建立 `src/services/chatroomService.js`:

```javascript
import { db } from '../config/firebase';
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, updateDoc, doc, arrayUnion, serverTimestamp
} from 'firebase/firestore';

export const createChatroom = async (name, type, members, createdBy) => {
  return await addDoc(collection(db, 'chatrooms'), {
    name,
    type, // "private" or "group"
    members,
    createdBy,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
};

export const subscribeToChatrooms = (userId, callback) => {
  const q = query(
    collection(db, 'chatrooms'),
    where('members', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(rooms);
  });
};

export const inviteMembers = async (chatroomId, newMemberIds) => {
  const ref = doc(db, 'chatrooms', chatroomId);
  await updateDoc(ref, { members: arrayUnion(...newMemberIds) });
};
```

### Step 2.2 — Message Service

建立 `src/services/messageService.js`:

```javascript
import { db } from '../config/firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  updateDoc, doc, serverTimestamp
} from 'firebase/firestore';

export const sendMessage = async (chatroomId, messageData) => {
  // 寫入訊息到子集合
  await addDoc(collection(db, 'chatrooms', chatroomId, 'messages'), {
    ...messageData,
    isEdited: false,
    isUnsent: false,
    emojis: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // 更新聊天室最後訊息
  await updateDoc(doc(db, 'chatrooms', chatroomId), {
    lastMessage: messageData.type === 'text' ? messageData.content : `[${messageData.type}]`,
    lastMessageAt: serverTimestamp(),
  });
};

export const subscribeToMessages = (chatroomId, callback) => {
  const q = query(
    collection(db, 'chatrooms', chatroomId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

export const editMessage = async (chatroomId, messageId, newContent) => {
  await updateDoc(doc(db, 'chatrooms', chatroomId, 'messages', messageId), {
    content: newContent,
    isEdited: true,
    updatedAt: serverTimestamp(),
  });
};

export const unsendMessage = async (chatroomId, messageId) => {
  await updateDoc(doc(db, 'chatrooms', chatroomId, 'messages', messageId), {
    isUnsent: true,
    updatedAt: serverTimestamp(),
  });
};
```

### Step 2.3 — ChatPage 佈局

建立 `src/pages/ChatPage.jsx`:
- 主佈局：左側 Sidebar + 右側 ChatArea
- 使用 CSS Flexbox 佈局
- State 管理：`selectedChatroom`, `showCreateModal`, `showInviteModal` 等
- Sidebar 寬度 `var(--sidebar-width)`, ChatArea 佔滿剩餘空間

### Step 2.4 — Sidebar 元件群

建立 `src/components/sidebar/Sidebar.jsx`:
- 頂部：使用者頭像 + 名稱 + 設定按鈕（打開 ProfileModal）
- 「新聊天」按鈕 → 打開 CreateRoomModal
- 聊天室列表 (ChatroomList)
- Chatbot 按鈕（底部）

建立 `src/components/sidebar/ChatroomList.jsx`:
- 使用 `useChatrooms` hook 取得即時聊天室列表
- 渲染 `ChatroomItem` 列表

建立 `src/components/sidebar/ChatroomItem.jsx`:
- 顯示：聊天室名稱、最後訊息預覽、時間
- 選中狀態高亮
- hover 效果

建立 `src/components/sidebar/CreateRoomModal.jsx`:
- 選擇「私聊」或「群聊」
- 搜尋已註冊的使用者（從 Firestore users 集合查詢）
- 勾選成員 → 建立聊天室
- 群聊需要輸入群組名稱

建立 `src/components/sidebar/InviteMemberModal.jsx`:
- 搜尋使用者
- 勾選要邀請的成員
- 確認邀請

### Step 2.5 — ChatArea 元件群

建立 `src/components/chat/ChatArea.jsx`:
- 未選擇聊天室時顯示歡迎畫面
- 已選擇時顯示：ChatHeader + MessageList + MessageInput

建立 `src/components/chat/ChatHeader.jsx`:
- 聊天室名稱
- 成員數量
- 邀請成員按鈕
- 搜尋訊息按鈕

建立 `src/components/chat/MessageList.jsx`:
- 使用 `useMessages` hook 即時監聽訊息
- 自動滾動到最新訊息（useRef + scrollIntoView）
- 日期分隔線（不同天的訊息之間）

建立 `src/components/chat/MessageBubble.jsx`:
- 區分自己（靠右、accent 色）和他人（靠左、暗色）
- 顯示：發送者頭像、名稱（群聊時）、時間
- 收回的訊息顯示為灰色斜體「此訊息已被收回」
- 已編輯的訊息顯示「已編輯」標記
- 右鍵或 hover 顯示操作選單（收回、編輯）— 僅自己的訊息
- 圖片訊息以縮圖顯示，點擊放大
- GIF 訊息直接渲染 GIF
- **CSS 動畫**: 新訊息有 slideInUp 進場動畫

建立 `src/components/chat/MessageInput.jsx`:
- 文字輸入框（支援 Enter 發送、Shift+Enter 換行）
- 附加功能按鈕列：
  - 📷 圖片上傳按鈕
  - GIF 按鈕（打開 GifPicker）
  - 😀 emoji 反應按鈕（這是給訊息加 emoji 的，不在這裡）
- 發送按鈕
- 編輯模式時顯示「正在編輯」提示，可取消

### Step 2.6 — Custom Hooks

建立 `src/hooks/useChatrooms.js`:
- 訂閱使用者的聊天室列表
- 回傳 `{ chatrooms, loading }`

建立 `src/hooks/useMessages.js`:
- 訂閱指定聊天室的訊息
- 回傳 `{ messages, loading }`

**Git commit**: `feat: implement core chatroom with real-time messaging`

---

## Phase 3: 使用者個人資料 (User Profile — 10%)

### Step 3.1 — User Service

建立 `src/services/userService.js`:
- `getUserProfile(userId)` — `getDoc` from users collection
- `updateUserProfile(userId, data)` — `updateDoc`
- `getAllUsers()` — `getDocs` from users collection
- `searchUsers(query)` — 前端 filter（username 或 email 包含 query）
- `blockUser(currentUserId, targetUserId)` — `arrayUnion`
- `unblockUser(currentUserId, targetUserId)` — `arrayRemove`

### Step 3.2 — Storage Service

建立 `src/services/storageService.js`:
- `uploadProfileImage(userId, file)`:
  - 上傳到 `profile_images/{userId}`
  - 回傳 `getDownloadURL` 的結果
- `uploadMessageImage(chatroomId, file)`:
  - 上傳到 `message_images/{chatroomId}/{timestamp}_{filename}`
  - 回傳下載 URL

### Step 3.3 — ProfileModal

建立 `src/components/profile/ProfileModal.jsx`:
- Modal 容器（使用通用 Modal 元件）
- 頭像區：圓形顯示，點擊可上傳新圖片（preview 後再上傳）
- 表單欄位：
  - Username (text input)
  - Email (readonly, 顯示 Auth email)
  - Phone number (tel input)
  - Address (text input)
- 儲存按鈕 + 取消按鈕
- **CSS 動畫**: Modal 開啟有 scale + fade 動畫

**Git commit**: `feat: implement user profile with image upload`

---

## Phase 4: 訊息操作 (Message Operation — 10%)

### Step 4.1 — 收回訊息 (Unsend)
- MessageBubble hover 時，自己的訊息右上角出現「⋯」選單按鈕
- 選單包含「收回」選項
- 呼叫 `unsendMessage` 設定 `isUnsent: true`
- 顯示為灰色斜體「此訊息已被收回」
- 圖片訊息也可以收回

### Step 4.2 — 編輯訊息 (Edit)
- 「⋯」選單包含「編輯」選項（僅文字訊息）
- 點擊後 MessageInput 切換為編輯模式：
  - 輸入框填入原始內容
  - 上方顯示「正在編輯訊息」+ 取消按鈕
- 送出後呼叫 `editMessage`，訊息顯示「已編輯」標記

### Step 4.3 — 搜尋訊息 (Search)

建立 `src/components/chat/MessageSearch.jsx`:
- ChatHeader 的搜尋按鈕打開搜尋 panel
- 輸入關鍵字後在當前聊天室所有訊息中搜尋（前端 filter，不區分大小寫）
- 顯示搜尋結果列表（sender + content preview + time）
- 點擊結果 → 滾動到該訊息並高亮 2 秒

### Step 4.4 — 傳送圖片 (Send Image)
- MessageInput 的圖片按鈕觸發隱藏的 `<input type="file" accept="image/*">`
- 選擇檔案後顯示預覽（Modal 或 inline preview）
- 確認後上傳到 Firebase Storage → 取得 URL → 發送 type: "image" 訊息
- MessageBubble 中圖片以縮圖顯示（max-width: 300px）
- 點擊圖片打開 ImagePreview Modal (全螢幕預覽)

建立 `src/components/chat/ImagePreview.jsx`:
- 全螢幕半透明背景
- 圖片居中顯示
- 點擊背景或 X 按鈕關閉

**Git commit**: `feat: implement message operations (unsend, edit, search, send image)`

---

## Phase 5: Advanced Components

### Step 5.1 — Chrome Notification (5%)

**目標**: 當使用者不在某聊天室時，該聊天室有新訊息就發送瀏覽器通知（只通知未讀訊息）。

**實作方式**: 使用瀏覽器原生 `Notification API` + Firestore `onSnapshot`，不需要完整的 FCM 後端。

建立 `src/services/notificationService.js`:
```javascript
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title, body, onClick) => {
  if (Notification.permission !== 'granted') return;
  const notification = new Notification(title, {
    body,
    icon: '/vite.svg',
  });
  if (onClick) {
    notification.onclick = onClick;
  }
};
```

建立 `src/hooks/useNotification.js`:
- 初始化時請求通知權限
- 監聽使用者所有聊天室的新訊息
- 條件：當新訊息的 `senderId !== currentUser.uid` 且 `chatroomId !== currentActiveChatroomId` 時才通知
- 通知內容：「[發送者名稱]：[訊息內容預覽]」

同時建立 `public/firebase-messaging-sw.js`（即使主要邏輯用 Notification API，也要保留此檔案以備用）：
```javascript
// Service Worker for Firebase Cloud Messaging (optional)
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  if (data) {
    self.registration.showNotification(data.notification.title, {
      body: data.notification.body,
    });
  }
});
```

### Step 5.2 — CSS Animation (2%)

在以下地方加入 `@keyframes` 動畫（**不能只是 hover effect**）：

1. **登入/註冊頁面進場**: 卡片 fadeIn + slideUp
2. **新訊息進場**: slideInUp with subtle bounce
3. **Modal 開啟/關閉**: scale(0.9→1) + opacity(0→1)  /  reverse
4. **LoadingSpinner**: 旋轉動畫
5. **Sidebar 摺疊 (mobile)**: slideIn from left
6. **訊息搜尋高亮**: pulse 閃爍效果
7. **打字指示器**: 3 個 bouncing dots

範例 keyframes：
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}

@keyframes highlight {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(108, 99, 255, 0.3); }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

### Step 5.3 — XSS 防護 (2%)

- **所有顯示使用者輸入的地方都使用 `sanitizeInput()`**
- React JSX 的 `{}` 已經會自動 escape，但仍需注意 `dangerouslySetInnerHTML`（不要使用它）
- 特別測試：
  - `<script>alert('example');</script>` → 應顯示為純文字
  - `<h1>example</h1>` → 應顯示為純文字
- 在 `MessageBubble.jsx` 和 `ChatroomItem.jsx` 等顯示使用者輸入的地方，確保使用 `{sanitizeInput(content)}` 而非 dangerouslySetInnerHTML

**Git commit**: `feat: implement Chrome notification, CSS animations, and XSS protection`

---

## Phase 6: Bonus Components

### Step 6.1 — Chatbot with Gemini API (2%)

建立 `src/services/geminiService.js`:
```javascript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function chatWithGemini(message, history = []) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [...history, { role: 'user', parts: [{ text: message }] }]
    })
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

建立 `src/components/chatbot/ChatbotModal.jsx`:
- 仿 ChatGPT 對話式 UI
- 維護本地 conversation history（不存 Firestore）
- 支援多輪對話
- 訊息氣泡區分使用者（右邊）和 AI（左邊）
- 載入中顯示打字指示器（bouncing dots）
- 從 Sidebar 底部的「🤖 AI 助手」按鈕開啟
- 可關閉 Modal

### Step 6.2 — Block User (2%)

在 `src/services/userService.js` 新增 blockUser / unblockUser 函式。

封鎖邏輯：
- **私聊**: User A block User B:
  - B 無法在此私聊中發送訊息
  - 聊天 UI 顯示橫幅警告「你已無法與此用戶聊天」或「此用戶已封鎖你」
  - MessageInput 被 disabled
- **群聊**: A (blocker) 和 B (blocked) 在同一群組:
  - A 看不到 B 的訊息，B 看不到 A 的訊息（互相隱藏）
  - 使用 `currentUser.blockedUsers` 過濾 messages

觸發點：
- 在 ChatHeader 的聊天室成員列表中，每個成員旁有「封鎖/解除封鎖」按鈕
- 或在 MessageBubble 的「⋯」選單中加入「封鎖此用戶」

### Step 6.3 — Send GIF from GIPHY API (3%)

**注意**：Tenor API 已停止接受新用戶 (2026/01)，改用 GIPHY API。
**使用者需要先到 https://developers.giphy.com/ 申請免費 API Key (Beta: 100 req/hr)。**

建立 `src/services/giphyService.js`:
```javascript
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const BASE_URL = 'https://api.giphy.com/v1/gifs';

export async function searchGifs(query, limit = 20, offset = 0) {
  const res = await fetch(
    `${BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g&lang=en`
  );
  const data = await res.json();
  return data.data; // each gif has .images.fixed_height.url
}

export async function getTrendingGifs(limit = 20) {
  const res = await fetch(
    `${BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`
  );
  const data = await res.json();
  return data.data;
}
```

建立 `src/components/chat/GifPicker.jsx`:
- 從 MessageInput 的 GIF 按鈕打開（彈出式面板）
- 頂部搜尋欄
- 預設顯示 trending GIFs
- CSS Grid 2~3 欄瀑布流佈局
- 點擊 GIF → 發送 type: "gif" 訊息，content = gif.images.fixed_height.url
- **底部必須顯示「Powered by GIPHY」logo**（使用條款要求）
- MessageBubble 中 GIF 以 `<img>` 渲染

### Step 6.4 — Message Emoji Reactions (3%)

建立 `src/components/chat/EmojiReaction.jsx`:
- 預定義 emoji: `['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏']`
- MessageBubble hover 時，在訊息上方或旁邊顯示 emoji 快速反應列（小氣泡）
- 點擊 emoji 後更新 Firestore:
  ```javascript
  // 新增 emoji
  await updateDoc(messageRef, {
    [`emojis.${emoji}`]: arrayUnion(currentUser.uid)
  });
  // 移除 emoji (unsend)
  await updateDoc(messageRef, {
    [`emojis.${emoji}`]: arrayRemove(currentUser.uid)
  });
  ```
- 已有該 emoji 的訊息：在氣泡下方顯示 emoji + 數量（例如 `👍 3`）
- 再次點擊已送出的 emoji → 取消（unsend emoji）
- 多人送同一 emoji 時合併顯示數量

**Git commit**: `feat: implement bonus components (chatbot, block user, GIF, emoji)`

---

## Phase 7: RWD 響應式設計 (5%)

### 設計斷點

```css
/* Desktop (default): Sidebar + ChatArea side by side */

/* Tablet (≤ 768px) */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0; top: 0; bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .sidebar-overlay {
    /* 半透明背景 */
  }
  .chat-header .menu-btn {
    display: block; /* 顯示漢堡選單 */
  }
}

/* Mobile (≤ 480px) */
@media (max-width: 480px) {
  .sidebar {
    width: 100vw;
  }
  .message-input {
    /* 調整按鈕間距 */
  }
}
```

### 重要規則
- **所有元件都必須可見**，不能因為螢幕小就隱藏
- **主要功能不需要滾動**就能看到
- Mobile: Sidebar 為 overlay 模式，有漢堡選單按鈕
- Tablet: Sidebar 為 overlay 模式
- Desktop: Sidebar 固定在左側

**Git commit**: `feat: implement responsive design for all screen sizes`

---

## Phase 8: UI 精修

- 確保所有元件都使用 CSS Variables
- 檢查所有 hover/focus 狀態
- 確保 Loading 狀態有 LoadingSpinner
- 確保所有 Modal 有 backdrop 和關閉動畫
- 確保空狀態有友善的提示文字（例如「還沒有聊天室」、「選擇一個聊天室開始聊天」）
- 確保所有按鈕有 cursor: pointer 和適當的 hover 效果
- 確保所有 form 有適當的 focus 樣式

**Git commit**: `style: polish UI and improve user experience`

---

## Phase 9: 部署與交付

### Step 9.1 — Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# public directory: dist
# SPA: Yes
# Overwrite index.html: No

npm run build
firebase deploy
```

`firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

### Step 9.2 — Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /chatrooms/{chatroomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;

      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null;
      }
    }
  }
}
```

注意: Security rules 先用寬鬆版開發，上線前可視需要收緊。

### Step 9.3 — README.md

README 必須包含：

```markdown
# Chatroom — Midterm Project

## 功能說明
- Email 註冊/登入 + Google 登入
- 建立私聊/群聊
- 即時訊息收發
- 歷史訊息載入
- 邀請新成員
- 個人資料編輯（頭像、名稱、信箱、電話、地址）
- 訊息收回/編輯/搜尋
- 圖片傳送
- Chrome 未讀通知
- CSS 動畫效果
- XSS 防護
- AI Chatbot (Gemini)
- 封鎖使用者
- GIF 搜尋發送 (GIPHY)
- 訊息 Emoji 反應
- 響應式設計

## 操作方式
（詳細描述每個功能如何操作）

## 本地架設步驟
1. `git clone <repo-url>`
2. `cd chatroom`
3. `npm install`
4. 建立 `.env` 檔案（參考 `.env.example`）
5. `npm run dev`
6. 開啟 http://localhost:5173

## 使用技術
- React (Vite)
- Firebase (Auth, Firestore, Storage, Hosting)
- Gemini API
- GIPHY API
- DOMPurify
```

### Step 9.4 — 最終確認

1. `npm run build` — 確認 production build 成功
2. `firebase deploy` — 確認部署成功
3. 產出 zip 檔（排除 node_modules）
4. 計算 MD5 checksum

**Git commit**: `chore: prepare for deployment and submission`

---

## 附錄：共用元件規格

### LoadingSpinner
- 居中顯示的旋轉動畫圓圈
- 使用 `@keyframes spin`

### Avatar
- 圓形圖片元件
- Props: `src`, `alt`, `size` (sm/md/lg)
- 無圖片時顯示使用者名稱的首字母（背景色用 accent gradient）

### Modal
- 通用 Modal 容器
- Props: `isOpen`, `onClose`, `title`, `children`
- 背景半透明黑色
- 內容區白色卡片居中
- **CSS 動畫**: scaleIn / scaleOut
- 點選背景或 X 按鈕關閉
- 按 Escape 鍵關閉
