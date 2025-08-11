// Utility functions for handling dates and timestamps

export const toDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  return null;
};

export const formatDate = (date: any): string => {
  const jsDate = toDate(date);
  return jsDate ? jsDate.toLocaleDateString() : 'Date unavailable';
};

export const formatTime = (date: any): string => {
  const jsDate = toDate(date);
  return jsDate ? jsDate.toLocaleTimeString() : '';
};

export const formatDateTime = (date: any): string => {
  const jsDate = toDate(date);
  return jsDate ? jsDate.toLocaleString() : 'Date unavailable';
};

export const getDaysUntilDeadline = (deadline: any): string | null => {
  if (!deadline) return null;
  try {
    const date = toDate(deadline);
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return Due in  days;
  } catch (error) {
    return null;
  }
};

export const getDeadlineColor = (deadline: any): string => {
  const daysText = getDaysUntilDeadline(deadline);
  if (daysText === 'Overdue') return 'text-red-600';
  if (daysText === 'Due today') return 'text-orange-600';
  if (daysText === 'Due tomorrow') return 'text-yellow-600';
  return 'text-gray-500';
};
