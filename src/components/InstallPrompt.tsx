import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandalone() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (isIOS() && !isInStandalone()) {
      setShowIOSHint(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  if (showIOSHint) {
    return (
      <div className="relative">
        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 z-50">
          <button
            onClick={() => setShowIOSHint(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="pr-4">
            Tap <span className="font-semibold">Share</span> (square with arrow) → <span className="font-semibold">Add to Home Screen</span>
          </p>
        </div>
      </div>
    );
  }

  if (!show) return null;
  return (
    <button onClick={onInstall} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
      Install app
    </button>
  );
}
