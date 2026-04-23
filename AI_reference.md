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

## phase 3 — 使用者個人資料（ImgBB 頭像上傳）

**Prompt**: 進 Phase 3，建立 ImgBB 上傳與個人資料編輯 Modal。

**Location**:
- `src/services/imgbbService.js` — `uploadImage` / `uploadProfileImage` / `uploadMessageImage`，上傳前先擋掉非圖片、> 32 MB 檔案並拋中文錯誤訊息
- `src/components/profile/ProfileModal.jsx` + `.css` — 頭像區（點擊換圖、即時 preview、可取消新圖）、username/phone/address 表單、Email readonly，登出按鈕移到這裡（左下紅色 ghost 按鈕）
- `src/components/sidebar/Sidebar.jsx` + `.css` — 把頂部使用者區塊改成整塊可點按鈕，右邊多一個齒輪；移除原本孤立的「⎋ 登出」圖示
- `src/pages/ChatPage.jsx` — 新增 `showProfile` state + 掛 `ProfileModal`，把 `userProfile` 傳進去

**Refinement & Explanation**:
- **登出搬進 ProfileModal**：原計畫 Sidebar 同時放登出和設定，實際操作時容易誤按（登出是破壞性動作）。把登出放到 ProfileModal 底部紅色 ghost 按鈕，使用者必須先「打開設定」才能登出，安全得多，也和主流 IM（Telegram、Messenger）習慣一致。
- **`URL.createObjectURL` 預覽 + cleanup**：頭像改圖先顯示 preview，儲存時才上傳 ImgBB，取消或 modal 關閉時 `revokeObjectURL` 釋放記憶體（`useEffect` 的 cleanup 處理）。
- **同時更新 Firebase Auth `displayName` / `photoURL`**：Firestore 是我們的 single source of truth（靠 `userProfile`），但 Auth 端同步寫一次能讓未來若直接讀 `currentUser.displayName` 的地方也拿到正確資料。寫失敗只 `console.warn` 不擋主流程。
- **ImgBB 前端驗證**：雖然 API 會擋錯誤檔案，但先在前端擋掉 `!file.type.startsWith('image/')` 與 `size > 32 MB`，使用者拿到的錯誤訊息更即時也可以是中文。
- **denormalized `senderName` / `senderPhoto` 的 trade-off**：使用者改名/頭像後，**歷史訊息的 bubble 不會跟著變**（符合 Phase 2 設計，保留「發送當下」狀態）。未來 Phase 6 block 邏輯看的是 `senderId` 而非 name，不受影響。
- `npm run build` 通過（642 KB）。
- **後續修正（同 Phase）— 私聊名稱依觀看者解析**：原 `CreateRoomModal` 把對方 username 直接寫進 `chatroom.name`，但這只是「建立者視角下的對方」，導致非建立者登入時看到的是自己。新增 `src/contexts/UsersContext.jsx` 訂閱整個 `users` collection 並 memo 出 `usersById`，掛在 `App.jsx` 的 `AuthProvider` 內。`ChatroomItem` / `ChatHeader` 改在 render 時找出 `chatroom.members` 中「非自己」的 uid，再用 `usersById[otherUid]` 取得對方最新 `username` / `photoURL`；對方改名/換頭像會即時反映。群組仍走 `chatroom.name`。`chatroom.name` 保留為 fallback 但實質失效，後續 Phase 可考慮移除或改存純粹 metadata。

## phase 4 — 訊息操作（收回 / 編輯 / 搜尋 / 傳送圖片）

**Prompt**: 進 Phase 4，實作訊息收回、編輯、搜尋、傳送圖片。

**Location**:
- `src/components/chat/MessageBubble.jsx` + `.css` — 自己的訊息 hover 顯示「⋯」按鈕，展開選單含「✏️ 編輯」（僅 text 訊息）與「🗑 收回」（破壞性，紅色，跳 `confirm` 二次確認）；新增 `is-highlighted` class 與 `@keyframes highlightPulse`（搜尋跳轉時閃 2 秒紫光暈）
- `src/components/chat/MessageList.jsx` — 把 `onEdit` / `onUnsend` / `onImageClick` / `highlightedMessageId` 一路 props drilling 給 bubble；每個 bubble wrapper 加 `data-message-id`，以 `useEffect` 監聽 `highlightedMessageId` 用 `querySelector` + `scrollIntoView({ block: 'center' })` 定位
- `src/components/chat/MessageInput.jsx` + `.css` — 新增「📎」附加按鈕、隱藏 `<input type="file" accept="image/*">`、選檔後上方顯示 inline preview（檔名 + 移除鈕）；支援 `editingMessage` prop：banner「✏️ 正在編輯訊息」+ 取消按鈕，Enter 改呼叫 `editMessage`，Esc 取消編輯；發送圖片走 `uploadMessageImage` → ImgBB → `sendMessage` type=`image`
- `src/components/chat/MessageSearch.jsx` + `.css` — 浮動 panel（`position: absolute`，掛在 `chat-area-body` 右上），即時前端 filter 不區分大小寫，跳過 `isUnsent` 與非 text 訊息，結果列表顯示 sender + time + 兩行截斷的 preview
- `src/components/chat/ImagePreview.jsx` + `.css` — 全螢幕半透明背景，`position: fixed`、Esc 關閉、點背景關閉、scaleIn 進場
- `src/components/chat/ChatArea.jsx` + `.css` — host 4 個新 state（`editingMessage` / `searchOpen` / `highlightedMessageId` / `previewImage`）；切換聊天室時全部重置；`highlightedMessageId` 用 2 秒 `setTimeout` 自動清掉；新增 `.chat-area-body` wrapper（`position: relative` + flex column），讓 search panel 能 absolute 定位

