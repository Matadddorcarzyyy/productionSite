export const parseTime = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

export const isTimeInRange = (
  time: string,
  startTime: string,
  endTime: string
): boolean => {
  const timeValue = parseTime(time);
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  const timeMinutes = timeValue.hours * 60 + timeValue.minutes;
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (date: Date): string => {
  return date.toTimeString().split(' ')[0].substring(0, 5);
};

export const getDayOfWeek = (date: Date): number => {
  return date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
};







