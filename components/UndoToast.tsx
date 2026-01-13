import React, { useEffect, useState } from 'react';

interface UndoToastProps {
  show: boolean;
  onUndo: () => void;
  onClose: () => void;
  message: string;
  duration?: number;
}

const UndoToast: React.FC<UndoToastProps> = ({ show, onUndo, onClose, message, duration = 5000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 500); // Wait for animation to finish
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show && !isExiting) {
    return null;
  }

  const handleUndoClick = () => {
    onUndo();
    setIsExiting(true);
    setTimeout(onClose, 500);
  };
  
  return (
    <div className={`fixed bottom-8 left-1/2 bg-[var(--color-surface-light)] text-white p-4 rounded-lg shadow-2xl flex items-center gap-4 z-50 ${isExiting ? 'toast-out' : 'toast-in'}`}>
      <p className="text-xl">{message}</p>
      <button
        onClick={handleUndoClick}
        className="font-bold text-xl text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] uppercase transition-colors"
      >
        Undo
      </button>
    </div>
  );
};

export default UndoToast;
