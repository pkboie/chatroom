import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import './ChatPage.css';

function ChatPage() {
  const { currentUser, userProfile } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const displayName =
    userProfile?.username || currentUser?.displayName || currentUser?.email || '使用者';

  return (
    <div className="chat-placeholder">
      <div className="chat-placeholder-card">
        <h1>歡迎，{displayName}</h1>
        <p>Phase 1 完成，登入與註冊系統已上線。</p>
        <p className="chat-placeholder-meta">UID: {currentUser?.uid}</p>
        <button type="button" className="chat-placeholder-logout" onClick={handleLogout}>
          登出
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
