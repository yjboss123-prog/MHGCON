import { memo } from 'react';
import { Language } from '../lib/i18n';

interface FilterPanelProps {
  selectedStatuses: string[];
  selectedRoles: string[];
  selectedMonths: string[];
  availableMonths: string[];
  onStatusToggle: (status: string) => void;
  onRoleToggle: (role: string) => void;
  onMonthToggle: (month: string) => void;
  onClearFilters: () => void;
  language: Language;
  allRoles: string[];
  isContractor?: boolean;
}

export const FilterPanel = memo(function FilterPanel(_props: FilterPanelProps) {
  return null;
});
