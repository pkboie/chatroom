import { useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import TypingDots from '../common/TypingDots';
import { chatWithGemini, isGeminiConfigured } from '../../services/geminiService';
import { sanitizeInput } from '../../utils/sanitize';
import './ChatbotModal.css';

const WELCOME = {
  role: 'ai',
  text: '你好！我是 Gemini AI 助手。有什麼我可以幫你的嗎？',
};

function ChatbotModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!isGeminiConfigured()) {
      setError('尚未設定 Gemini API Key，請檢查 .env');
      return;
    }
    const clean = sanitizeInput(text);
    const history = messages.filter((m) => m !== WELCOME);
    setMessages((prev) => [...prev, { role: 'user', text: clean }]);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const reply = await chatWithGemini(clean, history);
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setError(err.message || '發送失敗');
      setMessages((prev) => prev.slice(0, -1));
      setInput(clean);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([WELCOME]);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🤖 Gemini AI 助手"
      size="lg"
      footer={
        <button type="button" className="chatbot-clear-btn" onClick={handleClear}>
          清空對話
        </button>
      }
    >
      <div className="chatbot-body">
        <div className="chatbot-messages" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chatbot-msg-row ${m.role === 'user' ? 'is-user' : 'is-ai'}`}>
              <div className="chatbot-msg-avatar" aria-hidden>
                {m.role === 'user' ? '🙂' : '🤖'}
              </div>
              <div className="chatbot-msg-bubble">
                <p className="chatbot-msg-text">{m.text}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="chatbot-msg-row is-ai">
              <div className="chatbot-msg-avatar" aria-hidden>🤖</div>
              <div className="chatbot-msg-bubble">
                <TypingDots label="AI 思考中" />
              </div>
            </div>
          )}
          {error && <p className="chatbot-error">⚠️ {error}</p>}
        </div>

        <div className="chatbot-input-row">
          <textarea
            ref={inputRef}
            className="chatbot-input"
            placeholder="輸入訊息，Enter 送出，Shift+Enter 換行"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={sending}
          />
          <button
            type="button"
            className="chatbot-send-btn"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ChatbotModal;
