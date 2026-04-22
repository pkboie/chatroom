import Avatar from '../common/Avatar';
import { formatTime } from '../../utils/formatTime';
import { sanitizeInput } from '../../utils/sanitize';
import { MESSAGE_TYPES } from '../../utils/constants';
import './MessageBubble.css';

function MessageBubble({ message, isSelf, showSender }) {
  const time = formatTime(message.createdAt);
  const senderName = sanitizeInput(message.senderName || '使用者');

  const renderContent = () => {
    if (message.isUnsent) {
      return <p className="message-bubble-unsent">此訊息已被收回</p>;
    }
    if (message.type === MESSAGE_TYPES.IMAGE) {
      return <img className="message-bubble-image" src={message.content} alt="圖片訊息" />;
    }
    if (message.type === MESSAGE_TYPES.GIF) {
      return <img className="message-bubble-image" src={message.content} alt="GIF" />;
    }
    return <p className="message-bubble-text">{sanitizeInput(message.content)}</p>;
  };

  return (
    <div className={`message-row ${isSelf ? 'is-self' : ''}`}>
      {!isSelf && (
        <Avatar src={message.senderPhoto} name={message.senderName} size="sm" />
      )}
      <div className="message-bubble-wrap">
        {showSender && !isSelf && (
          <p className="message-bubble-sender">{senderName}</p>
        )}
        <div className={`message-bubble ${isSelf ? 'is-self' : ''} ${message.isUnsent ? 'is-unsent' : ''}`}>
          {renderContent()}
        </div>
        <p className="message-bubble-meta">
          {time}
          {message.isEdited && !message.isUnsent && <span className="edited-tag">（已編輯）</span>}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;
