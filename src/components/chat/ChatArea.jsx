import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../hooks/useMessages';
import { getChatroom } from '../../services/chatroomService';
import { unsendMessage } from '../../services/messageService';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MessageSearch from './MessageSearch';
import ImagePreview from './ImagePreview';
import './ChatArea.css';

function ChatArea({ chatroomId, onOpenInvite, onMobileMenu, showMobileMenu = false }) {
  const { currentUser, userProfile } = useAuth();
  const { messages, loading } = useMessages(chatroomId);
  const [chatroom, setChatroom] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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

  useEffect(() => {
    setEditingMessage(null);
    setSearchOpen(false);
    setHighlightedMessageId(null);
    setPreviewImage(null);
  }, [chatroomId]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    const t = setTimeout(() => setHighlightedMessageId(null), 2000);
    return () => clearTimeout(t);
  }, [highlightedMessageId]);

  const handleUnsend = async (message) => {
    try {
      await unsendMessage(chatroomId, message.id);
      if (editingMessage?.id === message.id) setEditingMessage(null);
    } catch (err) {
      console.error('unsendMessage:', err);
    }
  };

  const handleJump = (messageId) => {
    setHighlightedMessageId(messageId);
    setSearchOpen(false);
  };

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
        onOpenSearch={() => setSearchOpen((s) => !s)}
        onMobileMenu={showMobileMenu ? onMobileMenu : undefined}
      />
      <div className="chat-area-body">
        <MessageList
          messages={messages}
          loading={loading}
          currentUserId={currentUser?.uid}
          isGroup={chatroom?.type === 'group'}
          highlightedMessageId={highlightedMessageId}
          onEdit={setEditingMessage}
          onUnsend={handleUnsend}
          onImageClick={setPreviewImage}
        />
        <MessageSearch
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          messages={messages}
          onJump={handleJump}
        />
      </div>
      <MessageInput
        chatroomId={chatroomId}
        currentUser={currentUser}
        userProfile={userProfile}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
      <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

export default ChatArea;
