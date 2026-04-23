# AI_reference
1. AI Tool(s) Used: Claude Code、Antigravity
2. Scope of Usage: For every segment of code generated or assisted by AI
- Location: File name and specific line numbers (e.g., App.js, lines 45-82).
- Prompt & Response: The exact prompt you used and the AI's output
(Screenshots are highly recommended).
- Refinement & Explanation: Show your modified version of the code and provide
a brief explanation of why you made those changes and how the logic works.

## implementation plan
先根據 pdf 操作 Antigravity 完成 implementation_plan.md 檢視計畫內容並微調修改
接著請 Antigravity 把這些內容轉化成交給 claude code 執行的 CLAUDE_PLAN.md

## phase 0 — 專案初始化

**Prompt**: 執行 CLAUDE_PLAN.md 的 Phase 0，依 `事先準備.txt` 填入環境變數。

**Location**:
- `package.json` — 加入 `firebase`、`react-router-dom`、`dompurify` 三個 runtime 依賴
- `.env` / `.env.example` — 定義 12 個 `VITE_*` 變數並依 `事先準備.txt` + ImgBB 填值
- `src/config/firebase.js` — Firebase 初始化，匯出 `auth` / `googleProvider` / `db`（不再匯出 `storage`，改用 ImgBB）
- `src/index.css` — 深色主題 CSS variables、全域 reset、Inter 字體綁定
- `src/utils/sanitize.js` / `formatTime.js` / `constants.js` — 共用工具函式
- `index.html` — 加 Google Font `Inter` 的 preconnect 與 stylesheet，title 改 `Chatroom`
- `src/App.jsx` / `App.css` — 替換掉 Vite 預設示範畫面，改為 Phase 0 placeholder
- `.gitignore` — 排除 `.env`、`.firebase`、`事先準備.txt`

**Refinement & Explanation**:
- 直接用 `npm create vite@latest` 搭最新 React 19 + Vite 8 骨架（先進 `_temp_vite` 子目錄再搬根目錄），避開與現有 PDF/規劃文件衝突，同時拿到官方最新 template。
- 把 `事先準備.txt` 加入 `.gitignore`：它含真實 API key，不能進 commit 歷史。
- 多加了 `VITE_FIREBASE_MEASUREMENT_ID` 和 `VITE_FIREBASE_DATABASE_URL` 兩個變數（原 plan 未列但 `事先準備.txt` 有提供，先保留以備後用）。
- 設計系統一律用 CSS variables，後續 Phase 直接引用，避免硬編碼顏色。
- `VITE_FIREBASE_VAPID_KEY` 留空：Phase 5 計畫走瀏覽器原生 Notification API，不需要 FCM VAPID key。
- **偏離計畫的重大決策 — 換掉 Firebase Storage**：Storage 要求 Blaze 付費方案，改用 ImgBB 免費 API（32MB/張、永久保存、只需 API key）。影響：`firebase.js` 移除 `getStorage`，`CLAUDE_PLAN.md` 改寫 Step 3.2 成 `imgbbService.js`，新增 `VITE_IMGBB_API_KEY`。上層元件介面不變（仍是 `uploadProfileImage` / `uploadMessageImage`），只換底層實作。
- `npm run build` 驗證通過，Git 初始化在 `main` 分支並完成 Phase 0 commit。

## phase 1 — 會員系統 (Email + Google)

**Prompt**: 進 Phase 1，實作 Email/Google 登入註冊與路由保護。

**Location**:
- `src/contexts/AuthContext.jsx` — `AuthProvider` 用 `onAuthStateChanged` 同步 `currentUser`，並訂閱 `users/{uid}` 文件即時取得 `userProfile`
- `src/services/authService.js` — `registerWithEmail` / `loginWithEmail` / `loginWithGoogle` / `logout`，新註冊會在 Firestore 建立完整 user 文件（含 `blockedUsers: []`、phone/address 預留欄位）；附 `getAuthErrorMessage` 把 Firebase 錯誤碼翻成中文
- `src/pages/LoginPage.jsx` / `RegisterPage.jsx` / `auth.css` — 玻璃擬態卡片、`@keyframes authCardIn` fadeIn+slideUp 進場動畫、gradient 主按鈕、雙色光暈背景
- `src/components/auth/GoogleLoginBtn.jsx` — 內嵌官方四色 Google logo SVG（不依賴外部圖檔）
- `src/components/common/LoadingSpinner.jsx` + `.css` — 通用 spinner，`@keyframes spin`，支援 fullscreen 蓋版
- `src/pages/ChatPage.jsx` — 暫時的歡迎畫面（顯示 username + UID + 登出鈕），實際 UI 留待 Phase 2
- `src/App.jsx` — `BrowserRouter` + `AuthProvider` + `PrivateRoute` / `PublicOnlyRoute`，已登入訪問 `/login` 自動轉去 `/`，未知路徑 fallback 到 `/`

