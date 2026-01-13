import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-surface)] rounded-lg shadow-2xl p-6 w-full max-w-md border border-[var(--color-border)] card-glow animate-scale-in"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center border-b-2 border-[var(--color-primary)] pb-3 mb-4">
          <h2 className="text-3xl font-bold text-[var(--color-primary)] uppercase">{title}</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white transition-colors text-3xl">&times;</button>
        </div>

        <p className="text-lg text-[var(--color-text-muted)] my-6">{message}</p>

        <div className="mt-6 flex justify-end gap-4">
            <button
                onClick={onClose}
                className="bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] text-[var(--color-text-base)] font-bold py-3 px-6 text-lg uppercase rounded-md transition-all"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white font-bold py-3 px-6 text-lg uppercase rounded-md transition-transform transform hover:scale-105 active:scale-95"
            >
                Delete
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;