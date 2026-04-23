import './TypingDots.css';

function TypingDots({ label }) {
  return (
    <div className="typing-dots" role="status" aria-label={label || '載入中'}>
      <span className="typing-dots-dot" />
      <span className="typing-dots-dot" />
      <span className="typing-dots-dot" />
    </div>
  );
}

export default TypingDots;
