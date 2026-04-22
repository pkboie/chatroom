import Avatar from '../common/Avatar';
import { formatTime } from '../../utils/formatTime';
import { sanitizeInput } from '../../utils/sanitize';
import './ChatroomItem.css';

function ChatroomItem({ chatroom, currentUserId, isSelected, onClick }) {
  const isGroup = chatroom.type === 'group';
  const memberCount = (chatroom.members || []).length;
  const displayName = chatroom.name || (isGroup ? '未命名群組' : '私聊');
  const lastMessage = sanitizeInput(chatroom.lastMessage || '');
  const time = formatTime(chatroom.lastMessageAt);

  return (
    <button
      type="button"
      className={`chatroom-item ${isSelected ? 'is-selected' : ''}`}
      onClick={onClick}
    >
      <Avatar name={displayName} size="md" />
      <div className="chatroom-item-body">
        <div className="chatroom-item-row">
          <span className="chatroom-item-name" title={displayName}>
            {displayName}
            {isGroup && <span className="chatroom-item-count"> · {memberCount}</span>}
          </span>
          {time && <span className="chatroom-item-time">{time}</span>}
        </div>
        <p className="chatroom-item-preview">
          {lastMessage || <span className="chatroom-item-preview-muted">尚無訊息</span>}
        </p>
      </div>
    </button>
  );
}

export default ChatroomItem;
