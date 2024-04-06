import { History } from '@/components/types/historyDataType';

export interface PageData {
  title: string;
  calendarDate: string; // YYYY-MM-DD
  histories: History[];
};
