import { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, onClose, type = 'success', duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
      </div>
    </div>
  );
}
