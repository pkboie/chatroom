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
- **後續修正（同 Phase）— 修復收回後 sidebar 預覽未更新 + bubble 選單按不下去**：上一輪修好「選單不消失」後，使用者回報兩個連帶 bug：(1) 收回最新訊息後，左側 sidebar 的預覽仍顯示原文；(2) 下拉選單雖然看得到但點不到，游標移過去沒反應。
  - **Sidebar preview 未更新**：`unsendMessage` 只翻 message 文件的 `isUnsent` flag，但 `chatroom.lastMessage` 是 Phase 2 為了省讀取而 denormalize 的欄位，沒跟著改。修法：[src/services/messageService.js:62-76](src/services/messageService.js#L62-L76) 的 `unsendMessage` 加上 post-update 驗證 — 用 `orderBy('createdAt','desc'), limit(1)` 撈目前最新一則，若 id 等於被收回的 messageId，就把 `chatroom.lastMessage` 覆寫成常數 `UNSENT_PREVIEW = '訊息已收回'`；若不是最新則（例如收回的是舊訊息），sidebar 預覽不需要動。現有的 `subscribeToChatrooms` 訂閱會自動把變更推到 `ChatroomItem`，無需改 UI。
  - **選單按不下去**：根因是 `.message-list { overflow-y: auto }` 結合 sibling `.message-bubble-stack` 的 `position: relative` stacking context，導致絕對定位的 `.message-bubble-menu-list` 即使視覺在上層，pointer events 仍被同層 bubble 吞掉（或被 overflow clip 切掉命中區域）。修法：[src/components/chat/MessageBubble.jsx](src/components/chat/MessageBubble.jsx) 用 `createPortal` 把下拉清單搬到 `document.body`，配 `position: fixed` + `useLayoutEffect` 同步讀 `getBoundingClientRect()` 算 `top` / `right` 內聯樣式；外部點擊判定同時檢查 `triggerRef` 與 `listRef`（兩者現在不同 subtree）；加 scroll / resize listener 自動關閉，避免 portal 飄離觸發按鈕。[src/components/chat/MessageBubble.css:133-146](src/components/chat/MessageBubble.css#L133-L146) 改 `position: fixed` + `z-index: 2000` 浮到 app chrome 之上，移除舊的 `.is-self` 變體規則（portal 後位置統一用 inline style）。`npm run build` 通過。

## phase 6.1 — AI Chatbot (Gemini)

**Prompt**: 進 Phase 6.1，實作側邊欄 🤖 AI 助手 Chatbot（用 Gemini API）。

**Location**:
- [src/services/geminiService.js](src/services/geminiService.js) — 封裝 `gemini-2.0-flash` REST endpoint，匯出 `chatWithGemini(userMessage, history)` + `isGeminiConfigured()`；帶 `systemInstruction`（繁中簡潔助手）、`generationConfig`（temperature 0.7 / maxOutputTokens 1024）；錯誤分類（API 非 2xx、finishReason=SAFETY、空回應）
- [src/components/chatbot/ChatbotModal.jsx](src/components/chatbot/ChatbotModal.jsx) + [.css](src/components/chatbot/ChatbotModal.css) — 重用 `Modal`（size=lg），對話列表 + textarea 輸入 + 送出鈕；AI 左側 🤖，使用者右側 🙂；傳送中顯示 `<TypingDots>`；錯誤用紅色 inline 條；清空對話按鈕放 `modal-footer`；訊息陣列只存在元件 state（不寫 Firestore）；Enter 送、Shift+Enter 換行、ESC 關閉（Modal 已處理）
- [src/pages/ChatPage.jsx](src/pages/ChatPage.jsx) — 新增 `showChatbot` state，傳 `onOpenChatbot` 給 `Sidebar`，掛 `<ChatbotModal>`；Sidebar 的 🤖 按鈕原本是 placeholder（`disabled={!onOpenChatbot}`），現在接上 callback 自動變可用
- `.env` — 填入 `VITE_GEMINI_API_KEY`（39 chars，從 Google AI Studio 申請）

**Refinement & Explanation**:
- **為何用 REST 而非 `@google/generative-ai` SDK**：SDK 會再拉一個 ~20KB 依賴，而 Gemini REST 呼叫只需 `fetch` + JSON，自己寫只要 ~50 行且對參數更透明。未來若要切 streaming 或 function calling 再考慮導 SDK。
- **對話歷史格式**：Gemini 要求 `contents` 陣列裡 role 只能是 `'user'` 或 `'model'`（不是 `'ai'` 或 `'assistant'`），`chatWithGemini` 內部把本地用的 `role: 'ai'` 轉成 `'model'`。歡迎訊息 `WELCOME` 是純 UI 項，不送進 history（`.filter((m) => m !== WELCOME)`），避免每次對話都把它當成 model 第一句話。
- **歷史只存 state**：依計畫要求不寫 Firestore。`setMessages([WELCOME])` 可清空重啟對話。Modal 關閉不清空 — 使用者重開對話可接著問，但重整頁面就會重置（純 client-side）。
- **錯誤時還原輸入**：若 API 失敗，把剛加進 state 的 user message pop 掉並把文字放回 textarea，使用者不用重打。
- **SAFETY finishReason 特別處理**：Gemini 安全過濾器擋下時不會報 HTTP 錯誤而是回 empty candidate；`candidates[0].finishReason === 'SAFETY'` 時丟較友善的中文錯誤。
- **為什麼不用 `streamGenerateContent`**：streaming 在 UI 上要多寫 reader 迴圈與部分更新，但本需求回應短，直接一次回覆 + `TypingDots` loading 的體感已經足夠，且錯誤處理更簡單。
- **Scroll lock**：共用 `Modal` 已處理（`body.style.overflow = 'hidden'`），Chatbot 沒重複。
- `npm run build` 通過（658 KB，僅既有 chunk-size warning）。

## phase 6.2 — Block User

**Prompt**: 進 Phase 6.2，實作封鎖 / 解除封鎖：私聊互鎖時 disable input，群聊互相隱藏訊息。

**Location**:
- [src/services/userService.js:45-57](src/services/userService.js#L45-L57) — `blockUser` / `unblockUser` 已在 Phase 1 預先寫好（用 `arrayUnion` / `arrayRemove`），本 Phase 直接接上 UI
- [src/components/chat/ChatroomInfoModal.jsx](src/components/chat/ChatroomInfoModal.jsx) + [.css](src/components/chat/ChatroomInfoModal.css) — 重用 `Modal`（size=md），列出 `chatroom.members` 的每位使用者；非自己的成員旁邊有「封鎖 / 解除封鎖」按鈕，封鎖前 `window.confirm` 二次確認；忙碌中按鈕顯示 `...`，錯誤紅色內聯顯示
- [src/components/chat/ChatHeader.jsx:73-83](src/components/chat/ChatHeader.jsx#L73-L83) — 新增 `onOpenInfo` prop 與 `ⓘ` 按鈕（依群組 / 私聊切換 title 文案）
- [src/components/chat/ChatArea.jsx](src/components/chat/ChatArea.jsx) — 接 `useUsers()` 拿 `usersById`；新增 `infoOpen` state、`visibleMessages` memo（過濾雙向封鎖）、`privateBlock` memo（決定 `MessageInput.disabled` 與 banner 文案）；切換聊天室時 reset `infoOpen`
- [src/components/chat/MessageInput.jsx](src/components/chat/MessageInput.jsx) + [.css](src/components/chat/MessageInput.css) — 新增 `disabledReason` prop，當 `disabled && disabledReason` 時頂端顯示紅色 `🚫 ...` banner（`.message-input-blocked-banner`）

**Refinement & Explanation**:
- **不另外存「對方封鎖了我」資料**：`UsersContext` 已經 subscribe 全使用者集合並 memo `usersById`，所以可直接讀 `usersById[otherUid].blockedUsers?.includes(currentUid)` 判斷反向封鎖，不需在自身文件 mirror 一份。對方按下「封鎖」後 `onSnapshot` 即時推來，UI 會自動切到 disabled。
- **群聊雙向過濾**：依 CLAUDE_PLAN「A 看不到 B 的訊息，B 看不到 A 的訊息」，`visibleMessages` 同時檢查 (a) `myBlocked.has(senderId)` 與 (b) `usersById[senderId].blockedUsers?.includes(myUid)`。因此封鎖等同於互相對話 mute。自己的訊息永遠保留（`senderId === currentUser.uid` 早 return true），避免自己看不到自己發過的話。
- **私聊改 disable + banner，不藏訊息**：歷史訊息對封鎖前的對話仍有意義，藏掉會讓使用者搞不清狀況。改成保留歷史、但禁止繼續發送，並用紅色 banner 講清楚原因（兩種文案：「你已封鎖此用戶」vs「此用戶已封鎖你」）。
- **`MessageSearch` 也吃 `visibleMessages`**：搜尋結果不會洩漏被封鎖使用者的內容，與聊天視窗一致。
- **`disabled` + `disabledReason` 解耦**：`disabled` 由現有用法保留（純 disable 行為），`disabledReason` 才會渲染 banner。未來若有其他 disable 場景（例如系統維護、唯讀房）可單獨重用。
- **二次確認**：封鎖按鈕跳 `window.confirm`，`window.confirm` 取消時 early return 不發 Firestore 請求；解除封鎖則直接執行（破壞性低）。
- **不重新對 chatroom.members 同步**：封鎖只是過濾顯示，不改動 chatroom 成員陣列，所以群組頁顯示總人數仍是真實成員數。
- `npm run build` 通過（661 KB）。

## phase 6.3 — GIF Picker (GIPHY)

**Prompt**: 進 Phase 6.3，整合 GIPHY，MessageInput 加 GIF 按鈕、popover 選單、發送 type=gif 訊息。

**Location**:
- [src/services/giphyService.js](src/services/giphyService.js) — `searchGifs(query, opts)` / `getTrendingGifs(opts)` / `isGiphyConfigured()`；rating=g、bundle=`messaging_non_clips`（GIPHY 的「適合 IM 的尺寸子集」回傳體積較小）；空 query 走 trending、有 query 走 search；錯誤統一拋 `Error`
- [src/components/chat/GifPicker.jsx](src/components/chat/GifPicker.jsx) + [.css](src/components/chat/GifPicker.css) — popover panel（380 寬 × 420 高），搜尋 input + 2 欄 grid（`fixed_height` 縮圖）+ 「Powered by GIPHY」footer；input 變更 350 ms debounce 才打 API；外部點擊與 Esc 關閉；`<img loading="lazy">` 減少首屏負擔；`gifPickerIn` keyframe 進場動畫
- [src/components/chat/MessageInput.jsx](src/components/chat/MessageInput.jsx) + [.css](src/components/chat/MessageInput.css) — 在 📎 旁邊加「GIF」按鈕（`message-input-gif-btn` 變體：較小字、字重 700）；點擊 toggle `gifOpen`；切換聊天室 reset；選中 GIF 呼叫 `handleSelectGif` 直接走 `sendMessage` type=GIF（不上傳圖檔，直接存 GIPHY 提供的 URL）；`.message-input` 改為 `position: relative` 讓 picker 用 `bottom: 100%` 浮在輸入列正上方
- `.env` — 已有 `VITE_GIPHY_API_KEY`（32 chars，從 GIPHY developers 申請）

**Refinement & Explanation**:
- **不過 ImgBB 中轉**：GIPHY URL 已經是 CDN 託管且 GIPHY 條款允許 hot-link，自己再上傳一份既浪費也違反 best practice。直接把 `images.fixed_height.url` 存進 `message.content`，MessageBubble 渲染 type=GIF 時當圖片顯示。
- **`bundle: 'messaging_non_clips'`**：GIPHY 提供的「IM 場景子集」，回傳體積較小、剔除 clip 類資產，搭配 `fixed_height` (200px tall) 在 picker 載入快、訊息氣泡也夠清晰。`rating=g` 過濾為一般大眾級避免 NSFW。
- **搜尋 debounce 350 ms**：GIPHY beta key 限額 100 req/hr，input 不 debounce 會每打一個字就送一次。空字串時直接打 trending 不 debounce（使用者明確 clear）。
- **不存歷史 / 不快取**：picker 每次開都重新打 API，trending 結果通常 GIPHY CDN 自己有快取。本地快取省下的請求數有限、卻會讓 UI 變舊。
- **anchor 用 `position: absolute` + `bottom: 100%`**：把 picker 放在 `.message-input` 內部、`.message-input` 改 `position: relative`，picker 自然浮在輸入列上方左對齊；不用 portal，因為 input 區域上方沒有 overflow / stacking 問題。
- **GIF 訊息封鎖也適用**：私聊封鎖時 MessageInput 整體 disable，GIF 按鈕也跟著 disabled；群聊封鎖過濾走 `visibleMessages`，GIF 訊息和文字一視同仁被過濾。
- **「Powered by GIPHY」footer**：GIPHY 條款 4.4 要求 attribution 可見。Footer 用較小字 + uppercase 處理，不搶版面。
- **預留：`getTrendingGifs(opts)` 已支援 limit**：後續若要做 infinite scroll，picker body 加 IntersectionObserver 追加結果即可。本 Phase 先不做。
- `npm run build` 通過（664 KB，CSS 從 33.5 KB 漲到 35.8 KB）。

## phase 6.4 — Emoji Reactions

**Prompt**: 進 Phase 6.4，實作快速 emoji 反應：bubble hover 出現 8 個 emoji 選單，點擊 toggle；氣泡下方顯示計數。

**Location**:
- [src/services/messageService.js](src/services/messageService.js) — 新增 `addReaction(chatroomId, messageId, emoji, userId)` 與 `removeReaction(...)`；都走 `arrayUnion` / `arrayRemove` 的 field-path 語法 `emojis.${emoji}`，不會污染其他 emoji 的陣列
- [src/components/chat/MessageBubble.jsx](src/components/chat/MessageBubble.jsx) + [.css](src/components/chat/MessageBubble.css) — 新增 `☺` 快速反應 trigger（放在 ⋯ 選單前面）、portal 進 `document.body` 的 8-emoji 橫條 popover（`.message-bubble-react-bar`）、氣泡下方的 reaction pills（`.message-bubble-reactions`）；使用者已反應的 pill 會帶 `is-reacted` class（紫色邊框 + 淡底）
- [src/components/chat/MessageList.jsx](src/components/chat/MessageList.jsx) — 新增 `onToggleReaction` / `currentUserId` 兩個 props 往下傳給 `MessageBubble`
- [src/components/chat/ChatArea.jsx](src/components/chat/ChatArea.jsx) — 新增 `handleToggleReaction` 判斷 `message.emojis[emoji]` 是否包含當前 uid，呼叫對應的 add / remove service
- `src/utils/constants.js` — `EMOJI_LIST` 陣列在 Phase 0 已經預定義好（👍 ❤️ 😂 😮 😢 😡 🔥 👏），本 Phase 直接使用

**Refinement & Explanation**:
- **data shape**：`message.emojis` 在 Phase 2 `sendMessage` 就預設是 `{}`。本 Phase 用 field-path `emojis.👍 = arrayUnion(uid)`，Firestore 會自動建立該欄位與空陣列並加入 uid；不同 emoji 之間互相獨立。
- **為何兩個 API 而不是一個 toggle**：Firestore 沒有原生 "toggle array element"，需要先讀當前值才知道要 union 還是 remove。把判斷放在 UI 層（`message.emojis[emoji].includes(uid)`）然後呼叫對應 service，比在 service 層多一次 `getDoc` 省一個 round-trip，也讓 UI 有即時 optimistic feedback（Firestore onSnapshot 會很快推回真實狀態）。
- **portal react bar 定位**：沿用 Phase 5 修好的 ⋯ menu pattern — `useLayoutEffect` 讀 `getBoundingClientRect()`、`position: fixed`、scroll / resize 時自動關閉、dual-ref 外部點擊判定（trigger + bar 兩個不同 subtree）。bar 定位在 trigger 上方 48px 左右偏 80px，8 顆 emoji 橫排不會擋到 bubble。
- **自己也能對自己的訊息 reaction**：和主流 IM（Messenger / Slack）一致；不擋 `isSelf`。
- **被收回的訊息不可反應**：`canReact = !message.isUnsent && !!onToggleReaction`，收回後連 `☺` trigger 都不渲染，既有的 reaction pills 仍保留（歷史資料不強制清）。
- **pill 點擊也 toggle**：使用者若已反應過，直接點氣泡下方的 pill 取消；不用再開快速反應條。`is-reacted` 視覺態讓使用者知道自己已投過。
- **不做「長按顯示 reactor 名單」**：本 Phase 只展計數，`title` 提示「N 位已反應」即可。若要列名單可從 `uids` 陣列配 `usersById` 取 username，留給後續 Phase。
- **hover trigger 與 ⋯ menu 共用 `.message-bubble-menu` 容器 + `is-open` 規則**：CSS 已經處理 hover 消失問題（Phase 5 修過），reaction trigger 重用同規則不需額外 CSS。
- `npm run build` 通過（667 KB，CSS 37.1 KB）。

## phase 6 後續修正（follow-ups）

Phase 6.1–6.4 完成後使用者回報三項體感問題，分三個 commit 修正：

### Follow-up 1 — Gemini 429 錯誤訊息
**Prompt**: Gemini 配額用完時彈出整串 JSON `⚠️ Gemini API 回傳 429：{ "error": { ... } }`，看不懂。

**Location**: [src/services/geminiService.js](src/services/geminiService.js)

**Refinement**:
- 把 REST error body 用 `JSON.parse` 萃取 `error.message`，`parse` 失敗 fallback 到前 200 字元的 raw text。
- 分狀態碼映射中文訊息：429 → 「Gemini 免費額度已用完，請稍後再試或到 Google AI Studio 檢查用量」；400 + `API key` 字樣 → 「Gemini API Key 無效...」；403 → 「權限不足或未啟用 Generative Language API」；其他狀態碼用統一格式 `Gemini 錯誤（${status}）：${apiMessage}`。
- 不露原始 JSON 給使用者；ChatbotModal 原本的 `⚠️ ${err.message}` banner 就直接顯示友善訊息。

### Follow-up 2 — 封鎖 UX（雙向鎖 + 左側紅色標記）
**Prompt**: 「封鎖雖然雙方都不能訊息，但是點開對方的頭像還是有封鎖選項可以按」+ 希望被封鎖使用者在 sidebar 有紅色標記。

**Location**:
- [src/components/chat/ChatroomInfoModal.jsx](src/components/chat/ChatroomInfoModal.jsx) + [.css](src/components/chat/ChatroomInfoModal.css)
- [src/components/sidebar/ChatroomItem.jsx](src/components/sidebar/ChatroomItem.jsx) + [.css](src/components/sidebar/ChatroomItem.css)

**Refinement**:
- **雙向偵測**：新增 `theyBlockedMe = user?.blockedUsers?.includes(currentUser.uid)`。三種狀態 → 按鈕三種表現：(a) `isBlocked` → 「解除封鎖」可按；(b) `theyBlockedMe && !isBlocked` → disabled + 「對方已封鎖你」+ `.is-locked` 灰底；(c) 正常 → 「封鎖」紅邊框可按。
- **紅色 pill 標籤**：`.info-member-badge` 兩種 `is-blocked-tag`：`已封鎖` / `對方封鎖你`，讓使用者在成員列表一眼看出誰處於封鎖狀態。
- **sidebar 紅色封鎖標記**：`ChatroomItem` import `useAuth` 取 `userProfile`，計算 `iBlockedOther || otherBlockedMe` = `showBlockBadge`；頭像外包一層 `.chatroom-item-avatar`（`position: relative`），絕對定位的 18×18 圓形 `🚫` badge 在右下角，並給頭像加 `filter: grayscale(0.7)` 視覺上也暗一截；badge 邊框用 `2px solid var(--bg-secondary)` 與底色融合；`pointer-events: none` 不搶點擊。
- **為何 sidebar 只判 1:1 私聊**：群聊顯示的是群組圖 / 預設圖，對「誰被封鎖」沒有意義；`isGroup` 時直接跳過判定。

### Follow-up 3 — 輸入時使用 Emoji（Picker）
**Prompt**: 「emoji 功能正常，但是我想要 emoji 也能在傳訊息的時候使用」。

**Location**:
- [src/components/chat/EmojiPicker.jsx](src/components/chat/EmojiPicker.jsx) + [.css](src/components/chat/EmojiPicker.css)
- [src/components/chat/MessageInput.jsx](src/components/chat/MessageInput.jsx)

**Refinement**:
- **picker 結構**：5 個分類（表情 / 心情 / 手勢 / 愛心 / 其他）約 160 個 emoji，8 欄 grid、340×320 popover、`position: absolute; bottom: 100%`（沿用 GifPicker 相同 anchor 策略、放在 `.message-input` 內），`emojiPickerIn` keyframe 進場動畫；外部點擊 + Esc 關閉。
- **MessageInput 整合**：新增 `emojiOpen` state（切換聊天室 reset）、GIF 按鈕旁加 `😊` 觸發按鈕；`handleInsertEmoji` 讀 `textareaRef.current.selectionStart` / `selectionEnd`，切片貼入 emoji，`requestAnimationFrame` 等 React 重 render 後 re-focus 並把 caret 移到 emoji 後方（避免游標跳到最前 / 最後）。
- **不關 picker on select**：使用者常連按多個 emoji；點選後插入但 picker 保持開啟，想關就按空白處或 Esc，與主流 IM 行為一致。
- **和 6.4 reactions 邏輯區隔**：Reactions 是 metadata（存 `emojis.👍: [uid...]`）、picker 是輸入法，兩條路不共用 list：reactions 只給 8 個常用、picker 給 ~160 個分類完整覆蓋。兩者共用 emoji 字元但走不同 code path。
- **為何不做最近使用（MRU）**：要額外存 user-level state 或 localStorage，複雜度不對等本 phase 的收益；留給後續。
- `npm run build` 三次 follow-up 後全部通過（670 KB，CSS 39.0 KB）。

## phase 7 — RWD 響應式設計

**Prompt**: 進 Phase 7，把所有元件在 ≤768px / ≤480px 螢幕都能用，所有按鈕 / picker / modal / bubble 不能溢出或被擠扁。

**Location**:
- [src/pages/ChatPage.css](src/pages/ChatPage.css) — 已在 Phase 0 預埋：≤768px sidebar 變 `position: fixed; transform: translateX(-100%)`，搭配 `mobile-open` class 滑入；同時 ChatPage 渲染 `.chat-page-sidebar-backdrop` 點擊關閉；≤480px sidebar `width: 100vw`
- [src/pages/ChatPage.jsx](src/pages/ChatPage.jsx) — 已預埋：`isMobile` state 監聽 resize，傳 `onMobileMenu` 給 ChatHeader 顯示漢堡 ☰；選聊天 / 建房 / 點 toast 後在 mobile 自動關 sidebar
- [src/components/chat/MessageInput.css](src/components/chat/MessageInput.css) — 新增 ≤768 / ≤480 規則：icon 與 send 按鈕從 40 → 36 → 34px、padding / gap 收窄；textarea 字級保持 ≥15px（避免 iOS 觸發自動 zoom）
- [src/components/chat/MessageBubble.css](src/components/chat/MessageBubble.css) — `max-width: min(82%, 520px)` (≤768) / `88%` (≤480)；圖片用 `min(280px, 70vw)` 不會比螢幕還寬；reaction trigger / menu trigger 縮小一號
- [src/components/chat/MessageList.css](src/components/chat/MessageList.css) — 訊息區 padding 20→14→12，把多出來的橫向空間還給氣泡
- [src/components/chat/ChatHeader.css](src/components/chat/ChatHeader.css) — header padding / icon 一起縮，`.chat-header-name` 字級 16→15→14.5；hamburger ☰ 已存在不需改 JSX
- [src/components/chat/MessageSearch.css](src/components/chat/MessageSearch.css) — ≤768 panel 改 `left/right: 8px; width: auto` 鋪滿；`top` 從 64→56→52 對齊縮小後的 header 高度
- [src/components/chat/GifPicker.css](src/components/chat/GifPicker.css) — ≤480 改 `left: 8px; width: calc(100% - 16px); height: min(60vh, 380px)`，原本 380×420 在 360px 寬螢幕會出血
- [src/components/chat/EmojiPicker.css](src/components/chat/EmojiPicker.css) — ≤480 同上策略，並把 grid 從 8 欄改 7 欄、cell 字級 19→20px 拇指好按
- [src/components/chat/ChatroomInfoModal.css](src/components/chat/ChatroomInfoModal.css) — `.info-member-list` `max-height` 從固定 400px 改 `min(400px, 55vh)`，避免在矮螢幕（橫向手機）把整個 modal 撐到要外捲動
- [src/components/common/Modal.css](src/components/common/Modal.css) — ≤480 modal-backdrop padding 16→8、header / body / footer 內距縮一輪、`.modal max-height: calc(100vh - 16px)` 把可用高度榨乾
- [src/components/sidebar/Sidebar.css](src/components/sidebar/Sidebar.css) — sidebar-top padding 16→12 在 mobile，新聊天按鈕字級 14→13.5
- [src/pages/auth.css](src/pages/auth.css) — ≤480 card padding 40/32 → 28/20、brand 字級 32→28；input 字級鎖 16px **避免 iOS Safari focus 時觸發自動 zoom**（< 16px 會觸發）

**Refinement & Explanation**:
- **斷點選擇**：用 PDF / CLAUDE_PLAN 指定的 768 + 480 兩個斷點。768 是「平板與手機橫向」分界（sidebar 進 overlay），480 是「手機直立」（更激進壓縮、sidebar 100vw）。沒再多加斷點避免規則散得到處都是。
- **「所有元件都必須可見」原則**：CLAUDE_PLAN 明文要求不能因為螢幕小而隱藏功能。所有按鈕（📎 / GIF / 😊 / 送出 / 通知）在最小斷點仍存在，只是 size 縮小；hamburger ☰ 是「新增」入口而非「替代」（取代 desktop sidebar 常駐位）。
- **氣泡寬度策略**：desktop 70% 兩邊都看得清，mobile 螢幕本身就窄、再 70% 就太碎。改成 82 / 88% + 仍保留 4–8% 的反方對齊空白讓 self / other 一眼分得出。
- **iOS auto-zoom trap**：iOS Safari focus input 時，若 `font-size < 16px` 會強制放大整頁。auth-field 桌面用 15px 就好（漂亮），mobile 把 input 改 16px 換掉這個 UX 雷。MessageInput 的 textarea 同理保持 14.5→15px，剛好閥值內。
- **picker 寬度策略**：GifPicker / EmojiPicker 桌面用 `min(380px, calc(100% - 24px))` 已經 fluid，只在 ≤480 改成 `calc(100% - 16px)` 鋪滿並收緊邊距；高度用 vh 跟著鍵盤升起後的可視高自動縮（避免在打開鍵盤時 picker 把畫面塞滿擋到輸入框）。
- **MessageSearch top 對齊縮小後的 header**：header 從桌面 `padding: 12px 18px` (≈64px tall with avatar) → 行動 `8px 10px` (≈52px)。search panel 原本寫死 `top: 64px` 在 mobile 會留一條空白，跟著對應到 56 / 52。
- **不動 JSX，全部走 CSS @media**：行為（hamburger toggle、resize listener、選擇後關 sidebar）Phase 0 已經做好，Phase 7 純粹是「視覺 / 觸控壓縮」工作；不改 JS 才能避免 regress 既有事件流。
- **CSS 體積**：39.0 → 41.5 KB（gzip 6.47 → 6.91），增加 ~2.5 KB raw 全部來自 @media block；對首屏負擔可忽略。
- **未測項目（須使用者真機測）**：iOS 安全區域（notch、底部 home indicator 重疊 MessageInput）、Android 鍵盤升起時 picker 是否擋輸入框、橫向手機（< 480 高、> 480 寬）的混合情境。CSS 已盡量用 vh / `min()` 緩衝，但實機體感建議再驗一次。
- `npm run build` 通過（670 KB JS / 41.5 KB CSS）。

## phase 8 — UI 精修（global a11y polish）

**Prompt**: 進 Phase 8，按 CLAUDE_PLAN 的 checklist 把全域 polish 一輪：CSS variable、hover/focus、Loading、Modal、空狀態、cursor、form focus。

**Location**:
- [src/index.css](src/index.css) — 新增 `--error-text` (`#fecaca`)、`--focus-ring` token；新增 `button:disabled { cursor: not-allowed }`、全域 `:focus-visible` ring、`::-webkit-scrollbar` 統一樣式、`@media (prefers-reduced-motion: reduce)` block
- [src/components/profile/ProfileModal.css](src/components/profile/ProfileModal.css)、[src/components/sidebar/CreateRoomModal.css](src/components/sidebar/CreateRoomModal.css)、[src/pages/auth.css](src/pages/auth.css) — 將原本三處硬編碼 `#fecaca` 改用 `var(--error-text)`

**Refinement & Explanation**:
- **CSS Variables 完成度**：grep 後僅剩三個元件用 `#fecaca`（紅底錯誤訊息文字色），抽成 `--error-text` 後全專案沒有逸出 token 的硬編碼色（`auth.css` 內 `rgba(26,26,46,0.65)` 等仍是因為要「bg-primary 半透明」這種 token 不易表達的合成色，可接受）。
- **`:focus-visible` 不是 `:focus`**：`:focus` 在滑鼠點擊也會觸發 → 滑鼠操作時殘留醜醜的 ring。`:focus-visible` 是瀏覽器啟發式判定「使用者真的需要 focus 提示」（鍵盤 Tab 進來才亮），對滑鼠隱藏。先把全域 `:focus { outline: none }` 清掉預設 ring，再用 `:focus-visible` 覆蓋成 `box-shadow: var(--focus-ring)`。
- **不在 focus-visible 設 `border-radius`**：早一版我寫了 `border-radius: var(--radius-sm)` 會踩到圓形按鈕（`.message-input-send` 等 `border-radius: 50%`）→ focus 時瞬間變方角。`box-shadow` 自動跟隨元素自身 border-radius，不需另外指定。
- **`button:disabled { cursor: not-allowed }`**：原本各元件各寫一份（`.message-input-send:disabled`, `.auth-submit:disabled`...）。提到全域後元件層的同規則仍然有效（不衝突），但新增 disabled button 不必再記得寫。
- **`prefers-reduced-motion`**：把所有 `*` 的 `animation-duration` 與 `transition-duration` 強制壓到 0.01ms（不能設 0，會被 spec 視為「沒有動畫」反而觸發某些 onAnimationEnd handler 不 fire）。`scroll-behavior: auto` 把 `scrollIntoView({ behavior: 'smooth' })` 也降回瞬移。對前庭敏感（vestibular disorder）使用者很重要；macOS / iOS / Windows 11 都有此設定可開。
- **全域 scrollbar**：原本 MessageList / ChatroomList 各自寫 `::-webkit-scrollbar`，其餘容器走預設醜醜的 OS scrollbar。提到全域 8px、track 透明、thumb 用 `var(--border-color)`，per-component override 仍生效（specificity 一樣 → 後寫贏）。Firefox 不吃 `-webkit-scrollbar` 但會走 OS 樣式，可接受。
- **空狀態 / Loading 已就位**（不需動）：
  - `MessageList` loading 用 `LoadingSpinner size={32}`，empty 顯示「還沒有訊息，發送第一則開始對話 👋」
  - `ChatroomList` loading 用 `LoadingSpinner size={28}`，empty「還沒有聊天室」+ 「點擊上方「新聊天」開始」副文案，error 顯示 error.code
  - `MessageSearch` 三段空狀態：`!query` → 「輸入關鍵字開始搜尋」；`results.length === 0` → 「查無符合的訊息」
  - `ChatArea` 無選中聊天室時顯示「歡迎使用 Chatroom」+ 漸層 brand 文字
  - `GifPicker` loading / error / empty 三段都有；`ChatbotModal` 有 typing dots
- **Modal backdrop / 動畫已就位**（不需動）：`Modal.css` 有 `modalFade` (backdrop) + `modalScale` (panel) keyframe；點擊 backdrop 關閉走 Modal 元件 onClick handler；Esc 關閉走各元件自己的 keydown listener。
- **CSS 體積**：41.5 → 42.2 KB（gzip 6.91 → 7.09），增加 ~700 bytes 全部來自全域 a11y / polish 規則。
- `npm run build` 通過（670 KB JS / 42.2 KB CSS）。

## phase 8.5 — bug fix（literal text display）+ unread 標記與計數

**Prompt**:
1. 「請幫我改成我輸入甚麼內容 輸出就會是甚麼內容」— 想要 `<script>alert("example");</script>`、`<h1>example</h1>`、`<` 都「原文照顯示」，目前送出後 `<` 會變成 `&lt;`（雙重轉義 bug）。
2. 「想要新增還尚未讀訊息的聊天室 可以用特殊的符號或其他方式標記 並且可以顯示未讀幾則訊息」。

**Location**:
- [src/utils/sanitize.js](src/utils/sanitize.js) — `sanitizeInput` 改為 identity（`(input) => input`），不再呼叫 DOMPurify。XSS 防護改由 React 的 `{value}` text node 渲染負責（瀏覽器不會把字串解析成 HTML）。
- [src/components/chat/MessageInput.jsx](src/components/chat/MessageInput.jsx) — 移除原本想加的 `contentError` 狀態 / 清除 effect / 送出前過濾為空檢查 / 錯誤橫幅 UI；同時拆掉現在用不到的 `sanitizeInput` import。送出邏輯回歸到「`value.trim()` 為空就 return」。
- [src/services/messageService.js](src/services/messageService.js) — `sendMessage` 加入未讀計數 fanout：先 `addDoc(messages)`，再讀 `getDoc(chatroomDoc)` 拿 `members` 陣列，對每個非 sender 的 uid 用 `[`unreadCounts.${uid}`]: increment(1)` 寫入 chatroom 的 dotted field map；`updates` object 同步更新 `lastMessage` / `lastMessageAt`。新增 `markChatroomRead(chatroomId, userId)` export，把 `unreadCounts.${uid}` 直接寫 `0`。新增 `getDoc` / `increment` 至 import。
- [src/pages/ChatPage.jsx](src/pages/ChatPage.jsx) — 新增 `markChatroomRead` import 與 effect：依 `[selectedChatroomId, currentUser?.uid, activeUnread]` 觸發；當切換進聊天室或新訊息進來、且該室自己的 `unreadCounts[uid] > 0` 時，呼叫 `markChatroomRead` 歸零。`activeUnread` 從 `selectedChatroom?.unreadCounts?.[uid] || 0` 取得，無此欄位時為 0 不發 write。
- [src/components/sidebar/ChatroomItem.jsx](src/components/sidebar/ChatroomItem.jsx) — 從 `chatroom.unreadCounts?.[currentUserId] || 0` 取 unread 數；`hasUnread = unreadCount > 0 && !isSelected`（已選中的不顯示 badge，因為馬上會被 markRead 歸零）；className 加 `is-unread` modifier 讓名稱變粗 / 預覽變主色 / 時間轉 accent；新增第二行 `chatroom-item-row-bottom`：左邊 `chatroom-item-preview` 右邊 `chatroom-item-unread-badge`（顯示 `unreadCount > 99 ? '99+' : unreadCount`，`title` / `aria-label` 都帶「N 則未讀訊息」給 a11y）。
- [src/components/sidebar/ChatroomItem.css](src/components/sidebar/ChatroomItem.css) — 新增 `.chatroom-item-row-bottom`（margin-top 2、center、gap 6）；`.chatroom-item-preview` 加 `flex: 1; min-width: 0`（讓 ellipsis 在 flex 子元素上生效）；`.is-unread` 三條規則改名稱 / 預覽 / 時間樣式；`.chatroom-item-unread-badge` 用 `min-width: 20; height: 20; border-radius: 999px; background: var(--accent-gradient); box-shadow: 0 2px 6px rgba(108,99,255,0.45)`，11px / 700 字重的白色數字。

**Refinement & Explanation**:
- **為何 sanitize 變 identity 是安全的**：grep 全 src 確認沒有 `dangerouslySetInnerHTML`，所有訊息 / 名稱都走 `{value}` JSX 文字內插。React 在這個模式下會把字串送進 `document.createTextNode`，瀏覽器不會把它當 HTML 解析，`<script>` 也只會以「文字」呈現、不會執行。原本 DOMPurify 那層其實是「多此一舉的 belt-and-suspenders」，但它把 `<` 轉成 `&lt;` HTML entity，被 React 文字渲染再原樣輸出時就看到 `&lt;` 字面，這就是雙重轉義 bug 的根因。
- **不刪除 `sanitizeInput` 函式 / 其他 14 處呼叫**：保留 identity 版本，所有 `sanitizeInput(x)` 呼叫變 no-op、輸出與輸入一字不差。這樣比一次性把 14 處 import + 呼叫全砍掉風險低、diff 小，未來若要再加白名單過濾也只要改一個檔。
- **未讀 fanout 寫在 sendMessage 內**：alternative 是要求每個 caller 額外傳 members 陣列；現選擇在 service 內 `getDoc` 自己拿，多一次 read 換 API 乾淨（chatroom 文件本來就被 ChatroomList snapshot 訂閱、Firestore 會 cache，實務上多半命中）。Dotted-path field update（`unreadCounts.${uid}`）允許在不知道現有 map 形狀的情況下原子地遞增單個欄位，舊 chatroom 文件沒有 `unreadCounts` 欄也會自動建立。
- **markRead 的「count > 0 才寫」守門**：onSnapshot 每次任何欄位變化都會 fire，若無守門等於每收一條訊息（即使是自己發的）都要一次 write。判斷 `activeUnread > 0` 把這條切掉，只在「真的有未讀」時才寫；user 自己發訊息 `unreadCounts[selfUid]` 永遠 0（fanout 跳過 sender），不會冗 write。
- **selected room 不顯示 badge**：選中的聊天室 0.3 秒內就會被 markRead 寫 0，badge 顯示再消失視覺很跳。直接 `hasUnread = unreadCount > 0 && !isSelected` 在 client 端先把 selected 視為已讀，user 看不到中間態。
- **99+ 上限**：badge 寬度為 `min-width: 20px`，三位數會撐爆 chatroom-item 排版；參考 iOS / Slack 的習慣顯示 `99+`，超過 99 的精確數字本來就不是有用資訊。
- **舊資料相容**：`chatroom.unreadCounts?.[uid] || 0` — 沒 `unreadCounts` 欄、沒此 uid key、值為 `undefined` / `null` 都會落到 0，不會 NaN / undefined 進 className。
- **未做 / 已知限制**：(1) Firestore security rules 沒改：理論上 client 可以亂改別人的 `unreadCounts.uid`，但目前 rules 已經允許 member 寫整個 chatroom 文件，是同一層級風險；正式上線前應該收斂成「只能改 `unreadCounts.${request.auth.uid}` 自己那格」。(2) 未實作「點選 chatroom 後立刻把名稱由粗變細」的樂觀更新 — 目前依賴 markRead 的 server roundtrip 回來才更新，閃爍可接受。
- `npm run build` 通過（648.7 KB JS / 42.86 KB CSS）。

## phase 8.6 — 鈴鐺通知改 on/off toggle

**Prompt**: 「請再幫我改一下鈴鐺通知的按鈕可以幫我切換開跟關嗎 可以選擇有通知跟沒有通知」。

**Location**:
- [src/hooks/useNotificationMuted.js](src/hooks/useNotificationMuted.js) — 新檔。共享 `muted` 狀態（localStorage key: `notification_muted`，值 `'1'`/`'0'`）。Module-level `Set<listener>` 讓 `NotificationButton`（writer）跟 `useNotification`（reader）在同一個 tab 內即時同步，不需要 Context。Export `useNotificationMuted()` 回傳 `[muted, setMuted, toggle]`，try/catch 包 localStorage（防 private mode / quota 拋錯）。
- [src/hooks/useNotification.js](src/hooks/useNotification.js) — `import { useNotificationMuted }` → 取 `[muted]`，新增 `mutedRef`（與 `activeRef` 同模式）並在 `useEffect([muted])` 同步。snapshot callback 內在 `if (msg.isUnsent) return;` 之後加 `if (mutedRef.current) return;` — toast 與 browser notification 兩條一起跳過。
- [src/components/sidebar/NotificationButton.jsx](src/components/sidebar/NotificationButton.jsx) — 全面重寫。改吃 `useNotificationMuted` 為主狀態，`Notification.permission` 為輔。點擊邏輯：(a) 目前 `muted=true` → 翻成開：若 permission 為 `default` 先 `requestNotificationPermission()`；若 `denied` 跳 alert 告知「桌面通知被封鎖但 in-app 提示仍會顯示」；最後一律 `setMuted(false)`。(b) 目前 `muted=false` → 翻成關：直接 `setMuted(true)`。icon 切 🔔/🔕、`aria-pressed={!muted}`、`title` 三段（off / on-but-denied / on-default-permission-asked / on-granted）。
- [src/components/sidebar/NotificationButton.css](src/components/sidebar/NotificationButton.css) — 拿掉舊的 `notif-btn-dot` + `notifDotPulse` keyframe（已用不到）。新增三組狀態色：`.notif-btn-on`（accent 紫底淡色 = 完整啟用）、`.notif-btn-on-partial`（橘色 = 開啟但 OS 權限被擋，僅有 toast）、`.notif-btn-off`（muted 灰色文字）。

**Refinement & Explanation**:
- **「muted」是獨立於 OS 權限的另一層開關**：使用者可能 OS 權限早給了，但這幾天不想被打擾 → 一鍵 mute；或 OS 權限沒給，但 in-app toast 還是想關掉 → 也是 mute。所以這個狀態不能和 `Notification.permission` 綁在一起，必須各自獨立。
- **muted 同時擋兩條通道（toast + browser）**：使用者說「沒有通知」應該真的沒有，不只是擋 OS。如果只擋 browser，他在 app 內仍看到 toast 飄出來會覺得 toggle 沒作用。
- **預設值 = 不 muted（顯示通知）**：opt-out 比 opt-in 合理 — 大多數人裝聊天 app 預設是希望知道有人傳訊息。
- **不用 Context、用 module-level listener Set**：只有兩個消費端（按鈕 + hook），且都在 ChatPage 子樹下；多包一層 Provider 是 over-engineering。Module-level Set + try/catch 包 localStorage 已能處理 SSR / private mode / quota。Cross-tab 同步沒做（沒寫 `storage` event listener）— 多開分頁時各自獨立的 muted 狀態其實比較貼直覺（你在 A 分頁靜音不該影響 B 分頁）。
- **`mutedRef` 的必要性**：useNotification 內 `onSnapshot` callback 在 useEffect 第一次 run 時就 closure 住當時的 `muted` 值，後面再變不會反映；改用 `ref + useEffect 同步` 模式才能在 callback 觸發當下讀到最新值。同檔 `activeRef` / `onClickRef` / `onNotifyRef` 已經是這個 pattern，新加的 `mutedRef` 一致。
- **「default 先請求權限」的 UX**：使用者第一次開啟通知時瀏覽器會跳原生 prompt — 此時若 declined（`denied`），我仍 `setMuted(false)`，因為 toast 不需要瀏覽器權限。這樣按鈕會落到 `.notif-btn-on-partial`（橘色），title 提示「桌面通知被封鎖，僅顯示應用內提示」。把橘色和紫色分開可讓使用者一眼看出狀態差異而不需要 hover title。
- **denied 狀態的 alert**：用 `window.alert` 而非自訂 modal — 純 informational、頻率極低、保持 NotificationButton 自包含不依賴任何外部 modal/toast 系統。文案明確說明「toast 仍會顯示」避免使用者誤以為按下去什麼都不會發生。
- **不在這裡刪 `unsupported` 短路**：原本 `if (permission === 'unsupported') return null;` 隱藏整顆按鈕。新版我故意拿掉這個 guard — 即使瀏覽器無 `Notification` API，按鈕仍可控 in-app toast。`readPermission()` 在 unsupported 時回傳 `'unsupported'`，handleClick 內既不會走 `default` 分支也不會走 `denied`（兩個都 falsy 比對），直接落到 `setMuted(false)`，行為正確。
- `npm run build` 通過（649.3 KB JS / 42.78 KB CSS）。

## phase 8.7 — 離開群組功能 + 系統訊息

**Prompt**: 「請幫我新增離開群組的功能。離開後左側群組聊天室會自動消失 但是其他不影響其他還在群組的人 只會有某人離開群組的訊息跳出」。

**Location**:
- [src/services/chatroomService.js](src/services/chatroomService.js) — 新 export `leaveGroup(chatroomId, userId, displayName)`。用 `writeBatch`：(1) 在 `messages` subcollection 新增一筆 `type: SYSTEM` 訊息（content `${displayName} 已離開群組`，senderId 為離開者本人但不影響顯示），(2) 對 chatroom 文件 `members: arrayRemove(userId)` + 更新 `lastMessage` / `lastMessageAt`。Batch 確保「成員列表變動」與「系統訊息」同一個 snapshot 抵達其他成員，順序不會錯亂。新增 `arrayRemove`、`writeBatch`、`MESSAGE_TYPES` 至 import。
- [src/components/chat/MessageBubble.jsx](src/components/chat/MessageBubble.jsx) — 在 reactionEntries 計算之後、原本 `return (<div className="message-row" ...)` 之前加 early-return：`message.type === MESSAGE_TYPES.SYSTEM` 直接回傳 `<div className="message-system-row"><span className="message-system-text">{content}</span></div>`，跳過所有 avatar / sender / 反應 / menu / portal 邏輯。
- [src/components/chat/MessageBubble.css](src/components/chat/MessageBubble.css) — 新增 `.message-system-row`（flex center、margin 10/0、共用 `messageIn` 動畫）與 `.message-system-text`（灰底 pill：`bg-tertiary` + `border-radius: 999px` + 12px 字 + `text-muted` 顏色 + max-width 80%）。
- [src/components/chat/ChatroomInfoModal.jsx](src/components/chat/ChatroomInfoModal.jsx) — 加入 `handleLeave`：`window.confirm` → `setLeaving(true)` → `await leaveGroup(...)` → `onLeft?.(chatroom.id)` → `onClose?.()`，try/catch 把錯誤塞進原本的 `error` state 沿用既有 `.info-error` 渲染。底部新區塊 `.info-danger-zone` 內放 `🚪 離開群組` 按鈕，僅在 `isGroup && memberUids.includes(currentUser?.uid)` 時顯示。
- [src/components/chat/ChatroomInfoModal.css](src/components/chat/ChatroomInfoModal.css) — 新增 `.info-danger-zone`（top border 分隔）、`.info-leave-btn`（紅框透明底，hover 翻紅底白字，與既有 `.info-member-block-btn` 同設計語言）。
- [src/pages/ChatPage.jsx](src/pages/ChatPage.jsx) — 新 useEffect：`if (selectedChatroomId && !selectedChatroom) setSelectedChatroomId(null)`。當使用者離開後，`useChatrooms` snapshot 會把該 room 從 `chatrooms` 列表移除（query 是 `members array-contains uid`），`selectedChatroom` 變 null，effect 偵測到後把 `selectedChatroomId` 也歸零，ChatArea 退回到 welcome 畫面。
- [src/hooks/useNotification.js](src/hooks/useNotification.js) — 在 snapshot callback 裡加 `if (msg.type === MESSAGE_TYPES.SYSTEM) return;`，系統訊息不彈 toast / 不發 browser notification（聊天室內已經有居中提示，再彈一次太吵）。

**Refinement & Explanation**:
- **為何用 writeBatch 而非兩次 await**：兩次 await 在中途斷網會留下「成員已移除但無系統訊息」或「有系統訊息但成員還在」的不一致狀態。writeBatch 是 server-side atomic（要嘛兩個都成功要嘛兩個都失敗），加上 SDK 的 local cache 也是原子套用，本機與遠端 snapshot 順序都對齊。
- **system message 用 senderId = 離開者本人**：照理說系統訊息 senderId 應該為 null / 'system'，但這樣的話 `useNotification` 內 `if (msg.senderId === currentUserId) return;` 對其他成員會 noop（msg.senderId 不是 currentUserId），仍會走到 SYSTEM 過濾線。對離開的人本人雖然 senderId === currentUserId 會在第一條跳過，但他根本已經不在 chatroom 的 members 中、`useNotification` 也不會訂閱這個 room 了，雙重保險。
- **不走 `sendMessage` API 的原因**：`sendMessage` 內含 unread fanout（對非 sender 的每個 member `increment(1)`）。離開群組這種 housekeeping 訊息不該把所有人的未讀數 +1（badge 跳一下又被「點開來看」歸零，純粹噪音）。直接 `batch.set(messageDoc, payload)` 跳過 fanout。
- **不更新 `unreadCounts.${userId}` 為 0**：離開後 user 的 unread 計數變成「孤兒欄位」（user 不再 in members，query 也不會回傳該 room），harmless。要清理需要 `deleteField()` 但不值得多一次 read / 寫；將來若被同個人再次邀請進群，原欄位若還在會直接顯示舊未讀數，到時候再補一個 reset 即可。
- **MessageBubble early return 寫在 reactionEntries 之後**：reactionEntries / canShowMenu / canEdit / canReact 對 SYSTEM 訊息都用不到但無 side effect、計算成本可忽略。把 early return 寫在最後反而避免「`renderContent` / 中段邏輯有改動時忘了同步系統訊息分支」的維護風險 — 系統訊息渲染與正常訊息完全解耦。
- **selectedChatroomId 清空時機**：早可以在 `handleLeave` 內 `await leaveGroup → setSelectedChatroomId(null)` 直接做，但用 ChatPage 的 useEffect 偵測「selected room 從 list 消失」更通用 — 將來加「踢出群組」「房主解散」「網路同步移除」都自動處理，不必每個 caller 各自記得清。
- **`setSelectedChatroomId(null)` 不會在初始載入誤觸**：useState 預設 null，只有使用者點擊 `ChatroomItem` 才會 set，而 click 來自渲染中的 list → 表示 chatrooms 已有資料、selectedChatroom 必定能 find 到。effect 的 `selectedChatroomId && !selectedChatroom` 條件不會在初始 mount race。
- **「不影響其他成員」的隱含保證**：`arrayRemove(userId)` 只動 members 陣列裡離開者那一格，其他 uid 不受影響；其他成員的 `useChatrooms` query (`array-contains their_uid`) 仍然命中，他們繼續看到群組，只是看到一筆「X 已離開群組」灰色 pill 訊息。其他人的 `unreadCounts.<their_uid>` 不變動（因為 `leaveGroup` 沒走 unread fanout），sidebar 不會錯誤地跳未讀紅點。
- **未做 / 已知限制**：(1) 沒做「群組變空（最後一人離開）就刪掉 chatroom 文件」的 GC — 留一個只剩 0 人 / 留下歷史訊息的孤兒 room 文件，不會出現在任何人的列表，但 Firestore 永久存放。(2) 沒做「房主轉移」— `chatroom.createdBy` 仍指向原始建立者即使他離開了；目前沒有「房主」實質權限所以可接受。(3) 私聊（type=private）目前沒有「離開」的概念（兩人聊天，一人離開等同刪除對話 → 與 block 語意衝突），所以 leave 按鈕只在 group 顯示。
- `npm run build` 通過（651.8 KB JS / 43.57 KB CSS）。

## phase 8.8 — CSS 動畫（splash + brand shimmer + 浮動 + badge pulse）

**Prompt**: 「Use CSS animation (2%) – Button hover is not an animation! 幫我在點開啟此 chatroom 一開始 幫我加入 logo 的動畫載入動畫 並且在其他適合的地方幫我加入好看的動畫特效 2D 3D 皆可」。

**Location**:
- [src/components/common/SplashScreen.jsx](src/components/common/SplashScreen.jsx) — 新檔。Mounts in App，2 段 setTimeout 控制生命週期：1600ms 後切 `is-leaving` class 觸發淡出、2100ms 後 `setDone(true)` 真正 unmount（節省 z-index: 9999 的常駐元件）。回傳結構：背景容器 + `splash-stage`（logo + 標題 + tagline）。
- [src/components/common/SplashScreen.css](src/components/common/SplashScreen.css) — 新檔。背景用兩層 `radial-gradient` + `var(--bg-primary)` 疊出有深度感的紫藍霓虹底；container 設 `perspective: 1200px` 讓子元素的 `rotateY` 有真正的 3D 透視。動畫共 6 條：(1) `splashLogoEntrance`（fade + 從上墜落 + scale 0.4→1，cubic-bezier 收尾）、(2) `splashLogoSpin`（**3D `rotateY -540°→0`**，1.5 圈翻轉，搭配 `rotateZ -25°→0` 微傾斜增加趣味）、(3) `splashLogoFloat`（持續上下 ±8px 浮動，動畫起點 delay 1.6s 與入場接力）、(4) `splashGlowPulse`（logo 後方 radial-gradient 光暈 scale + opacity 呼吸）、(5) `splashTitleIn`（標題 fade-up 14px，0.7s delay 等 logo 翻完）、(6) `splashShimmer`（標題 gradient text 用 `background-position 0% → -200%` 製造從左掃到右的「光澤掃過」效果，size 200% 拉成兩倍寬讓位置可動）、(7) `splashTaglineIn`（tagline letter-spacing 從 0.05em 撐到 0.18em，營造「文字展開」的細節）。整層 splash 本身有 `.is-leaving` 觸發 `opacity 1→0 + scale 1→1.04` 的淡出+微推遠效果。
- [src/App.jsx](src/App.jsx) — `<SplashScreen />` 放在 `<UsersProvider>` 內 `<AppRoutes />` 旁邊（兄弟而非 wrap）。原因：splash 用 `position: fixed; z-index: 9999` 蓋滿全屏，所以 unmount 時內部 routes / context 完全不受影響，AuthProvider 的 loading state 也照常 render — splash 純粹是視覺「片頭」不會 block 任何 data fetching。
- [src/pages/auth.css](src/pages/auth.css) — `.auth-brand h1` 從原本固定的 `var(--accent-gradient)` 換成 5-stop 的 `linear-gradient` + `background-size: 200% auto`，新增 `brandShimmer` keyframe，跟 splash 同套「位置動」shimmer 公式。Login / Register 兩頁都吃同一條規則。
- [src/components/chat/ChatArea.css](src/components/chat/ChatArea.css) — `.chat-area-welcome`（外層）加 `welcomeFloat` 5s 上下浮動 ±6px；`.chat-area-welcome h2`（標題）加 `welcomeShimmer` 4s gradient 掃光。兩條動畫疊在父子兩層元素上互不干擾。
- [src/components/sidebar/ChatroomItem.css](src/components/sidebar/ChatroomItem.css) — `.chatroom-item-unread-badge` 加 `unreadBadgePulse` 2.2s：`box-shadow` 用「ring 擴散」公式（一條固定的紫色暈 + 一條從 0px 0.55 alpha 擴張到 6px 0 alpha 的「波紋」），同時 `transform: scale(1 → 1.06)` 讓徽章本體輕跳。仿 iOS / Slack 的呼吸 badge。

**Refinement & Explanation**:
- **為何 splash 用「假計時器」而不是等 auth 就緒**：AuthProvider 的 `loading` 通常 < 100ms 就 resolve（Firebase Auth 從 IndexedDB 讀 token 很快），如果用真資料 ready 為條件，splash 會閃過幾乎看不到。給它固定 1.6s 顯示時間，讓使用者真的能看到品牌動畫；副作用是進入應用會多 1.6s 等待 — 對 first impression 加分，對日常使用無感（PWA cache 後再開仍會看，但動畫本身 < 2s 不算長）。
- **3D 翻轉的關鍵 — `perspective` 必須在祖先元素**：CSS 3D transform 沒 perspective 就只是 2D 投影（`rotateY 360°` 看起來只是「壓扁→恢復」）。在 `.splash` 容器設 `perspective: 1200px`，搭配 `.splash-stage` 與 `.splash-logo-wrap` 的 `transform-style: preserve-3d`，logo 的 `rotateY` 才會真的看到「離我們近的那一面變大」的透視變化。1200px 是經驗值（值越小透視越誇張，越大越平），96px 的 logo 配 1200px 觀感剛好。
- **`-540deg` 而不是 `-360deg`**：360 度只轉一圈、視覺上中段會有一瞬「正面消失只看到側邊一條線」的尷尬；540 度（1.5 圈）讓觀眾感覺翻得更暢快，且結尾時 logo 從「翻完」自然停在 0 度正面，動量符合直覺。
- **`splashLogoFloat` 用 `delay 1.6s` 接力**：入場動畫（entrance + spin）跑 1.6s 結束後，float 動畫才開始。如果一開始就同步跑，translateY 會跟 entrance 的 translateY 衝突疊加成奇怪軌跡。delay 1.6s 等入場完成才接手浮動，再 4s loop 一次，看起來像「降落 → 開始呼吸」的連續敘事。
- **shimmer 為何用 `background-position` 而不是 `background-image: linear-gradient(...)` 動畫值**：CSS animation 對 `background-image` 的 keyframe 不會 interpolate（瀏覽器只會在中間瞬間切換），但對 `background-position` 是線性插值。所以做法固定：(1) 把 gradient 寫成 5 stops（重複頭尾色製造「無縫接龍」可循環）、(2) `background-size: 200%` 拉到兩倍寬讓視窗外有預備的 gradient 段、(3) animation 把 `background-position` 從 0% 推到 -200%（推剛好兩倍 size 距離 → 一個完整循環不會有跳幀）。
- **三段 shimmer（splash / auth / welcome）共用公式但各 keyframe 獨立**：本來想抽成 global 的 `@keyframes brandShimmer`，但 CSS 檔案 import 順序若改變、或之後想拆 chunk，跨檔 keyframe 引用容易踩雷。同公式重複寫三次成本極低（< 30 bytes / 條），換來各檔自包不依賴外部，是值得的 trade-off。
- **`unreadBadgePulse` 用雙層 `box-shadow` 而非 `::after` ring**：`::after` 的 ring 動畫需要額外定位、對 `position: relative` 有要求，且會干擾既有 flex layout。雙層 `box-shadow`（第一層固定暈 + 第二層動畫 ring）是純樣式不影響 box model，spread radius 從 0 → 6px + alpha 從 0.55 → 0，視覺等效且零佈局成本。
- **`welcomeFloat` 與 `welcomeShimmer` 拆兩層元素**：父元素（`.chat-area-welcome`）動 `translateY`、子元素（`h2`）動 `background-position`。如果寫在同一層、同 element 兩條 animation 同時動 transform 與 background 沒問題，但如果未來想加 `gradient text + 浮動 + scale hover`，分層天然支援；現在拆好之後不用回頭改結構。
- **prefers-reduced-motion**：splash CSS 內已加 `@media (prefers-reduced-motion: reduce)` 把所有 splash 動畫壓到 0.01ms + iteration-count 1（無限動畫變成跑一次就停）。其他動畫（brand shimmer / welcome float / badge pulse）走的是全域 `*` 規則（在 `src/index.css` phase 8 已加），自動降速到 0.01ms；對前庭敏感使用者整套動畫只會閃一下不會持續搖晃。
- **CSS 體積**：43.6 → 46.9 KB（gzip 7.27 → 8.06），splash CSS 自帶 ~3.3 KB（含 7 條 keyframe + radial-gradient 背景），其餘 shimmer / pulse / float 加總 < 0.5 KB。
- `npm run build` 通過（652.5 KB JS / 46.91 KB CSS）。
