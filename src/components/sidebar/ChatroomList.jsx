import LoadingSpinner from '../common/LoadingSpinner';
import ChatroomItem from './ChatroomItem';
import './ChatroomList.css';

function ChatroomList({ chatrooms, loading, currentUserId, selectedChatroomId, onSelect }) {
  if (loading) {
    return (
      <div className="chatroom-list-state">
        <LoadingSpinner size={28} />
      </div>
    );
  }

  if (!chatrooms || chatrooms.length === 0) {
    return (
      <div className="chatroom-list-state">
        <p className="chatroom-list-empty">還沒有聊天室</p>
        <p className="chatroom-list-empty-sub">點擊上方「新聊天」開始</p>
      </div>
    );
  }

  return (
    <div className="chatroom-list">
      {chatrooms.map((room) => (
        <ChatroomItem
          key={room.id}
          chatroom={room}
          currentUserId={currentUserId}
          isSelected={room.id === selectedChatroomId}
          onClick={() => onSelect?.(room.id)}
        />
      ))}
    </div>
  );
}

export default ChatroomList;
