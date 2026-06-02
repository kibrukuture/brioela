import type { TodaySummary } from '@/lib/hooks/use-today-summary';
import { format, isToday, isTomorrow, isYesterday } from '@/lib/date-time-utils';
import { getDailyMessage } from './daily-messages';

export interface SummaryCopy {
  message: string;
  highlight: string;
  dateText: string;
  isPositive: boolean;
  parts: string[];
  connectors: string[];
}

export async function generateSummaryCopy(
  summary: TodaySummary,
  selectedDate: Date
): Promise<SummaryCopy> {
  const { urgentTasks, regularTasks, assignments, exams, classes, events, totalEntries } = summary;

  // Generate human-readable date text
  const getDateText = () => {
    if (isToday(selectedDate)) return 'today';
    if (isTomorrow(selectedDate)) return 'tomorrow';
    if (isYesterday(selectedDate)) return 'yesterday';
    return `on ${format(selectedDate, 'MMMM D')}`;
  };

  const dateText = getDateText();

  // If nothing scheduled
  if (totalEntries === 0) {
    // For today, use dynamic uplifting message
    if (isToday(selectedDate)) {
      const dailyMessage = await getDailyMessage(selectedDate);
      return {
        message: dailyMessage,
        highlight: dailyMessage,
        dateText,
        isPositive: true,
        parts: [],
        connectors: [],
      };
    }

    // For other dates, use standard "nothing scheduled" message
    const getEmptyMessage = () => {
      if (isTomorrow(selectedDate))
        return { prefix: 'Nothing scheduled', highlight: 'for tomorrow' };
      if (isYesterday(selectedDate))
        return { prefix: 'Nothing was scheduled', highlight: 'for yesterday' };
      return { prefix: 'Nothing scheduled', highlight: `for ${format(selectedDate, 'MMMM D')}` };
    };

    const emptyMsg = getEmptyMessage();
    return {
      message: `${emptyMsg.prefix} ${emptyMsg.highlight}.`,
      highlight: emptyMsg.highlight,
      dateText,
      isPositive: true,
      parts: [],
      connectors: [],
    };
  }

  // Build prioritized parts
  const parts: string[] = [];
  const highlights: string[] = [];

  // Most urgent first
  if (urgentTasks > 0) {
    const urgentText = urgentTasks === 1 ? '1 urgent task' : `${urgentTasks} urgent tasks`;
    parts.push(urgentText);
    highlights.push(urgentText);
  }

  // Exams (high priority)
  if (exams > 0) {
    const examText = exams === 1 ? '1 exam' : `${exams} exams`;
    parts.push(examText);
    highlights.push(examText);
  }

  // Classes (time-sensitive)
  if (classes > 0) {
    const classText = classes === 1 ? '1 class' : `${classes} classes`;
    parts.push(classText);
    highlights.push(classText);
  }

  // Assignments due
  if (assignments > 0) {
    const assignmentText = assignments === 1 ? '1 assignment' : `${assignments} assignments`;
    parts.push(assignmentText);
    highlights.push(assignmentText);
  }

  // Regular tasks
  if (regularTasks > 0) {
    const taskText = regularTasks === 1 ? '1 task' : `${regularTasks} tasks`;
    parts.push(taskText);
    highlights.push(taskText);
  }

  // Events (lower priority) - includes both Realm events and external calendar events
  if (events > 0) {
    const eventText = events === 1 ? '1 event' : `${events} events`;
    parts.push(eventText);
    highlights.push(eventText);
  }

  // Generate proper sentence structure
  let message = '';
  let highlight = '';
  let connectors: string[] = [];

  if (parts.length === 1) {
    message = `You have ${parts[0]} ${dateText}.`;
    highlight = parts[0];
    connectors = [];
  } else if (parts.length === 2) {
    message = `You have ${parts[0]} and ${parts[1]} ${dateText}.`;
    highlight = `${parts[0]} and ${parts[1]}`;
    connectors = [' and '];
  } else if (parts.length === 3) {
    message = `You have ${parts[0]}, ${parts[1]}, and ${parts[2]} ${dateText}.`;
    highlight = `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
    connectors = [', ', ', and '];
  } else {
    // For 4+ items, create proper list with commas and "and"
    const allButLast = parts.slice(0, -1);
    const lastPart = parts[parts.length - 1];
    const commaSeparated = allButLast.join(', ');
    message = `You have ${commaSeparated}, and ${lastPart} ${dateText}.`;
    highlight = `${commaSeparated}, and ${lastPart}`;
    connectors = Array(parts.length - 1)
      .fill(', ')
      .concat([' and ']);
  }

  return {
    message,
    highlight,
    dateText,
    isPositive: false,
    parts: highlights,
    connectors,
  };
}
