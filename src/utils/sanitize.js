// React 的 {value} 文字渲染本身就會以 text node 輸出（不會解析成 HTML），
// 所以 <script> 之類的內容只會「顯示為文字」、不會執行。
// 為了讓「輸入什麼就顯示什麼」（包含 <、>、<script>、<h1> 等），
// 此處保持原文不動，不做 HTML escape，也不剝除標籤。
export const sanitizeInput = (input) => input;
