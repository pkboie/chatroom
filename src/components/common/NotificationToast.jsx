import './NotificationToast.css';

function NotificationToast({ toasts, onClick, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="region" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className="toast"
          onClick={() => onClick?.(t)}
        >
          <div className="toast-body">
            <p className="toast-title">{t.title}</p>
            <p className="toast-text">{t.body}</p>
          </div>
          <span
            className="toast-close"
            role="button"
            aria-label="關閉"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.(t.id);
            }}
          >
            ×
          </span>
        </button>
      ))}
    </div>
  );
}

export default NotificationToast;
