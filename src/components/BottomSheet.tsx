import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sheet = (
    <div className="fixed inset-0 z-[3000]">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <div
        role="menu"
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-auto animate-slideUp"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-screen-sm p-4">
          <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
