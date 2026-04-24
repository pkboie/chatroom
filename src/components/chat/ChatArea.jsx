import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';
import { useMessages } from '../../hooks/useMessages';
import { getChatroom } from '../../services/chatroomService';
import {
  addReaction,
  removeReaction,
  unsendMessage,
} from '../../services/messageService';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MessageSearch from './MessageSearch';
import ImagePreview from './ImagePreview';
import ChatroomInfoModal from './ChatroomInfoModal';
import './ChatArea.css';

function ChatArea({ chatroomId, onOpenInvite, onMobileMenu, showMobileMenu = false }) {
  const { currentUser, userProfile } = useAuth();
  const { usersById } = useUsers();
  const { messages, loading } = useMessages(chatroomId);
  const [chatroom, setChatroom] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

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
    setInfoOpen(false);
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

  const handleToggleReaction = async (message, emoji) => {
    if (!currentUser?.uid || !chatroomId) return;
    const uids = message.emojis?.[emoji] || [];
    try {
      if (uids.includes(currentUser.uid)) {
        await removeReaction(chatroomId, message.id, emoji, currentUser.uid);
      } else {
        await addReaction(chatroomId, message.id, emoji, currentUser.uid);
      }
    } catch (err) {
      console.error('toggleReaction:', err);
    }
  };

  const myBlocked = useMemo(
    () => new Set(userProfile?.blockedUsers || []),
    [userProfile?.blockedUsers],
  );

  const visibleMessages = useMemo(() => {
    if (!messages?.length) return messages;
    return messages.filter((m) => {
      if (!m.senderId || m.senderId === currentUser?.uid) return true;
      if (myBlocked.has(m.senderId)) return false;
      const sender = usersById[m.senderId];
      if (sender?.blockedUsers?.includes(currentUser?.uid)) return false;
      return true;
    });
  }, [messages, myBlocked, usersById, currentUser?.uid]);

  const privateBlock = useMemo(() => {
    if (!chatroom || chatroom.type !== 'private') return { disabled: false, reason: '' };
    const otherUid = (chatroom.members || []).find((uid) => uid !== currentUser?.uid);
    if (!otherUid) return { disabled: false, reason: '' };
    if (myBlocked.has(otherUid)) {
      return { disabled: true, reason: '你已封鎖此用戶，無法繼續對話' };
    }
    const other = usersById[otherUid];
    if (other?.blockedUsers?.includes(currentUser?.uid)) {
      return { disabled: true, reason: '此用戶已封鎖你，無法繼續對話' };
    }
    return { disabled: false, reason: '' };
  }, [chatroom, currentUser?.uid, myBlocked, usersById]);

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
        onOpenInfo={() => setInfoOpen(true)}
        onMobileMenu={showMobileMenu ? onMobileMenu : undefined}
      />
      <div className="chat-area-body">
        <MessageList
          messages={visibleMessages}
          loading={loading}
          currentUserId={currentUser?.uid}
          isGroup={chatroom?.type === 'group'}
          highlightedMessageId={highlightedMessageId}
          onEdit={setEditingMessage}
          onUnsend={handleUnsend}
          onImageClick={setPreviewImage}
          onToggleReaction={handleToggleReaction}
        />
        <MessageSearch
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          messages={visibleMessages}
          onJump={handleJump}
        />
      </div>
      <MessageInput
        chatroomId={chatroomId}
        currentUser={currentUser}
        userProfile={userProfile}
        disabled={privateBlock.disabled}
        disabledReason={privateBlock.reason}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
      <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />
      <ChatroomInfoModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        chatroom={chatroom}
      />
    </div>
  );
}

export default ChatArea;