**Refinement & Explanation**:
- **State 全部 lift 到 ChatArea**：MessageInput 的 edit 模式、search panel 開關、跳轉高亮 — 三者都跨元件，集中放 ChatArea 才能正確協調（例如收回正在編輯的訊息要同時清掉 editing state）。MessageBubble 與 MessageInput 維持 dumb 元件，狀態只往上拋 callback。
- **收回前跳 `window.confirm`**：收回是不可逆操作，UX 上不能單擊就觸發。雖然原計畫沒明文要求，但跟主流 IM（Telegram、Messenger）一致。
- **搜尋跳過 `isUnsent` 與非 text 訊息**：收回的訊息 content 還在 Firestore（只是設了 flag），搜尋時要跳過避免假命中；圖片/GIF 訊息的 content 是 URL，搜尋它沒意義。
- **`highlightPulse` 用 `box-shadow` 而非 `background`**：bubble 本身有漸層背景，改 background 會破壞既有樣式；用 box-shadow 做 4px 紫色光暈更顯眼也不影響佈局。
- **編輯模式 disable 圖片附加**：UX 上「編輯純文字訊息時還能加圖」沒意義，且 edit 路徑只更新 content 字串，加圖會讓資料模型混亂；直接在按鈕 disabled + 改 title 提示。
- **ImgBB 上傳期間用按鈕文字 `⏳`**：避免另外做 loading overlay。`uploading` 同時 disable 整個 input 區塊（含 textarea），防止重複觸發。
- **MessageSearch panel 不蓋住 input**：原本想用 Modal，實測會擋住聊天輸入；改用 chat area 內的 floating panel（max-height 算 100% - 80px），跳轉到結果時才會關閉 panel 並露出對應訊息。
- **denormalize 副作用 — 編輯後 `lastMessage` 不會更新**：`editMessage` 只動該訊息文件，sidebar 顯示的 `lastMessage` 是 chatroom 文件的 snapshot，編輯最後一則訊息後 sidebar 預覽不變。Phase 5 可在 `editMessage` 內補一個 conditional update（只在編輯的是最新一則時才同步），目前先接受此 trade-off。
- `npm run build` 通過（650 KB）。

## phase 5 — Advanced（瀏覽器通知 + CSS 動畫整理 + XSS 防護）

**Prompt**: 進 Phase 5，實作 Chrome Notification、整理 CSS Animation、補強 XSS 防護。

**Location**:
- `src/services/notificationService.js` — `isNotificationSupported` / `requestNotificationPermission` / `showNotification`，包權限檢查與 try/catch；通知有 `tag` + `renotify`，點擊呼叫 `window.focus()` + 跳轉 callback
- `src/hooks/useNotification.js` — 訂閱使用者所有 chatrooms 的 messages（每間 `orderBy createdAt desc, limit 15`），用 `docChanges()` 過濾 `type === 'added'`；以 `sessionStartRef`（`Date.now()`）丟掉載入前的歷史訊息；`notifiedIdsRef` 去重避免重啟 listener 重複通知；條件：非自己 + 不在 active room 或頁面失焦時才彈
- `src/pages/ChatPage.jsx` — 接上 `useNotification`，把 `selectedChatroomId` 當 active，點擊通知後切換到對應聊天室並關閉 mobile sidebar
- `public/firebase-messaging-sw.js` — service worker placeholder，handle `push` / `notificationclick`，未來若導入 FCM 不需再建檔
- `src/components/common/TypingDots.jsx` + `.css` — 三點 bouncing dots，`@keyframes typingBounce`，預留給 Phase 6 chatbot loading 使用
- `src/components/sidebar/Sidebar.jsx` / `chat/ChatHeader.jsx` / `sidebar/ChatroomItem.jsx` / `sidebar/UserPicker.jsx` — display 端統一過 `sanitizeInput`（防禦縱深，React JSX 雖會自動 escape）

