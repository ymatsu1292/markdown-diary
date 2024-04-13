export interface DaySchedule {
  date: string;
  holiday: string;
  memo: string;
  hasDiary: boolean;
};

export interface WeekSchedule {
  id: string;
  caldata: DaySchedule[];
};

export interface MonthSchedule {
  month: string;
  data: WeekSchedule[];
};

export interface ScheduleData {
  cal1: MonthSchedule;
  cal2: MonthSchedule;
  cal3: MonthSchedule;
  markdownFiles: string[];
  templates: string[];
};

export interface EventData {
  events: { [date: string]: string };
  others: string[];
  templates: string[];
};
