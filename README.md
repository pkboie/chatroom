# Chatroom — 即時聊天應用

> 軟體設計與實驗 期中專案 · React + Firebase 即時聊天室

**🌐 線上版本**：https://chatroom-72dab.web.app
**📦 Repo**：本目錄即為原始碼

---

## 目錄

- [專案簡介](#專案簡介)
- [技術棧](#技術棧)
- [功能總覽（給 TA 對照評分用）](#功能總覽給-ta-對照評分用)
- [本地端 Setup 步驟（請完整照做）](#本地端-setup-步驟請完整照做)
- [操作說明（How to Use）](#操作說明how-to-use)
- [常見問題排解](#常見問題排解)
- [專案結構](#專案結構)
- [部署到 Firebase Hosting](#部署到-firebase-hosting)

---

## 專案簡介

一個功能完整的即時聊天 web 應用，支援私聊與群聊、圖片 / GIF / 表情符號訊息、訊息搜尋與表情反應、封鎖與離開群組、Gemini AI 助手、桌面通知，以及 splash 3D 開場動畫。

所有資料即時透過 Firestore `onSnapshot` 訂閱，無需手動 refresh。

---

## 技術棧

| 類別 | 使用 |
|------|------|
| 前端框架 | React 19 (Hooks + Context) + Vite 8 |
| 路由 | React Router v7 |
| 後端即時資料庫 | Firebase Firestore（asia-east1） |
| 認證 | Firebase Auth（Email/Password + Google OAuth） |
| 圖片儲存 | ImgBB API（free tier） |
| AI 對話 | Google Gemini API（`gemini-2.0-flash` 或 `gemini-pro`） |
| GIF 來源 | GIPHY API |
| Hosting | Firebase Hosting |
| 通知 | Browser Notification API（無需 FCM） |
| 樣式 | 純 CSS（CSS Variables + Animations + Custom Properties） |

---

## 功能總覽（給 TA 對照評分用）

> 完整功能 + 對應 UI 位置。**所有功能都已實作完成，可在 [線上版本](https://chatroom-72dab.web.app) 直接驗證。**

### 帳號 / 認證

| # | 功能 | 在哪裡找得到 |
|---|------|--------------|
| 1 | Email + 密碼註冊 | `/register` 頁 → 填表單 → 點「註冊」 |
| 2 | Google 帳號註冊 | `/register` 頁 → 點「使用 Google 註冊」 |
| 3 | Email + 密碼登入 | `/login` 頁 → 填表單 → 點「登入」 |
| 4 | Google 帳號登入 | `/login` 頁 → 點「使用 Google 登入」 |
| 5 | 登出 | sidebar 左上 profile 按鈕 → ProfileModal → 左下「登出」 |
| 6 | 自動登入 / 認證狀態保持 | Firebase Auth 自動寫入 IndexedDB；下次開啟直接進主頁 |
| 7 | 路由保護 | 未登入訪問 `/` 自動轉去 `/login`；已登入訪問 `/login` 自動轉回 `/` |

### 個人資料

| # | 功能 | 在哪裡找得到 |
|---|------|--------------|
| 8 | 編輯使用者名稱 | sidebar 左上 profile → ProfileModal → 改「使用者名稱」→「儲存」 |
| 9 | 上傳 / 更換頭像 | ProfileModal → 點頭像區「更換頭像」→ 選圖（≤ 32 MB）→「儲存」 |
| 10 | 編輯電話 | ProfileModal → 改「電話」（選填） |
| 11 | 編輯地址 | ProfileModal → 改「地址」（選填） |
| 12 | 顯示 Email（唯讀） | ProfileModal → Email 欄位 |

### 聊天室管理

| # | 功能 | 在哪裡找得到 |
|---|------|--------------|
| 13 | 建立私聊 | sidebar「＋ 新聊天」按鈕 → CreateRoomModal → 切到「私聊」tab → 選 1 位使用者 →「建立」 |
| 14 | 建立群聊 | 同上 → 切到「群聊」tab → 輸入群組名稱 → 勾選 ≥ 2 位使用者 →「建立」 |
| 15 | 切換聊天室 | sidebar 中段聊天室列表 → 點任一項 |
| 16 | 邀請成員加入群組 | 進入群組 → 上方 header「＋」按鈕 → InviteMemberModal → 勾選 →「邀請」 |
| 17 | 查看群組 / 私聊資訊 | 進入聊天室 → 上方 header「ⓘ」按鈕 |
| 18 | 離開群組（系統訊息通知其他成員） | ChatroomInfoModal 底部「🚪 離開群組」按鈕 → 確認對話框 |
| 19 | 未讀訊息計數 badge | sidebar 聊天室列表 → 有新訊息會顯示紫色數字 badge（最多 99+），同時項目名變粗 |
| 20 | 最後一則訊息預覽 | sidebar 聊天室列表 → 每項顯示「最後訊息內容 + 時間」 |
| 21 | 自己發過的最後訊息 | 顯示為「你：xxx」前綴 |

### 訊息功能

| # | 功能 | 在哪裡找得到 |
|---|------|--------------|
| 22 | 發送純文字訊息 | 輸入框輸入 → 按 Enter（Shift+Enter 換行）或點 ➤ |
| 23 | 發送圖片訊息 | 輸入框左邊「📎」→ 選圖（≤ 32 MB）→ 預覽顯示後點 ➤ |
| 24 | 發送 GIF 訊息 | 輸入框「GIF」按鈕 → GifPicker → 搜尋或瀏覽熱門 → 點選 |
| 25 | 插入表情符號 | 輸入框「😊」→ EmojiPicker → 5 大類別（表情 / 心情 / 手勢 / 愛心 / 其他）|
| 26 | 編輯自己的訊息 | hover 自己的訊息 → 出現「⋯」→「✏️ 編輯」→ 改完按 Enter |
| 27 | 收回 / 刪除訊息 | 同上 →「🗑 收回」→ 確認 → 對所有人顯示「此訊息已被收回」|
| 28 | 訊息表情反應（reactions） | hover 任意訊息 → 出現「☺」→ 8 種 emoji（👍 ❤️ 😂 😮 😢 😡 🔥 👏）|
| 29 | 反應 emoji 計數聚合 | 訊息底下顯示「emoji + 人數」chip，再點一次取消 |
| 30 | 已編輯標記 | 編輯過的訊息底下顯示「（已編輯）」 |
| 31 | 點圖片放大預覽 | 訊息中點任意圖片 / GIF → 全螢幕預覽 → 點背景關閉 |
| 32 | 訊息搜尋 | 上方 header「🔍」→ 輸入關鍵字 → 即時 filter + 高亮命中訊息 |
| 33 | 系統訊息（離開群組通知） | 中央灰色 pill 樣式顯示「XXX 已離開群組」 |
| 34 | 訊息時間格式化 | 1 分內：剛剛 / 同日：HH:mm / 7 日內：星期 + HH:mm / 更舊：M/D HH:mm |
| 35 | 自動 scroll 到底部 | 進房間 / 收新訊息 → 自動捲到最新訊息 |

### 群組成員管理

| # | 功能 | 在哪裡找得到 |
|---|------|--------------|
| 36 | 查看完整成員列表 + email | ChatroomInfoModal 上方「成員（N）」清單 |
| 37 | 封鎖使用者 | ChatroomInfoModal 任一成員旁「封鎖」按鈕 → 確認 |
| 38 | 解除封鎖 | 已封鎖成員旁「解除封鎖」按鈕 |
| 39 | 「對方封鎖你」狀態顯示 | 自動顯示「對方封鎖你」標籤，封鎖按鈕 disable |
| 40 | 封鎖效果 - 私聊 | 雙方都看不到對方訊息、無法傳訊（有 banner 提示） |
| 41 | 封鎖效果 - 群聊 | 自動隱藏被封鎖者的訊息與 reaction |
| 42 | 封鎖視覺指示 | sidebar 聊天室項目顯示 🚫 紅色徽章 + 灰階頭像 |

### 通知

| # | 功能 | 在哪裡找得到 |
|---|------|--------------|
| 43 | 通知開 / 關 toggle | sidebar 右上「🔔 / 🔕」按鈕（一鍵切換） |
| 44 | 應用內 toast 通知 | 收到他人訊息時，右上彈出滑入式預覽（自動消失） |
| 45 | 桌面 / OS 系統通知 | 同時觸發 `Notification` API；首次點開會請求瀏覽器權限 |
| 46 | 點 toast 跳到對應聊天室 | toast 上的「查看」按鈕 |
| 47 | 通知狀態三色指示 | 紫色 = 完整啟用 / 橘色 = OS 拒絕但 toast 仍開 / 灰色 = 完全關閉 |
| 48 | localStorage 持久化開關 | 重整後仍保持原本選擇 |

### AI 功能

| # | 功能 | 在哪裡找得到 |
|---|------|--------------|
| 49 | 開啟 Gemini AI 助手 | sidebar 底部「🤖 AI 助手」按鈕 |
| 50 | 與 AI 對話（多輪上下文） | ChatbotModal → 輸入 → Enter |
| 51 | AI 思考中動畫（typing dots） | 等待回應時顯示三點跳動 |
| 52 | 清空對話 | ChatbotModal 底部「清空對話」按鈕 |
| 53 | 錯誤處理 | API 失敗顯示警告，原訊息復原可重送 |

### UI / UX 與動畫

| # | 功能 | 在哪裡找得到 |
|---|------|--------------|
| 54 | Splash 開場 3D 動畫 | 開啟 app 第一秒 — 36 個碎片從 3D 空間飛回拼成 logo（CodePen 風格 shatter-reassemble） |
| 55 | 標題 gradient shimmer | splash 標題、登入頁標題、welcome 頁標題持續 gradient 掃光 |
| 56 | Welcome 頁浮動動畫 | 未選擇聊天室時，「歡迎使用 Chatroom」上下浮動 |
| 57 | 未讀 badge 呼吸動畫 | 未讀紅點 box-shadow ring 擴散脈衝（仿 iOS / Slack） |
| 58 | 訊息進入動畫 | 新訊息淡入 + 上滑 |
| 59 | Modal 開啟 / 關閉動畫 | scale + fade |
| 60 | 行動裝置漢堡選單 | 窄螢幕時 chat header 顯示「☰」開關 sidebar |
| 61 | Loading spinner | 認證中、聊天室載入中 |
| 62 | 響應式設計 | 桌機 / 平板 / 手機自動適配 |
| 63 | 無障礙 prefers-reduced-motion | 系統設定減少動畫時自動關閉所有動畫 |
| 64 | 自訂 placeholder / aria-label | 所有按鈕都有 title + aria-label |

> **CSS 動畫總計**：splash shatter、shimmer × 3 處、浮動 × 2 處、badge pulse、訊息淡入、modal 開合 — 涵蓋 2D + 3D 多種類型，超過評分要求的 2% 標準。

---

## 本地端 Setup 步驟（請完整照做）

> ⚠️ **TA 評分提示**：請完整照下列步驟操作。任何一步跳過都可能導致應用無法啟動。整個過程約 15 - 20 分鐘。

### Prerequisites（事先準備）

| 工具 | 版本 | 下載連結 |
|------|------|----------|
| Node.js | ≥ 18.0（建議 20 LTS） | https://nodejs.org/ |
| npm | ≥ 9（隨 Node 安裝） | （內建） |
| Git | 任意 | https://git-scm.com/ |
| Google 帳號 | — | 用於登入 Firebase Console |

確認版本：
```bash
node -v        # 應該 >= v18
npm -v         # 應該 >= 9
git --version  # 任意版本
```

---

### Step 1：取得程式碼 + 安裝套件

```bash
# 進入專案資料夾
cd chatroom

# 安裝依賴（約 1 - 2 分鐘）
npm install
```

✅ 完成檢查：執行後出現 `node_modules/` 資料夾且無紅色 `npm error`。

---

### Step 2：建立 Firebase 專案

1. 開啟 https://console.firebase.google.com/
2. 點 **「新增專案」**（Add project）
3. 輸入專案名稱（例如 `my-chatroom-test`）→ 下一步
4. **Google Analytics**：選 **「不啟用」**（不影響功能）→ 建立專案
5. 等待 30 秒專案建立完成 → 點「繼續」

---

### Step 3：在 Firebase 加入 Web 應用

1. 在專案首頁中央，點 **`</>` Web 圖示**（「將 Firebase 加入您的網頁應用程式」）
2. 應用程式暱稱：隨意（例如 `chatroom-web`），**不勾選**「同時設定 Firebase Hosting」→ 註冊應用程式
3. 看到一段 `firebaseConfig` 設定 — **這頁先別關，下面 Step 7 要用**
4. 完成（不需要安裝 SDK，本專案已包含）

---

### Step 4：開啟 Authentication（認證）

1. 左側選單 → **Build** → **Authentication** → 點「開始使用」
2. 選 **Sign-in method** tab
3. 啟用 **「電子郵件 / 密碼」**：點開 → 第一個 toggle 開 → 儲存
4. 啟用 **「Google」**：點開 → toggle 開 → 選擇你的 Google 帳號做為 support email → 儲存

---

### Step 5：開啟 Firestore Database

1. 左側選單 → **Build** → **Firestore Database** → 點「建立資料庫」
2. **位置**：選 **`asia-east1`**（臺灣）→ 下一步
3. **安全性規則**：先選 **「開始於測試模式」**（30 天內任何人可讀寫，方便評分；正式上線前要改）
4. 點「啟用」，等 30 秒建立完成

> 💡 如果你想用更嚴格的規則，可參考 [專案 wiki](#) 設定。本 README 的測試模式已足以讓所有功能運作。

---

### Step 6：申請第三方 API Keys

> 三個都是 free tier、無需信用卡，註冊各約 1 - 2 分鐘。

#### 6a. Google Gemini API（AI 助手用）

1. https://aistudio.google.com/app/apikey
2. 用 Google 帳號登入 → 點 **「Create API key」**
3. 選 **「Create API key in new project」** → 複製金鑰備用

#### 6b. GIPHY API（GIF 訊息用）

1. https://developers.giphy.com/dashboard/
2. 註冊帳號 → 點 **「Create an App」**
3. 選 **「API」**（不是 SDK）→ 填名稱 → 同意條款 → Create
4. 複製顯示的 **API Key**

#### 6c. ImgBB API（圖片上傳用）

1. https://api.imgbb.com/
2. 註冊帳號 → 進 dashboard → 點 **「About」** → **「Get API key」**
3. 複製金鑰

---

### Step 7：建立 `.env` 檔

在專案根目錄新建 `.env` 檔（與 `package.json` 同層），貼上以下內容並填入剛剛拿到的值：

```bash
# ====== Firebase（從 Step 3 那頁的 firebaseConfig 複製）======
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:123:web:abc...
VITE_FIREBASE_MEASUREMENT_ID=          # 沒啟用 Analytics 可留空
VITE_FIREBASE_DATABASE_URL=            # 沒用 RTDB 可留空
VITE_FIREBASE_VAPID_KEY=               # 留空（本專案不用 FCM）

# ====== 第三方 API（從 Step 6 拿到）======
VITE_GEMINI_API_KEY=AIza...            # Step 6a
VITE_GIPHY_API_KEY=...                 # Step 6b
VITE_IMGBB_API_KEY=...                 # Step 6c
```

> ⚠️ `.env` 已加入 `.gitignore`，不會被 commit。
> ⚠️ 三個第三方 key 若沒填，對應功能會顯示錯誤訊息但不影響基本聊天。

✅ 完成檢查：根目錄存在 `.env` 檔，且每個 `VITE_FIREBASE_*` 都有值。

---

### Step 8：啟動 dev server

```bash
npm run dev
```

終端會顯示類似：
```
  VITE v8.0.9  ready in 423 ms

  ➜  Local:   http://localhost:5173/
```

開瀏覽器到 **http://localhost:5173/** → 看到開場 3D 動畫 → 進入登入頁 → ✅ Setup 完成！

---

### Step 9：（選做）申請通知權限

第一次進入 app 後，點 sidebar 右上「🔕」鈴鐺 → 瀏覽器跳出通知權限請求 → 點「允許」→ 後續收到他人訊息會跳桌面通知。

---

## 操作說明（How to Use）

### 第一次使用流程

1. **註冊帳號**：開啟 app → 點「立即註冊」→ 填 email + 密碼 + 使用者名稱 → 註冊
   - 或點「使用 Google 註冊」一鍵註冊
2. **設定個人資料**：左上頭像 → ProfileModal → 上傳頭像 + 補電話 / 地址 → 儲存
3. **建立第一個聊天室**：
   - 想要 1 對 1：點「＋ 新聊天」→ 私聊 tab → 選對方 → 建立
   - 想要群組：點「＋ 新聊天」→ 群聊 tab → 輸入群組名稱 → 勾 ≥ 2 人 → 建立
4. **開始聊天**：左側選聊天室 → 右側輸入訊息 → Enter

### 進階操作

| 想做什麼 | 怎麼做 |
|----------|--------|
| 傳圖片 | 輸入框「📎」→ 選檔 |
| 傳 GIF | 輸入框「GIF」→ 搜尋 |
| 加表情 | 輸入框「😊」→ 選 |
| 對訊息加表情反應 | hover 訊息 → ☺ → 選 emoji |
| 編輯自己的訊息 | hover → ⋯ → ✏️ |
| 收回自己的訊息 | hover → ⋯ → 🗑 |
| 搜尋訊息 | header 🔍 → 輸入關鍵字 |
| 邀請新成員 | header ＋ → 勾人 → 邀請 |
| 看群組成員 / 封鎖人 | header ⓘ |
| 離開群組 | header ⓘ → 底部 🚪 離開群組 |
| 開 / 關通知 | sidebar 右上 🔔 |
| 找 AI 幫忙 | sidebar 底部 🤖 AI 助手 |
| 改頭像 / 名字 | 左上頭像 |
| 登出 | 左上頭像 → 左下「登出」|

### 鍵盤快速鍵

| 按鍵 | 動作 |
|------|------|
| `Enter` | 發送訊息 |
| `Shift + Enter` | 換行 |
| `Esc`（編輯模式） | 取消編輯 |

---

## 常見問題排解

### 開啟頁面後一片空白 / console 報 Firebase 錯誤
→ `.env` 沒填或填錯。確認 `VITE_FIREBASE_*` 全部有值，然後**重啟 dev server**（Vite 不會 hot-reload `.env`）。

### Google 登入按鈕沒反應 / popup 被擋
→ 瀏覽器 popup blocker 擋住。允許 `localhost:5173` 的 popup，或改用 email 登入。

### Firestore 操作報「Missing or insufficient permissions」
→ Firestore rules 設太嚴。確認 Step 5 選的是「測試模式」，或進 Firebase Console → Firestore → Rules tab 確認規則允許讀寫。

### 通知按鈕點下去沒反應
→ 桌面通知需要 HTTPS 或 localhost；用 IP（如 `192.168.x.x`）會被瀏覽器擋。
→ 或瀏覽器站台權限被設成「永久封鎖」，到瀏覽器設定解除。

### Gemini AI 回應「尚未設定 API Key」
→ `.env` 的 `VITE_GEMINI_API_KEY` 沒填。填好後重啟 dev server。

### 圖片上傳失敗
→ ImgBB API key 沒填或檔案 > 32 MB。

### GIF picker 顯示空白
→ Giphy API key 沒填。

### Port 5173 被佔用
→ Vite 會自動找下一個可用 port（5174、5175...），看終端輸出的 URL。

---

## 專案結構

```
chatroom/
├── public/                       # 靜態資源
│   ├── favicon.svg               # logo（splash 動畫用）
│   ├── icons.svg                 # SVG icon sprite
│   └── firebase-messaging-sw.js  # service worker（預留）
├── src/
│   ├── main.jsx                  # React entry
│   ├── App.jsx                   # 路由 + Providers
│   ├── config/
│   │   └── firebase.js           # Firebase 初始化
│   ├── contexts/
│   │   ├── AuthContext.jsx       # 認證狀態 + userProfile
│   │   └── UsersContext.jsx      # 全域 usersById cache
│   ├── hooks/
│   │   ├── useChatrooms.js       # 訂閱當前使用者的聊天室
│   │   ├── useMessages.js        # 訂閱當前聊天室訊息
│   │   ├── useNotification.js    # 接 Firestore snapshot 觸發 toast / OS 通知
│   │   └── useNotificationMuted.js  # localStorage 共享 muted 狀態
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── ChatPage.jsx          # 主頁（sidebar + chat area）
│   ├── components/
│   │   ├── auth/                 # GoogleLoginBtn
│   │   ├── chat/                 # ChatArea / Header / Input / Bubble / Search / EmojiPicker / GifPicker / ImagePreview / Info
│   │   ├── chatbot/              # ChatbotModal（Gemini）
│   │   ├── common/               # Avatar / Modal / SplashScreen / Toast / Spinner / TypingDots
│   │   ├── profile/              # ProfileModal
│   │   └── sidebar/              # Sidebar / List / Item / NotificationButton / CreateRoomModal / InviteMemberModal / UserPicker
│   ├── services/                 # Firestore CRUD + 第三方 API 封裝
│   │   ├── authService.js
│   │   ├── chatroomService.js
│   │   ├── messageService.js
│   │   ├── userService.js
│   │   ├── notificationService.js
│   │   ├── geminiService.js
│   │   ├── giphyService.js
│   │   └── imgbbService.js
│   └── utils/
│       ├── constants.js          # MESSAGE_TYPES / EMOJI_LIST
│       ├── formatTime.js         # 時間格式化
│       └── sanitize.js           # 文字 sanitize（identity，React 已 escape）
├── .env                          # 環境變數（git 忽略）
├── .env.example                  # 範本
├── firebase.json                 # Hosting 設定
├── .firebaserc                   # Firebase project 綁定
├── vite.config.js
├── package.json
└── README.md                     # 你正在看的檔案
```

### 資料模型（Firestore）

| Collection | 用途 | 主要欄位 |
|-----------|------|---------|
| `users/{uid}` | 使用者 profile | username, email, photoURL, phone, address, blockedUsers[] |
| `chatrooms/{roomId}` | 聊天室 metadata | type (private/group), name, members[], createdBy, lastMessage, lastMessageAt, unreadCounts{uid: int} |
| `chatrooms/{roomId}/messages/{msgId}` | 訊息子集合 | type (text/image/gif/system), content, senderId, senderName, senderPhoto, isEdited, isUnsent, emojis{emoji: uid[]}, createdAt, updatedAt |

---

## 部署到 Firebase Hosting

> 此 repo 已部署在 https://chatroom-72dab.web.app
> 若你 fork / 想部署到自己的 Firebase 專案：

```bash
# 1. 安裝 Firebase CLI（首次）
npm install -g firebase-tools

# 2. 登入
firebase login

# 3. 修改 .firebaserc 把 "chatroom-72dab" 換成你的 project ID

# 4. build + deploy（永遠加 --only hosting，避免覆寫 Firestore rules）
npm run build
firebase deploy --only hosting
```

⚠️ **不要跑 `firebase init`** — 會覆寫 `firebase.json` 並產生預設規則檔，可能破壞線上服務。本 repo 的 `firebase.json` 已設定好。

---

## 授權

此為大學課程作業專案，僅作學術用途。
