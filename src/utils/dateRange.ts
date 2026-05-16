function toIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function normalizeDateInput(date: string) {
  return date.includes('T') ? date.slice(0, 10) : date;
}

export function getDayStart(date: string) {
  return `${normalizeDateInput(date)} 00:00:00.000`;
}

export function getDayEnd(date: string) {
  return `${normalizeDateInput(date)} 23:59:59.999`;
}

export function getDateRangeInclusive(start: string, end: string) {
  return {
    startDate: getDayStart(start),
    endDate: getDayEnd(end),
  };
}

export function getTodayRange() {
  const now = new Date();
  const today = toIsoDate(now);
  return { startDate: today, endDate: today };
}

export function getCurrentWeekRange() {
  const now = new Date();
  const weekday = now.getDay() || 7;
  const start = new Date(now);
  start.setDate(now.getDate() - weekday + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export function getCurrentMonthRange() {
  const now = new Date();
  return {
    startDate: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export function getCustomRange(start: string, end: string) {
  return { startDate: start, endDate: end };
}

export function formatDateBR(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
}

export function formatDateTimeBR(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
