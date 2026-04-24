const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_INSTRUCTION =
  '你是一個友善、簡潔的聊天助手。回答請使用繁體中文，除非使用者明確用其他語言提問。回答長度適中，避免過度冗長。';

export function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

export async function chatWithGemini(userMessage, history = []) {
  if (!GEMINI_API_KEY) {
    throw new Error('尚未設定 Gemini API Key');
  }

  const contents = [
    ...history.map((m) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let apiMessage = '';
    try {
      apiMessage = JSON.parse(raw)?.error?.message || '';
    } catch {
      apiMessage = raw.slice(0, 200);
    }
    if (res.status === 429) {
      throw new Error('Gemini 免費額度已用完，請稍後再試或到 Google AI Studio 檢查用量');
    }
    if (res.status === 400 && /API key/i.test(apiMessage)) {
      throw new Error('Gemini API Key 無效，請檢查 .env 中的 VITE_GEMINI_API_KEY');
    }
    if (res.status === 403) {
      throw new Error('Gemini API Key 權限不足或未啟用 Generative Language API');
    }
    throw new Error(`Gemini 錯誤（${res.status}）：${apiMessage || '未知錯誤'}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error('回應被安全過濾器擋下，請換個問法');
    }
    throw new Error('Gemini 未回傳內容');
  }
  return text;
}
