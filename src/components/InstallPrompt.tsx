import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandalone() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS() && !isInStandalone()) {
        setShowIOSModal(true);
      }
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowIOSModal(false);
  };

  if (isInStandalone()) return null;

  return (
    <>
      <button
        onClick={onInstall}
        className="btn-secondary px-3 py-2 text-sm flex items-center gap-2"
        title="Install app"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Install</span>
      </button>

      {showIOSModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleDismiss}
          />
          <div className="fixed inset-x-4 top-20 z-50 bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-lg"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Share className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Install App</h3>
              <p className="text-sm text-slate-600">
                Tap the <span className="font-semibold">Share</span> button{' '}
                <Share className="inline w-4 h-4" /> at the bottom of your screen, then tap{' '}
                <span className="font-semibold">"Add to Home Screen"</span>
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
