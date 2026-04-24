import Avatar from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';
import { sanitizeInput } from '../../utils/sanitize';
import './ChatHeader.css';

function ChatHeader({ chatroom, onOpenInvite, onOpenSearch, onOpenInfo, onMobileMenu }) {
  const { currentUser } = useAuth();
  const { usersById } = useUsers();

  if (!chatroom) {
    return (
      <header className="chat-header">
        {onMobileMenu && (
          <button type="button" className="chat-header-icon" onClick={onMobileMenu}>☰</button>
        )}
        <div className="chat-header-meta">
          <h2 className="chat-header-name">載入中...</h2>
        </div>
      </header>
    );
  }

  const isGroup = chatroom.type === 'group';
  const memberCount = (chatroom.members || []).length;

  let rawName;
  let avatarSrc;
  if (isGroup) {
    rawName = chatroom.name || '未命名群組';
  } else {
    const otherUid = (chatroom.members || []).find((uid) => uid !== currentUser?.uid);
    const otherUser = otherUid ? usersById[otherUid] : null;
    rawName = otherUser?.username || chatroom.name || '私聊';
    avatarSrc = otherUser?.photoURL;
  }
  const displayName = sanitizeInput(rawName);

  return (
    <header className="chat-header">
      {onMobileMenu && (
        <button
          type="button"
          className="chat-header-icon"
          onClick={onMobileMenu}
          aria-label="開啟側邊欄"
        >
          ☰
        </button>
      )}

      <Avatar src={avatarSrc} name={displayName} size="md" />
      <div className="chat-header-meta">
        <h2 className="chat-header-name">{displayName}</h2>
        <p className="chat-header-sub">
          {isGroup ? `${memberCount} 位成員` : '私人對話'}
        </p>
      </div>

      <div className="chat-header-actions">
        {onOpenSearch && (
          <button
            type="button"
            className="chat-header-icon"
            onClick={onOpenSearch}
            title="搜尋訊息"
            aria-label="搜尋訊息"
          >
            🔍
          </button>
        )}
        {onOpenInvite && (
          <button
            type="button"
            className="chat-header-icon"
            onClick={onOpenInvite}
            title="邀請成員"
            aria-label="邀請成員"
          >
            ＋
          </button>
        )}
        {onOpenInfo && (
          <button
            type="button"
            className="chat-header-icon"
            onClick={onOpenInfo}
            title={isGroup ? '群組資訊' : '聊天資訊'}
            aria-label="聊天室資訊"
          >
            ⓘ
          </button>
        )}
      </div>
    </header>
  );
}

export default ChatHeader;
