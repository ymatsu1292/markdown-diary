import { History } from '@/types/history-data-type';
import { ScheduleData } from '@/types/schedule-data-type';

export interface PageData {
  title: string;
  calendarDate: string; // YYYY-MM-DD
  scheduleData: ScheduleData | null; // calendarDate近辺のスケジュール
};