**Refinement & Explanation**:
- `AuthContext` 多訂閱一層 `userProfile`：原計畫只要 `currentUser`，但後面 Phase 2/3 多元件都要 `username` / `photoURL`，提早把 Firestore profile 即時化可避免每個元件各自 `getDoc` + 同步問題。
- 多了 `PublicOnlyRoute`：登入後再造訪 `/login` 會跳回 `/`，避免出現「明明已登入卻看到登入表單」的尷尬狀態。
- `getAuthErrorMessage` 統一翻譯錯誤碼：Firebase 預設訊息是英文且偏技術，集中處理可保 UI 一致、後續 Phase 也能複用。
- 表單輸入全部過 `sanitizeInput` 後再丟出去，username 的 trim 與長度檢查在前端先擋；密碼不過 sanitize（避免影響特殊字元）。
- `npm run build` 通過（612 KB，僅內建 chunk-size warning，可後續 code-split 優化）。

## phase 2 — 聊天室核心（即時訊息）

**Prompt**: 進 Phase 2，建立即時聊天核心（私聊/群聊、訊息收發、Sidebar/ChatArea）。

**Location**:
- `src/services/chatroomService.js` / `messageService.js` / `userService.js` — Firestore 訂閱 + CRUD；`findPrivateChatroom` 用於避免建立重複私聊
- `src/hooks/useChatrooms.js` / `useMessages.js` — 封裝 `onSnapshot` 生命週期
- `src/components/common/Avatar.jsx` + `Modal.jsx` — 通用頭像（錯誤退回首字母）與 Modal（Escape 關閉、scale+fade 動畫、點背景關閉）
- `src/components/sidebar/` — `Sidebar` / `ChatroomList` / `ChatroomItem` / `UserPicker` / `CreateRoomModal` / `InviteMemberModal`
- `src/components/chat/` — `ChatArea` / `ChatHeader` / `MessageList` / `MessageBubble` / `MessageInput`
- `src/pages/ChatPage.jsx` + `.css` — Sidebar + ChatArea 佈局、mobile 漢堡選單、CreateRoom/Invite modal 控制
- `src/components/chat/MessageBubble.css` — `@keyframes messageIn`（訊息進場 slideUp）

**Refinement & Explanation**:
- **私聊去重**：`CreateRoomModal` 先呼叫 `findPrivateChatroom`，已存在就直接選取而不再建一間。避免雙方各自建立不同房的混亂。
- **UserPicker 抽離**：CreateRoom 和 Invite 都要選人，共用同一個 `UserPicker` 元件（支援單選/多選、搜尋、排除清單）避免重複。
- **MessageInput 先做純文字**：圖片 / GIF / emoji 反應分別屬 Phase 4 / 6，現在不掛空按鈕，等各自 Phase 再加，避免 UI 有不可用的占位。
- **Mobile 漢堡選單提早做**：原計畫 Phase 7 才處理 RWD，但 Sidebar 佈局實際會影響所有 Phase，現在先用 media query + `mobile-open/closed` class 讓側邊欄在 ≤768px 變成 overlay，之後 Phase 7 只需補強細節。
- **`senderName`/`senderPhoto` 寫死在訊息**：沿用計畫的 denormalize 設計 — 訊息發送時快照使用者資料，避免後續 render 每則訊息都得 `getDoc` 查使用者，同時也保留了「傳送當下的發送者名稱」的歷史意義。
- **Firestore 可能提示建立 composite index**：`subscribeToChatrooms` 用 `where('members','array-contains') + orderBy('lastMessageAt')`，第一次執行時 Console 會回傳建索引連結，點開按一下即可。
- **後續修正（同 Phase）— 移除 `orderBy` 改前端排序**：實測時 sidebar 永遠空白，根因是 composite index 沒建好導致 `onSnapshot` 進入 error callback、UI 把錯誤吞掉。改成 query 只留 `where`，前端用 `lastMessageAt → createdAt` fallback 排序；同時 `useChatrooms` 把 `error` 一路傳到 `ChatroomList`，未來訂閱失敗會直接在側欄顯示錯誤碼，不用每次都翻 DevTools。
- `npm run build` 通過（637 KB）。