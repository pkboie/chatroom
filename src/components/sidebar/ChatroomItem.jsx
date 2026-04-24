import Avatar from '../common/Avatar';
import { formatTime } from '../../utils/formatTime';
import { sanitizeInput } from '../../utils/sanitize';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';
import './ChatroomItem.css';

function ChatroomItem({ chatroom, currentUserId, isSelected, onClick }) {
  const { usersById } = useUsers();
  const { userProfile } = useAuth();
  const isGroup = chatroom.type === 'group';
  const memberCount = (chatroom.members || []).length;

  let rawName;
  let avatarSrc;
  let otherUser = null;
  if (isGroup) {
    rawName = chatroom.name || '未命名群組';
  } else {
    const otherUid = (chatroom.members || []).find((uid) => uid !== currentUserId);
    otherUser = otherUid ? usersById[otherUid] : null;
    rawName = otherUser?.username || chatroom.name || '私聊';
    avatarSrc = otherUser?.photoURL;
  }
  const displayName = sanitizeInput(rawName);

  const iBlockedOther = Boolean(
    !isGroup && otherUser?.uid && userProfile?.blockedUsers?.includes(otherUser.uid),
  );
  const otherBlockedMe = Boolean(
    !isGroup && currentUserId && otherUser?.blockedUsers?.includes(currentUserId),
  );
  const showBlockBadge = iBlockedOther || otherBlockedMe;
  const blockBadgeTitle = iBlockedOther ? '你已封鎖此用戶' : '此用戶已封鎖你';

  const lastMessage = sanitizeInput(chatroom.lastMessage || '');
  const time = formatTime(chatroom.lastMessageAt);

  return (
    <button
      type="button"
      className={`chatroom-item ${isSelected ? 'is-selected' : ''}`}
      onClick={onClick}
    >
      <div className={`chatroom-item-avatar ${showBlockBadge ? 'is-blocked' : ''}`}>
        <Avatar src={avatarSrc} name={displayName} size="md" />
        {showBlockBadge && (
          <span className="chatroom-item-block-badge" title={blockBadgeTitle} aria-label={blockBadgeTitle}>
            🚫
          </span>
        )}
      </div>
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
