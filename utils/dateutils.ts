import base_logger from '@//utils/logger';
const logger = base_logger.child({ filename: __filename });

export function getTodayStr() {
  const func_logger = logger.child({ "func": "getTodayStr" });
  func_logger.trace({"message": "START"});
  
  const today = new Date();
  const year = today.getFullYear().toString().padStart(4, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const today_str = year + "-" + month + "-" + day;

  func_logger.trace({"message": "END", "res": today_str});
  return today_str;
}

export function getTodayMonth() {
  const func_logger = logger.child({ "func": "getTodayMonth" });
  func_logger.trace({"message": "START"});
  
  const today = new Date();
  const year = today.getFullYear().toString().padStart(4, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const today_month = year + "-" + month;
  
  func_logger.trace({"message": "END", "res": today_month});
  return today_month;
}

function fix_date(year: number, month: number, day: number, increment_flag: boolean): string {
  const func_logger = logger.child({ "func": "fix_date"});
  func_logger.trace({"message": "START", "params": {
    "year": year, "month": month, "day": day, "increment_flag": increment_flag
  }});
  
  let date_str = ""
  while (true) {
    date_str = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    func_logger.trace({"date_str": date_str});
    console.log(date_str);
    let date: Date = new Date(date_str);
    if (!isNaN(date.getDate())) {
      break;
    }
    day = day + (increment_flag ? 1 : -1);
    if (day < 1) {
      day = 31;
      month = month - 1;
      if (month < 1) {
        month = 12;
        year = year - 1;
      }
    } else if (day > 31) {
      day = 1;
      month = month + 1;
      if (month > 12) {
        month = 1;
        year = year + 1;
      }
    }
  }
  func_logger.trace({"message": "END", "params": {
    "year": year, "month": month, "day": day, "increment_flag": increment_flag
  }, "res": date_str});
  return date_str;
}

export function getPrevMonth(targetDate: string): string {
  const func_logger = logger.child({ "func": "fix_date"});
  func_logger.trace({"message": "START", "params": { "targetDate": targetDate }});
  
  let year: number = parseInt(targetDate.slice(0, 4));
  let month: number = parseInt(targetDate.slice(5, 7)) - 1;
  const day: number = parseInt(targetDate.slice(8, 10));
  if (month < 1) {
    month = 12;
    year = year - 1
  }
  const date_str = fix_date(year, month, day, false);
  
  func_logger.trace({"message": "END", "params": { "targetDate": targetDate }, "res": date_str});
  return date_str;
}
export function getPrevDay(targetDate: string): string {
  const func_logger = logger.child({ "func": "getPrevDay"});
  func_logger.trace({"message": "START", "params": { "targetDate": targetDate }});
  
  const year: number = parseInt(targetDate.slice(0, 4));
  const month: number = parseInt(targetDate.slice(5, 7));
  const day: number = parseInt(targetDate.slice(8, 10)) - 1;
  const date_str = fix_date(year, month, day, false);
  
  func_logger.trace({"message": "END", "params": { "targetDate": targetDate }, "res": date_str});
  return date_str;
}
export function getNextMonth(targetDate: string): string {
  const func_logger = logger.child({ "func": "getNextMonth"});
  func_logger.trace({"message": "START", "params": { "targetDate": targetDate }});
  
  let year: number = parseInt(targetDate.slice(0, 4));
  let month: number = parseInt(targetDate.slice(5, 7)) + 1;
  const day: number = parseInt(targetDate.slice(8, 10));
  if (month > 12) {
    month = 1;
    year = year + 1
  }
  const date_str = fix_date(year, month, day, true);
  
  func_logger.trace({"message": "END", "params": { "targetDate": targetDate }, "res": date_str});
  return date_str;
}
export function getNextDay(targetDate: string): string {
  const func_logger = logger.child({ "func": "getNextDay"});
  func_logger.trace({"message": "START", "params": { "targetDate": targetDate }});
  
  const year: number = parseInt(targetDate.slice(0, 4));
  const month: number = parseInt(targetDate.slice(5, 7));
  const day: number = parseInt(targetDate.slice(8, 10)) + 1;
  const date_str = fix_date(year, month, day, true);

  func_logger.trace({"message": "END", "params": { "targetDate": targetDate }});
  return date_str;
}
