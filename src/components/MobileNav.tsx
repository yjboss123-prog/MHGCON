import { memo } from 'react';
import { Home, List, BarChart3, User } from 'lucide-react';

interface MobileNavProps {
  currentView: 'my-day' | 'all-tasks' | 'gantt' | 'profile';
  onViewChange: (view: 'my-day' | 'all-tasks' | 'gantt' | 'profile') => void;
  language: 'en' | 'fr';
}

export const MobileNav = memo(function MobileNav({ currentView, onViewChange, language }: MobileNavProps) {
  const navItems = [
    { id: 'my-day' as const, icon: Home, labelEn: 'My Day', labelFr: 'Ma Journée' },
    { id: 'all-tasks' as const, icon: List, labelEn: 'Tasks', labelFr: 'Tâches' },
    { id: 'gantt' as const, icon: BarChart3, labelEn: 'Timeline', labelFr: 'Planning' },
    { id: 'profile' as const, icon: User, labelEn: 'Me', labelFr: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 safe-area-inset-bottom z-50 md:hidden">
      <div className="flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const label = language === 'fr' ? item.labelFr : item.labelEn;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 active:text-slate-700'
              }`}
              style={{ minWidth: '64px', minHeight: '56px' }}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});
