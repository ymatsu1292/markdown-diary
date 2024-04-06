import { History } from '@/components/types/historyDataType';
import { ScheduleData } from '@/components/types/scheduleDataType';

export interface PageData {
  title: string;
  calendarDate: string; // YYYY-MM-DD
  scheduleData: ScheduleData | null; // calendarDate近辺のスケジュール
};
