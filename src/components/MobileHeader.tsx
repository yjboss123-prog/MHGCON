import { memo } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { Session } from '../lib/session';
import { Language } from '../lib/i18n';

interface MobileHeaderProps {
  session: Session;
  projectName: string;
  onSettings: () => void;
  onSignOut: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export const MobileHeader = memo(function MobileHeader({ session, projectName, onSettings, onSignOut, language, onLanguageChange }: MobileHeaderProps) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <header className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4">
      <div style={{ height: 'max(env(safe-area-inset-top), constant(safe-area-inset-top))' }} />
      <div className="py-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-300 mb-1">
            {projectName}
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {dayName}
          </h1>
          <div className="text-slate-300 text-sm">
            {dateStr}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="px-3 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium border border-white/20 active:bg-white/20 transition-all"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <option value="en" className="bg-slate-800">EN</option>
            <option value="fr" className="bg-slate-800">FR</option>
          </select>
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
      </div>
    </header>
  );
});
