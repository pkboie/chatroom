import Avatar from '../common/Avatar';
import { formatTime } from '../../utils/formatTime';
import { sanitizeInput } from '../../utils/sanitize';
import { useUsers } from '../../contexts/UsersContext';
import './ChatroomItem.css';

function ChatroomItem({ chatroom, currentUserId, isSelected, onClick }) {
  const { usersById } = useUsers();
  const isGroup = chatroom.type === 'group';
  const memberCount = (chatroom.members || []).length;

  let displayName;
  let avatarSrc;
  if (isGroup) {
    displayName = chatroom.name || '未命名群組';
  } else {
    const otherUid = (chatroom.members || []).find((uid) => uid !== currentUserId);
    const otherUser = otherUid ? usersById[otherUid] : null;
    displayName = otherUser?.username || chatroom.name || '私聊';
    avatarSrc = otherUser?.photoURL;
  }

  const lastMessage = sanitizeInput(chatroom.lastMessage || '');
  const time = formatTime(chatroom.lastMessageAt);

  return (
    <button
      type="button"
      className={`chatroom-item ${isSelected ? 'is-selected' : ''}`}
      onClick={onClick}
    >
      <Avatar src={avatarSrc} name={displayName} size="md" />
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
