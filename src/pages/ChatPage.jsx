import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChatrooms } from '../hooks/useChatrooms';
import { useNotification } from '../hooks/useNotification';
import { markChatroomRead } from '../services/messageService';
import Sidebar from '../components/sidebar/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import CreateRoomModal from '../components/sidebar/CreateRoomModal';
import InviteMemberModal from '../components/sidebar/InviteMemberModal';
import ProfileModal from '../components/profile/ProfileModal';
import ChatbotModal from '../components/chatbot/ChatbotModal';
import NotificationToast from '../components/common/NotificationToast';
import './ChatPage.css';

const MOBILE_BREAKPOINT = 768;
const TOAST_TTL_MS = 5000;
const MAX_TOASTS = 3;

function ChatPage() {
  const { currentUser, userProfile } = useAuth();
  const { chatrooms } = useChatrooms(currentUser?.uid);

  const [selectedChatroomId, setSelectedChatroomId] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const dismissTimers = useRef(new Map());

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const selectedChatroom = useMemo(
    () => chatrooms.find((r) => r.id === selectedChatroomId) || null,
    [chatrooms, selectedChatroomId],
  );

  // If the selected chatroom disappears from the user's list (left a group,
  // got kicked, etc.), clear the selection so ChatArea stops trying to
  // subscribe to messages they no longer have access to.
  useEffect(() => {
    if (selectedChatroomId && !selectedChatroom) {
      setSelectedChatroomId(null);
    }
  }, [selectedChatroomId, selectedChatroom]);

  // Auto-clear unread count whenever the user is actively viewing a chatroom
  // and an unread message arrives (or they just opened it). Skip the write
  // when count is already 0 to avoid spamming Firestore on every snapshot.
  const activeUnread = currentUser?.uid
    ? selectedChatroom?.unreadCounts?.[currentUser.uid] || 0
    : 0;
  useEffect(() => {
    if (!selectedChatroomId || !currentUser?.uid) return;
    if (activeUnread > 0) {
      markChatroomRead(selectedChatroomId, currentUser.uid).catch((err) =>
        console.error('markChatroomRead:', err),
      );
    }
  }, [selectedChatroomId, currentUser?.uid, activeUnread]);

  const dismissToast = useCallback((id) => {
    const timer = dismissTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast) => {
      setToasts((prev) => {
        const next = [...prev.filter((t) => t.id !== toast.id), toast];
        return next.slice(-MAX_TOASTS);
      });
      const timer = setTimeout(() => dismissToast(toast.id), TOAST_TTL_MS);
      dismissTimers.current.set(toast.id, timer);
    },
    [dismissToast],
  );

  useEffect(() => {
    return () => {
      dismissTimers.current.forEach((t) => clearTimeout(t));
      dismissTimers.current.clear();
    };
  }, []);

  const handleClickToast = useCallback(
    (toast) => {
      setSelectedChatroomId(toast.chatroomId);
      if (isMobile) setSidebarOpen(false);
      dismissToast(toast.id);
    },
    [isMobile, dismissToast],
  );

  useNotification({
    currentUserId: currentUser?.uid,
    chatrooms,
    activeChatroomId: selectedChatroomId,
    onClickChatroom: (id) => {
      setSelectedChatroomId(id);
      if (isMobile) setSidebarOpen(false);
    },
    onNotify: pushToast,
  });

  const handleSelectChatroom = (id) => {
    setSelectedChatroomId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const handleCreated = (newRoomId) => {
    setSelectedChatroomId(newRoomId);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="chat-page">
      {isMobile && sidebarOpen && (
        <div
          className="chat-page-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        selectedChatroomId={selectedChatroomId}
        onSelectChatroom={handleSelectChatroom}
        onOpenCreateRoom={() => setShowCreateRoom(true)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenChatbot={() => setShowChatbot(true)}
        className={isMobile ? (sidebarOpen ? 'mobile-open' : 'mobile-closed') : ''}
      />

      <ChatArea
        chatroomId={selectedChatroomId}
        onOpenInvite={selectedChatroom?.type === 'group' ? () => setShowInvite(true) : null}
        onMobileMenu={() => setSidebarOpen((s) => !s)}
        showMobileMenu={isMobile}
      />

      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        currentUser={currentUser}
        onCreated={handleCreated}
      />

      {selectedChatroom && (
        <InviteMemberModal
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          chatroom={selectedChatroom}
          currentUser={currentUser}
        />
      )}

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        currentUser={currentUser}
        userProfile={userProfile}
      />

      <ChatbotModal
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
      />

      <NotificationToast
        toasts={toasts}
        onClick={handleClickToast}
        onDismiss={dismissToast}
      />
    </div>
  );
}

export default ChatPage;
