import Avatar from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';
import './ChatHeader.css';

function ChatHeader({ chatroom, onOpenInvite, onOpenSearch, onMobileMenu }) {
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

  let displayName;
  let avatarSrc;
  if (isGroup) {
    displayName = chatroom.name || '未命名群組';
  } else {
    const otherUid = (chatroom.members || []).find((uid) => uid !== currentUser?.uid);
    const otherUser = otherUid ? usersById[otherUid] : null;
    displayName = otherUser?.username || chatroom.name || '私聊';
    avatarSrc = otherUser?.photoURL;
  }

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
      </div>
    </header>
  );
}

export default ChatHeader;
