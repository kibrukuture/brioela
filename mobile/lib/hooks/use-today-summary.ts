export type TodaySummary = {
  urgentTasks: number;
  regularTasks: number;
  assignments: number;
  exams: number;
  classes: number;
  events: number;
  totalEntries: number;
};

export const useTodaySummary = () => ({ summary: null as TodaySummary | null });
