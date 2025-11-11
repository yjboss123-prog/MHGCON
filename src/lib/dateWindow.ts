export interface MonthHeader {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export interface DateWindow {
  min: Date;
  max: Date;
  headers: MonthHeader[];
}

function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  return date;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatMonthYear(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function diffMonths(start: Date, end: Date): number {
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() > start.getDate()) {
    return months + (end.getDate() - start.getDate()) / 30;
  }
  return months;
}

export function buildWindow(
  projectStartISO: string,
  durationMonths = 12,
  mobile = false
): DateWindow {
  const start = startOfMonth(parseDate(projectStartISO));
  const months = mobile ? Math.min(6, durationMonths) : durationMonths;

  const headers: MonthHeader[] = Array.from({ length: months }, (_, i) => {
    const monthStart = startOfMonth(addMonths(start, i));
    return {
      key: formatYearMonth(monthStart),
      label: formatMonthYear(monthStart),
      start: monthStart,
      end: endOfMonth(monthStart),
    };
  });

  return {
    min: headers[0].start,
    max: headers[headers.length - 1].end,
    headers,
  };
}

export function fitDuration(projectStartISO: string, taskEndDates: Date[]): number {
  const start = startOfMonth(parseDate(projectStartISO));

  let latestEnd: Date;
  if (taskEndDates.length === 0) {
    latestEnd = endOfMonth(addMonths(start, 9));
  } else {
    const maxDate = new Date(Math.max(...taskEndDates.map(d => +d)));
    latestEnd = endOfMonth(maxDate);
  }

  const months = Math.ceil(diffMonths(start, latestEnd));
  return Math.max(9, Math.min(12, months));
}

export function applyOffsetToTask(
  projectStartISO: string,
  offsetDays: number,
  durationDays: number
): { startDate: string; endDate: string } {
  const start = parseDate(projectStartISO);
  const taskStart = new Date(start);
  taskStart.setDate(taskStart.getDate() + offsetDays);

  const taskEnd = new Date(taskStart);
  taskEnd.setDate(taskEnd.getDate() + durationDays);

  return {
    startDate: taskStart.toISOString().split('T')[0],
    endDate: taskEnd.toISOString().split('T')[0],
  };
}

export function calculateOffset(projectStartISO: string, taskStartDate: string): number {
  const projectStart = parseDate(projectStartISO);
  const taskStart = parseDate(taskStartDate);
  const diffTime = taskStart.getTime() - projectStart.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateDuration(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function isMobileView(): boolean {
  return window.innerWidth < 768;
}
