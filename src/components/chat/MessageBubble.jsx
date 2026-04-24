import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '../common/Avatar';
import { formatTime } from '../../utils/formatTime';
import { sanitizeInput } from '../../utils/sanitize';
import { EMOJI_LIST, MESSAGE_TYPES } from '../../utils/constants';
import './MessageBubble.css';

function MessageBubble({
  message,
  isSelf,
  showSender,
  isHighlighted = false,
  currentUserId,
  onEdit,
  onUnsend,
  onImageClick,
  onToggleReaction,
}) {
  const time = formatTime(message.createdAt);
  const senderName = sanitizeInput(message.senderName || '使用者');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [reactOpen, setReactOpen] = useState(false);
  const [reactPos, setReactPos] = useState(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const reactTriggerRef = useRef(null);
  const reactBarRef = useRef(null);

  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!reactOpen || !reactTriggerRef.current) return;
    const rect = reactTriggerRef.current.getBoundingClientRect();
    setReactPos({
      top: Math.max(8, rect.top - 48),
      left: Math.max(8, rect.left - 80),
    });
  }, [reactOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDocClick = (e) => {
      const t = e.target;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      if (listRef.current && listRef.current.contains(t)) return;
      setMenuOpen(false);
    };
    const onScrollOrResize = () => setMenuOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!reactOpen) return undefined;
    const onDocClick = (e) => {
      const t = e.target;
      if (reactTriggerRef.current && reactTriggerRef.current.contains(t)) return;
      if (reactBarRef.current && reactBarRef.current.contains(t)) return;
      setReactOpen(false);
    };
    const onScrollOrResize = () => setReactOpen(false);
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [reactOpen]);

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
  const canReact = !message.isUnsent && !!onToggleReaction;

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

  const handlePickReaction = (emoji) => {
    setReactOpen(false);
    onToggleReaction?.(message, emoji);
  };

  const reactionEntries = (() => {
    const emojis = message.emojis || {};
    return Object.entries(emojis)
      .map(([emoji, uids]) => ({ emoji, uids: Array.isArray(uids) ? uids : [] }))
      .filter((e) => e.uids.length > 0);
  })();

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
          {canReact && (
            <div className={`message-bubble-menu ${reactOpen ? 'is-open' : ''}`}>
              <button
                ref={reactTriggerRef}
                type="button"
                className="message-bubble-menu-trigger"
                onClick={() => setReactOpen((s) => !s)}
                aria-label="快速反應"
                title="快速反應"
              >
                ☺
              </button>
            </div>
          )}
          {canShowMenu && (
            <div className={`message-bubble-menu ${menuOpen ? 'is-open' : ''}`}>
              <button
                ref={triggerRef}
                type="button"
                className="message-bubble-menu-trigger"
                onClick={() => setMenuOpen((s) => !s)}
                aria-label="訊息選項"
                title="訊息選項"
              >
                ⋯
              </button>
            </div>
          )}
        </div>
        {reactionEntries.length > 0 && (
          <div className="message-bubble-reactions">
            {reactionEntries.map(({ emoji, uids }) => {
              const reacted = currentUserId && uids.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`message-bubble-reaction ${reacted ? 'is-reacted' : ''}`}
                  onClick={() => onToggleReaction?.(message, emoji)}
                  disabled={!onToggleReaction}
                  title={`${uids.length} 位已反應`}
                >
                  <span className="message-bubble-reaction-emoji">{emoji}</span>
                  <span className="message-bubble-reaction-count">{uids.length}</span>
                </button>
              );
            })}
          </div>
        )}
        <p className="message-bubble-meta">
          {time}
          {message.isEdited && !message.isUnsent && <span className="edited-tag">（已編輯）</span>}
        </p>
      </div>

      {canShowMenu && menuOpen && menuPos &&
        createPortal(
          <div
            ref={listRef}
            className="message-bubble-menu-list"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
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
          </div>,
          document.body,
        )}

      {canReact && reactOpen && reactPos &&
        createPortal(
          <div
            ref={reactBarRef}
            className="message-bubble-react-bar"
            style={{ top: reactPos.top, left: reactPos.left }}
          >
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="message-bubble-react-btn"
                onClick={() => handlePickReaction(emoji)}
                aria-label={`以 ${emoji} 反應`}
              >
                {emoji}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export default MessageBubble;
