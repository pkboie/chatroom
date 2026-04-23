import { useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeInput } from '../../utils/sanitize';
import { formatTime } from '../../utils/formatTime';
import { MESSAGE_TYPES } from '../../utils/constants';
import './MessageSearch.css';

function MessageSearch({ isOpen, onClose, messages, onJump }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages.filter((m) => {
      if (m.isUnsent) return false;
      if (m.type !== MESSAGE_TYPES.TEXT) return false;
      return (m.content || '').toLowerCase().includes(q);
    });
  }, [query, messages]);

  if (!isOpen) return null;

  return (
    <div className="message-search">
      <div className="message-search-header">
        <input
          ref={inputRef}
          type="text"
          className="message-search-input"
          placeholder="搜尋此聊天室的訊息..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="message-search-close"
          onClick={onClose}
          aria-label="關閉搜尋"
        >
          ×
        </button>
      </div>

      <div className="message-search-results">
        {!query.trim() && (
          <p className="message-search-empty">輸入關鍵字開始搜尋</p>
        )}
        {query.trim() && results.length === 0 && (
          <p className="message-search-empty">查無符合的訊息</p>
        )}
        {results.map((m) => (
          <button
            key={m.id}
            type="button"
            className="message-search-item"
            onClick={() => onJump?.(m.id)}
          >
            <div className="message-search-item-row">
              <span className="message-search-item-sender">
                {sanitizeInput(m.senderName || '使用者')}
              </span>
              <span className="message-search-item-time">{formatTime(m.createdAt)}</span>
            </div>
            <p className="message-search-item-preview">{sanitizeInput(m.content)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MessageSearch;
