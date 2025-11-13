export function isManagerRole(role: string): boolean {
  const normalizedRole = role.toLowerCase().replace(' ', '_');
  return normalizedRole === 'project_manager' || normalizedRole === 'developer' || normalizedRole === 'admin' ||
         role === 'Project Manager' || role === 'Developer' || role === 'Admin';
}

export function roleToDisplayName(role: 'admin' | 'developer' | 'project_manager' | 'contractor'): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'developer':
      return 'Developer';
    case 'project_manager':
      return 'Project Manager';
    case 'contractor':
      return 'Construction Contractor';
    default:
      return role;
  }
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getDaysRemaining(endDate: string, status: string, percentDone: number): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (status === 'Delayed') {
    return daysDiff;
  }

  if (percentDone >= 100 || status === 'Done') {
    return daysDiff > 0 ? daysDiff : 0;
  }

  if (daysDiff < 0 && percentDone < 100) {
    return daysDiff;
  }

  return daysDiff;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'On Track':
      return 'bg-green-500';
    case 'Delayed':
      return 'bg-amber-500';
    case 'Blocked':
      return 'bg-red-500';
    case 'Done':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'On Track':
      return 'bg-green-100 text-green-800';
    case 'Delayed':
      return 'bg-amber-100 text-amber-800';
    case 'Blocked':
      return 'bg-red-100 text-red-800';
    case 'Done':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'Developer':
      return 'bg-blue-100 text-blue-800';
    case 'Project Manager':
      return 'bg-purple-100 text-purple-800';
    case 'Construction Contractor':
      return 'bg-orange-100 text-orange-800';
    case 'Architect':
      return 'bg-teal-100 text-teal-800';
    case 'Chief of Plumbing':
      return 'bg-cyan-100 text-cyan-800';
    case 'Chief of Electronics':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function calculateGanttPosition(
  startDate: string,
  endDate: string,
  projectStart: string,
  projectEnd: string
): { left: string; width: string } {
  const pStart = new Date(projectStart).getTime();
  const pEnd = new Date(projectEnd).getTime();
  const tStart = new Date(startDate).getTime();
  const tEnd = new Date(endDate).getTime();

  const totalDuration = pEnd - pStart;
  const left = ((tStart - pStart) / totalDuration) * 100;
  const width = ((tEnd - tStart) / totalDuration) * 100;

  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(1, width)}%`,
  };
}

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

export function getWeeksInRange(
  startDate: Date,
  endDate: Date
): Array<{ year: number; week: number; date: Date }> {
  const weeks: Array<{ year: number; week: number; date: Date }> = [];
  const current = new Date(startDate);

  const dayOfWeek = current.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  current.setDate(current.getDate() - daysToMonday);

  const projectYear = startDate.getFullYear();

  while (current <= endDate) {
    const { year, week } = getWeekNumber(current);

    if (year >= projectYear) {
      weeks.push({
        year,
        week,
        date: new Date(current),
      });
    }

    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

export function addDays(dateISO: string, n: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
