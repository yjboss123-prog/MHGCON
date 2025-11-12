import { memo, useState, useEffect } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { Session } from '../lib/session';

interface MobileHeaderProps {
  session: Session;
  projectName: string;
  onSettings: () => void;
  onSignOut: () => void;
}

export const MobileHeader = memo(function MobileHeader({ session, projectName, onSettings, onSignOut }: MobileHeaderProps) {
  const [dateInfo, setDateInfo] = useState(() => {
    const today = new Date();
    return {
      dayName: today.toLocaleDateString('en-US', { weekday: 'long' }),
      dateStr: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  useEffect(() => {
    const updateDate = () => {
      const today = new Date();
      setDateInfo({
        dayName: today.toLocaleDateString('en-US', { weekday: 'long' }),
        dateStr: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    };
    const id = setInterval(updateDate, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4 py-6 pt-safe"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-300 mb-1">
            {projectName}
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {dateInfo.dayName}
          </h1>
          <div className="text-slate-300 text-sm">
            {dateInfo.dateStr}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onSettings}
            className="p-2.5 rounded-xl bg-white/10 active:bg-white/20 transition-all"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onSignOut}
            className="p-2.5 rounded-xl bg-white/10 active:bg-white/20 transition-all"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
        <div>
          <div className="text-xs text-slate-300">Logged in as</div>
          <div className="font-semibold text-sm">{session.contractor_role || session.display_name}</div>
        </div>
      </div>
    </header>
  );
});
