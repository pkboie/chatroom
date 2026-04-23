import { useEffect, useRef, useState } from 'react';
import Avatar from '../common/Avatar';
import { formatTime } from '../../utils/formatTime';
import { sanitizeInput } from '../../utils/sanitize';
import { MESSAGE_TYPES } from '../../utils/constants';
import './MessageBubble.css';

function MessageBubble({
  message,
  isSelf,
  showSender,
  isHighlighted = false,
  onEdit,
  onUnsend,
  onImageClick,
}) {
  const time = formatTime(message.createdAt);
  const senderName = sanitizeInput(message.senderName || '使用者');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const renderContent = () => {
    if (message.isUnsent) {
      return <p className="message-bubble-unsent">此訊息已被收回</p>;
    }
    if (message.type === MESSAGE_TYPES.IMAGE) {
      return (
        <img
          className="message-bubble-image"
          src={message.content}
          alt="圖片訊息"
          onClick={() => onImageClick?.(message.content)}
        />
      );
    }
    if (message.type === MESSAGE_TYPES.GIF) {
      return (
        <img
          className="message-bubble-image"
          src={message.content}
          alt="GIF"
          onClick={() => onImageClick?.(message.content)}
        />
      );
    }
    return <p className="message-bubble-text">{sanitizeInput(message.content)}</p>;
  };

  const canShowMenu = isSelf && !message.isUnsent && (onEdit || onUnsend);
  const canEdit = onEdit && message.type === MESSAGE_TYPES.TEXT;

  const handleEdit = () => {
    setMenuOpen(false);
    onEdit?.(message);
  };

  const handleUnsend = () => {
    setMenuOpen(false);
    if (window.confirm('確定要收回這則訊息嗎？')) {
      onUnsend?.(message);
    }
  };

  return (
    <div className={`message-row ${isSelf ? 'is-self' : ''}`}>
      {!isSelf && (
        <Avatar src={message.senderPhoto} name={message.senderName} size="sm" />
      )}
      <div className="message-bubble-wrap">
        {showSender && !isSelf && (
          <p className="message-bubble-sender">{senderName}</p>
        )}
        <div className="message-bubble-stack">
          <div
            className={`message-bubble ${isSelf ? 'is-self' : ''} ${message.isUnsent ? 'is-unsent' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
          >
            {renderContent()}
          </div>
          {canShowMenu && (
            <div
              className={`message-bubble-menu ${menuOpen ? 'is-open' : ''}`}
              ref={menuRef}
            >
              <button
                type="button"
                className="message-bubble-menu-trigger"
                onClick={() => setMenuOpen((s) => !s)}
                aria-label="訊息選項"
                title="訊息選項"
              >
                ⋯
              </button>
              {menuOpen && (
                <div className={`message-bubble-menu-list ${isSelf ? 'is-self' : ''}`}>
                  {canEdit && (
                    <button type="button" className="message-bubble-menu-item" onClick={handleEdit}>
                      ✏️ 編輯
                    </button>
                  )}
                  {onUnsend && (
                    <button
                      type="button"
                      className="message-bubble-menu-item is-danger"
                      onClick={handleUnsend}
                    >
                      🗑 收回
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="message-bubble-meta">
          {time}
          {message.isEdited && !message.isUnsent && <span className="edited-tag">（已編輯）</span>}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;
