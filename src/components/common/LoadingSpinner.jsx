import './LoadingSpinner.css';

function LoadingSpinner({ fullscreen = false, size = 40 }) {
  const spinner = (
    <div
      className="loading-spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 12) }}
    />
  );
  if (fullscreen) {
    return <div className="loading-spinner-fullscreen">{spinner}</div>;
  }
  return spinner;
}

export default LoadingSpinner;
