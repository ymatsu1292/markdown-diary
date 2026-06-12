import type { ScheduleData } from '@/types/schedule-data-type';
import type { GrepResult } from '@/types/grep-type';

export interface PageData {
  title: string;
  calendarDate: string; // YYYY-MM-DD
  scheduleData: ScheduleData | null; // calendarDate近辺のスケジュール
  grepText: string;
  grepResults: GrepResult[];
};
