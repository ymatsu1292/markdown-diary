import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment';
import { ScheduleData, MonthSchedule, WeekSchedule, DaySchedule } from '@/components/types/scheduleDataType';
import { EventData } from '@/components/types/scheduleDataType';
import { stat, writeFile, readFile, opendir } from 'node:fs/promises';
import { Buffer } from 'node:buffer';

function create_calendar_base(check_month: any): MonthSchedule {
  const year = check_month.clone().year();
  const month = check_month.clone().month();
  let result: MonthSchedule = {
    "month": check_month.format("YYYY-MM"),
    "data": []
  }
  let start_date = check_month.clone().weekday(0);
  //console.log("start_date=", start_date, ", check_month=", month);
  let week_number = 0;
  let continue_flag = true;
  while (continue_flag) {
    let week_data: WeekSchedule = {
      "id": "week" + String(week_number),
      "caldata": []
    };
    for (let d = 0; d < 7; d ++) {
      const calc_date = start_date.clone().add(d + week_number * 7, 'days');
      const calc_date_str = calc_date.format("YYYY-MM-DD");
      if (calc_date.month() != month) {
	week_data["caldata"].push({date: "", holiday: "", memo: "", hasDiary: false});
      } else {
	week_data["caldata"].push({date: String(calc_date.date()), holiday: "", memo: "", hasDiary: false});
      }
      if (calc_date.year() > year || (calc_date.year() == year && calc_date.month() > month)) {
	continue_flag = false;
      }
      //console.log("calc_date=", calc_date, ", calc_date_str=", calc_date_str,
      // ", month=", month, ", calc_date.month()=", calc_date.month(), ", continue_flag=", continue_flag);
    }
    result["data"].push(week_data);
    week_number += 1;
  }
  //console.log(result);
  return result;
}

function parse_event_text(text: string): {[key: string]: string} {
  console.log("parse_event_text: START ", text);
  const lines: string[] = text.split('\n');
  let res: {[key: string]: string} = {}
  lines.forEach((line) => {
    let items: string[] = line.split(':');
    if (items.length == 2) {
      let date: string = items[0].trim();
      let event_text: string = items[1].trim();
      res[date] = event_text;
    }
  });
  
  console.log("parse_event_text: END ", res);
  return res;
}


async function load_events(event_file: string, base_file: string | null): Promise<EventData> {
  console.log("load_events: START -", event_file, base_file);
  // イベント設定ファイルを読み込む
  let event_data: EventData = {"events": {}, "others": []};
  try {
    let event_buffer = await readFile(event_file, { encoding: 'utf8' });
    let event_text = event_buffer.toString();
    event_data["events"] = parse_event_text(event_text);
  } catch (error) {
    // ファイルがない場合はベースファイルから読み込み、本来のファイルに書き出す
    if (base_file != null) {
      try {
        let event_buffer = await readFile(base_file);
        let event_text = event_buffer.toString();
        await writeFile(event_file, event_text);
        console.log("copy events!");
        event_data["events"] = parse_event_text(event_text);
      } catch (error) {
      }
    }
  }
  console.log("load_events: END");
  return event_data;
}

async function check_diary_exists(target_month_list: string[], user: string | null): Promise<EventData> {
  console.log("check_diary_exists: START");
  let event_data: EventData = {"events": {}, "others": []};
  try {
    const work_dir = process.env.DATA_DIRECTORY + "/" + user;
    //console.log("work_dir=", work_dir);
    const dir = await opendir(work_dir);
    const month_list = "(" + target_month_list.join("|") + ")";
    const filename_pattern_md = new RegExp("\.md$");
    const filename_pattern_cal = new RegExp("^" + month_list + "-[0-9]{2}\.md$");
    for await (const dirent of dir) {
      console.log(dirent.name);
      if (filename_pattern_md.test(dirent.name)) {
        if (filename_pattern_cal.test(dirent.name)) {
          const date_str = dirent.name.slice(0, 10);
          event_data["events"][date_str] = "";
        } else {
          event_data["others"].push(dirent.name);
        }
      }
    }
  } catch (error) {}
  console.log("check_diary_exists: END");
  return event_data;
}

function set_schedule_sub(target_calendar: MonthSchedule, event_data: EventData, type: string) {
  let month = target_calendar["month"];
  for (const week_data of target_calendar["data"]) {
    for (const day_data of week_data["caldata"]) {
      const date = day_data["date"];
      if (date != "") {
        const date_str = month + "-" + String(date).padStart(2, '0');
        //console.log("date_str=", date_str, date, event_data["events"]);
        if (date_str in event_data["events"]) {
          if (type == "holiday") {
            day_data.holiday = event_data["events"][date_str]
          } else if (type == "memo") {
            day_data.memo = event_data["events"][date_str]
          } else {
            day_data["hasDiary"] = true;
          }
        }
      }
    }
  }
}

function set_schedule(calendars_base: ScheduleData, event_data: EventData, type: string) {
  set_schedule_sub(calendars_base.cal1, event_data, type);
  set_schedule_sub(calendars_base.cal2, event_data, type);
  set_schedule_sub(calendars_base.cal3, event_data, type);
  calendars_base.markdownFiles = event_data["others"];
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  console.log("api/schedule GET: start - ", params);
  const today_str = moment().format("YYYY-MM-DD");
  const target_date_str = params.has('target') ? params.get('target') : today_str;
  const user: string | null = params.has('user') ? params.get('user') : 'user';

  // カレンダーの日付を計算する
  console.log("today_str=", today_str, ", target_date_str=", target_date_str);
  const target_date = moment(target_date_str, "YYYY-MM-DD");
  console.log("target_date=", target_date);
  const target_month = target_date.startOf('month');
  const prev_month = target_month.clone().subtract(1, "M");
  const next_month = target_month.clone().add(1, "M");
  console.log("target_months=", prev_month, target_month, next_month);

  let calendars_data: ScheduleData = {
    "cal1": create_calendar_base(prev_month),
    "cal2": create_calendar_base(target_month),
    "cal3": create_calendar_base(next_month),
    "markdownFiles": []    
  };
  
  // {"cal1": [{"id": "week1", "caldata": [["", "", "", 0], [""...]...
  
  const holiday_file = process.env.DATA_DIRECTORY + "/" + user + "/holiday.md";
  const base_holiday_file = process.env.DATA_DIRECTORY + "/base/holiday.md";
  const holiday_data = await load_events(holiday_file, base_holiday_file);
  // {"2024-01-01": {"holiday": "元旦"}, ...}
  const private_file = process.env.DATA_DIRECTORY + "/" + user + "/private.md";
  const private_data = await load_events(private_file, null);
  
  set_schedule(calendars_data, holiday_data, "holiday");
  set_schedule(calendars_data, private_data, "memo");
  // console.log("data=", calendars_data, ", holiday_data=", holiday_data);
  // console.log("calendars_data=", calendars_data);
  const diary_check_result: EventData = await check_diary_exists(
    [
      calendars_data["cal1"]["month"],
      calendars_data["cal2"]["month"],
      calendars_data["cal2"]["month"]
    ], 
    user);
  console.log("diary_check_result=", diary_check_result);
  set_schedule(calendars_data, diary_check_result, "diary");

  const res = NextResponse.json({"scheduleData": calendars_data});
  return res;
}

