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