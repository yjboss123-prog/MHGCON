import { useState, memo, useEffect } from 'react';
import { ChevronRight, X, Search, Check } from 'lucide-react';

interface AssigneeSelectorProps {
  allRoles: string[];
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
}

function getInitials(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getRoleType(role: string): string {
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes('manager')) return 'Manager';
  if (lowerRole.includes('developer')) return 'Developer';
  if (lowerRole.includes('contractor')) return 'Contractor';
  if (lowerRole.includes('architect')) return 'Architect';
  if (lowerRole.includes('plumbing')) return 'Plumbing';
  if (lowerRole.includes('electronics') || lowerRole.includes('electric')) return 'Electronics';
  return 'Team Member';
}

function getAvatarColor(role: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-red-500',
    'bg-yellow-500',
  ];

  let hash = 0;
  for (let i = 0; i < role.length; i++) {
    hash = role.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const AssigneeSelector = memo(function AssigneeSelector({
  allRoles,
  selectedRoles,
  onChange,
}: AssigneeSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!isModalOpen) {
      setTempSelected(selectedRoles);
    }
  }, [selectedRoles, isModalOpen]);

  const handleOpenModal = () => {
    setTempSelected([...selectedRoles]);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setTempSelected([...selectedRoles]);
    setIsModalOpen(false);
    setSearchQuery('');
  };

  const handleSave = () => {
    onChange([...tempSelected]);
    setIsModalOpen(false);
    setSearchQuery('');
  };

  const handleToggleRole = (role: string) => {
    setTempSelected(prev => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const filteredRoles = allRoles.filter((role) =>
    role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visiblePills = selectedRoles.slice(0, 3);
  const remainingCount = selectedRoles.length - 3;

  return (
    <>
      <div>
        <label className="text-sm font-semibold text-slate-900 block mb-3">
          Assigned To
        </label>

        <button
          onClick={handleOpenModal}
          className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
          style={{ minHeight: '56px' }}
        >
          <div className="flex-1 flex items-center gap-2 flex-wrap min-h-[32px]">
            {selectedRoles.length === 0 ? (
              <span className="text-slate-500 text-sm">Select assignees</span>
            ) : (
              <>
                {visiblePills.map((role) => (
                  <div
                    key={role}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-medium ${getAvatarColor(role)}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                      {getInitials(role)}
                    </div>
                    <span className="max-w-[100px] truncate">{role}</span>
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-300 text-slate-700 text-xs font-medium">
                    +{remainingCount} more
                  </div>
                )}
              </>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
        </button>

        {selectedRoles.length > 0 && (
          <p className="mt-2 text-xs text-slate-600">
            {selectedRoles.length} {selectedRoles.length === 1 ? 'person' : 'people'} assigned
          </p>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[600px]"
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
            }}
          >
            <div className="flex-shrink-0 px-5 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Select Assignees
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ minHeight: '44px' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-2">
              {filteredRoles.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No people found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredRoles.map((role) => {
                    const isSelected = tempSelected.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => handleToggleRole(role)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                        style={{ minHeight: '60px' }}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(role)}`}>
                          {getInitials(role)}
                        </div>

                        <div className="flex-1 text-left min-w-0">
                          <div className="font-medium text-slate-900 truncate">
                            {role}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {getRoleType(role)}
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-5 py-4 border-t border-slate-200 bg-white">
              <div className="mb-3 text-center text-sm text-slate-600">
                {tempSelected.length} {tempSelected.length === 1 ? 'person' : 'people'} assigned
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
                style={{ minHeight: '48px' }}
              >
                Save Assignees
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
