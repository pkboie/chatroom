import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../hooks/useMessages';
import { getChatroom } from '../../services/chatroomService';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatArea.css';

function ChatArea({ chatroomId, onOpenInvite, onMobileMenu, showMobileMenu = false }) {
  const { currentUser, userProfile } = useAuth();
  const { messages, loading } = useMessages(chatroomId);
  const [chatroom, setChatroom] = useState(null);

  useEffect(() => {
    if (!chatroomId) {
      setChatroom(null);
      return;
    }
    let alive = true;
    getChatroom(chatroomId)
      .then((data) => {
        if (alive) setChatroom(data);
      })
      .catch((err) => console.error('getChatroom:', err));
    return () => {
      alive = false;
    };
  }, [chatroomId, messages.length]);

  if (!chatroomId) {
    return (
      <div className="chat-area chat-area-empty">
        {showMobileMenu && (
          <button type="button" className="chat-area-mobile-menu" onClick={onMobileMenu}>
            ☰
          </button>
        )}
        <div className="chat-area-welcome">
          <h2>歡迎使用 Chatroom</h2>
          <p>從左側選擇一個聊天室，或建立新聊天開始對話。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <ChatHeader
        chatroom={chatroom}
        onOpenInvite={onOpenInvite}
        onMobileMenu={showMobileMenu ? onMobileMenu : undefined}
      />
      <MessageList
        messages={messages}
        loading={loading}
        currentUserId={currentUser?.uid}
        isGroup={chatroom?.type === 'group'}
      />
      <MessageInput
        chatroomId={chatroomId}
        currentUser={currentUser}
        userProfile={userProfile}
      />
    </div>
  );
}

export default ChatArea;
