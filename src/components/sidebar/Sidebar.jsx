import { useAuth } from '../../contexts/AuthContext';
import { logout } from '../../services/authService';
import { useChatrooms } from '../../hooks/useChatrooms';
import Avatar from '../common/Avatar';
import ChatroomList from './ChatroomList';
import './Sidebar.css';

function Sidebar({
  selectedChatroomId,
  onSelectChatroom,
  onOpenCreateRoom,
  onOpenChatbot,
  className = '',
}) {
  const { currentUser, userProfile } = useAuth();
  const { chatrooms, loading, error } = useChatrooms(currentUser?.uid);

  const displayName = userProfile?.username || currentUser?.displayName || '使用者';

  return (
    <aside className={`sidebar ${className}`.trim()}>
      <div className="sidebar-top">
        <div className="sidebar-user">
          <Avatar src={userProfile?.photoURL} name={displayName} size="md" />
          <div className="sidebar-user-meta">
            <p className="sidebar-user-name" title={displayName}>{displayName}</p>
            <p className="sidebar-user-email" title={currentUser?.email || ''}>
              {currentUser?.email}
            </p>
          </div>
          <button
            type="button"
            className="sidebar-icon-btn"
            title="登出"
            onClick={() => logout()}
            aria-label="登出"
          >
            ⎋
          </button>
        </div>

        <button type="button" className="sidebar-new-chat" onClick={onOpenCreateRoom}>
          <span className="plus">＋</span> 新聊天
        </button>
      </div>

      <ChatroomList
        chatrooms={chatrooms}
        loading={loading}
        error={error}
        currentUserId={currentUser?.uid}
        selectedChatroomId={selectedChatroomId}
        onSelect={onSelectChatroom}
      />

      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-bot-btn"
          onClick={onOpenChatbot}
          disabled={!onOpenChatbot}
          title={onOpenChatbot ? 'AI 助手' : '即將推出'}
        >
          🤖 AI 助手
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
