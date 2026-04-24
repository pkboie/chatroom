import { useEffect, useRef } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import MessageBubble from './MessageBubble';
import './MessageList.css';

const sameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const toDate = (ts) => {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
};

const formatDayLabel = (date) =>
  date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });

function MessageList({
  messages,
  loading,
  currentUserId,
  isGroup,
  highlightedMessageId,
  onEdit,
  onUnsend,
  onImageClick,
  onToggleReaction,
}) {
  const endRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const node = containerRef.current?.querySelector(
      `[data-message-id="${highlightedMessageId}"]`,
    );
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedMessageId]);

  if (loading) {
    return (
      <div className="message-list-state">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list-state">
        <p className="message-list-empty">還沒有訊息，發送第一則開始對話 👋</p>
      </div>
    );
  }

  let prevDay = null;

  return (
    <div className="message-list" ref={containerRef}>
      {messages.map((msg) => {
        const date = toDate(msg.createdAt);
        const showDivider = date && !sameDay(date, prevDay);
        if (date) prevDay = date;

        return (
          <div key={msg.id} data-message-id={msg.id}>
            {showDivider && (
              <div className="message-list-divider">
                <span>{formatDayLabel(date)}</span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isSelf={msg.senderId === currentUserId}
              showSender={isGroup && msg.senderId !== currentUserId}
              isHighlighted={highlightedMessageId === msg.id}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onUnsend={onUnsend}
              onImageClick={onImageClick}
              onToggleReaction={onToggleReaction}
            />
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

export default MessageList;