**Refinement & Explanation**:
- **不用 FCM 全套**：Phase 0 就決定省略 VAPID key，這裡用瀏覽器原生 `Notification API` + Firestore `onSnapshot` 即可達成「在背景或不在當前聊天室時收到通知」。Service worker 仍建檔（`public/firebase-messaging-sw.js`）為日後切換 FCM 預留路徑。
- **通知去重靠 `sessionStartRef` + `notifiedIdsRef`**：onSnapshot 重新訂閱時會把現有訊息當 `added` 全部回放，若不過濾就會在每次列表重排時轟炸通知。`sessionStartRef = Date.now()` 在 hook mount 時凍結，比這更早的訊息直接 mark 已通知；`notifiedIdsRef` 是 Set 在 hook 生命週期內持有，避免相同訊息 ID 重複彈出。
- **`document.hasFocus()` 才忽略 active room**：當前聊天室訊息預設不通知，但若使用者切到別的視窗（focus 不在），即使是 active room 也應該通知 → 這個條件用 `(room.id === active && document.hasFocus())` 才跳過。
- **訂閱粒度 = chatroom 列表變動**：useEffect dependency 用 `chatroomIds = chatrooms.map(id).sort().join(',')` 而非 `chatrooms` 本身，避免每次 sidebar 排序變化都重新訂閱所有 messages collection。`activeChatroomId` 與 `onClickChatroom` 透過 ref 取最新值，不觸發重訂。
- **`tag` + `renotify`**：相同寄件人連續傳訊只會更新同一個系統通知，不會在通知中心堆出一長串。
- **`limit(15)` 而非全量**：通知 hook 不需要看完整訊息歷史，每間 chatroom 訂最近 15 則就夠用，省 Firestore quota。
- **CSS 動畫盤點**：Phase 1 `authCardIn`、Phase 2 `messageIn` / `modalScale` / `modalFade` / `spin`、Phase 3 `backdropFade` + sidebar mobile slideIn、Phase 4 `highlightPulse` / `bubbleMenuIn` / `searchPanelIn` / `imageScaleIn`，加上本 Phase 的 `typingBounce` 共 11 組 `@keyframes`，分散在各元件 CSS 中。
- **XSS 防禦縱深**：React JSX `{}` 已自動 escape `<` / `>`，`<script>` 等惡意字串只會顯示為純文字不會執行；但仍在所有顯示「使用者可控字串」（username / 群組名）的位置額外過 `DOMPurify.sanitize(..., { ALLOWED_TAGS: [] })`，遵循 OWASP「縱深防禦」原則。可手動測試：把使用者名稱改成 `<script>alert(1)</script>` 後在 sidebar / chat header / user picker 都應顯示為純文字（DOMPurify 會把 tag 拆掉，留下 `alert(1)`），無 alert 彈窗。
- `npm run build` 通過（652 KB）。
- **後續修正（同 Phase）— 通知請求改成手動觸發 + 過濾改為 first-snapshot-seen**：實測使用者沒有看到瀏覽器權限請求彈窗，根因有二：(1) Chrome / Edge 現行政策要求 `Notification.requestPermission()` 必須由「使用者明確互動」觸發，原先在 `useNotification` 的 `useEffect` 載入時直接呼叫 → 瀏覽器靜默忽略；(2) 原本用 `sessionStartRef = Date.now()` 過濾舊訊息，client / server 時鐘 skew 可能誤殺新訊息。修正：新增 `src/components/sidebar/NotificationButton.jsx`（🔔 按鈕配紅點 pulse 動畫，掛在 sidebar 「新聊天」按鈕旁），點擊才呼叫 `requestNotificationPermission`；已 granted 時點擊會發測試通知方便驗證；denied 時跳 alert 引導去網址列鎖頭設定。`useNotification` hook 移除自動請求邏輯與時間過濾，改成「每間 chatroom 第一次 snapshot 時把現有訊息 ID 全 mark seen，之後 docChanges 才彈通知」，不再依賴時鐘。順帶把 notification icon 從不存在的 `/vite.svg` 改為 `/favicon.svg`。
- **後續修正（同 Phase）— 應用內 toast fallback + 修復 bubble 選單消失**：使用者授權通知後實測仍收不到系統通知（Windows 11 Focus Assist / Do Not Disturb 會靜默吞掉），且 message bubble 的「⋯」選單打開後游標往下移時整個選單瞬間消失。
  - **Toast fallback**：`src/components/common/NotificationToast.jsx` + `.css`，固定在右下角，最多同時 3 個，5 秒自動消失，點 toast 跳到對應聊天室。`useNotification` hook 加 `onNotify` callback prop，每則符合條件的新訊息**永遠**會呼叫 `onNotify` 推 toast，瀏覽器通知改為「best-effort」（permission granted 才額外發）。`ChatPage` 用 `useState` + `useRef`（dismiss timer map）管理 toast 佇列，`useCallback` 穩定 `pushToast` / `dismissToast` 的 reference 避免 hook 反覆重訂。
  - **Bubble menu 消失**：`.message-bubble-menu` 預設 `opacity:0`，靠 `.message-row:hover` 才顯示。使用者點 ⋯ 開選單後，下拉清單距觸發鈕有 4px 空隙，游標經過時 row 失去 hover → opacity:0 把整個 menu wrapper（含下拉）一起隱藏。修法：當 `menuOpen` 為 true 時加上 `is-open` class，CSS 用 `.message-bubble-menu.is-open { opacity: 1 }` 強制可見，且 trigger 也呈現按下狀態（背景變 hover 色）。