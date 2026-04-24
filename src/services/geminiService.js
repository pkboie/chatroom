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
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API 回傳 ${res.status}：${detail.slice(0, 200)}`);
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
