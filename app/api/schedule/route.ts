import { NextRequest, NextResponse } from "next/server";
import moment from "moment";
import { ScheduleData, MonthSchedule, WeekSchedule } from "@/types/schedule-data-type";
import { EventData } from "@/types/schedule-data-type";
import { mkdir, writeFile, readFile, opendir } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { build_path } from "@/lib/build-path";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

function create_calendar_base(check_month: moment.Moment): MonthSchedule {
  const func_logger = logger.child({ "func": "create_calendar_base" });
  func_logger.debug({"message": "START", "params": {"check_month": check_month}});

  const year = check_month.clone().year();
  const month = check_month.clone().month();
  const result: MonthSchedule = {
    "month": check_month.format("YYYY-MM"),
    "data": []
  }
  const start_date = check_month.clone().weekday(0);
  //console.log("start_date=", start_date, ", check_month=", month);
  let week_number = 0;
  let continue_flag = true;
  while (continue_flag) {
    const week_data: WeekSchedule = {
      "id": "week" + String(week_number),
      "caldata": []
    };
    for (let d = 0; d < 7; d ++) {
      const calc_date = start_date.clone().add(d + week_number * 7, "days");
      //const calc_date_str = calc_date.format("YYYY-MM-DD");
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
  func_logger.debug({"message": "END", "res": "..."});
  return result;
}

function parse_event_text(text: string): {[key: string]: string} {
  const func_logger = logger.child({ "func": "parse_event_text" });
  func_logger.trace({"message": "START", "params": {"text": text}});
  
  const lines: string[] = text.split("\n");
  const res: {[key: string]: string} = {}
  lines.forEach((line) => {
    const items: string[] = line.split(":");
    if (items.length == 2) {
      const date: string = items[0].trim();
      const event_text: string = items[1].trim();
      res[date] = event_text;
    }
  });
  
  func_logger.trace({"message": "END", "args": {"text": text}, "res": "..."});
  return res;
}


async function load_events(event_file: string, base_file: string | null): Promise<EventData> {
  const func_logger = logger.child({ "func": "load_events" });
  func_logger.trace({"message": "START", "params": {"event_file": event_file, "base_file": base_file}});

  // イベント設定ファイルを読み込む
  const event_data: EventData = {"events": {}, "others": [], "templates": []};
  try {
    const event_buffer = await readFile(event_file, { encoding: "utf8" });
    const event_text = event_buffer.toString();
    event_data["events"] = parse_event_text(event_text);
  } catch (e) {
    // ファイルがない場合はベースファイルから読み込み、本来のファイルに書き出す
    func_logger.trace({"message": "COPY FROM base file", "error": e});
    if (base_file != null) {
      try {
        const event_buffer = await readFile(base_file);
        const event_text = event_buffer.toString();
        await writeFile(event_file, event_text);
        event_data["events"] = parse_event_text(event_text);
      } catch (error) {
        func_logger.warn({"message": "COPY failed", "error": error});
      }
    }
  }
  func_logger.trace({"message": "END", "params": {"event_file": event_file, "base_file": base_file},
    "res": event_data});
  return event_data;
}

async function check_diary_exists(target_month_list: string[], user_id: string | null): Promise<EventData> {
  const func_logger = logger.child({ "func": "check_diary_exists" });
  func_logger.trace({"message": "START", "params": {
    "target_month_list": target_month_list,
    "user_id": user_id}});

  const event_data: EventData = {"events": {}, "others": [], "templates": []};
  try {
    const work_dir = build_path(process.env.DATA_DIRECTORY || "", user_id || "");

    const dir = await opendir(work_dir);
    const month_list = "(" + target_month_list.join("|") + ")";
    const filename_pattern_md = new RegExp("\.md$");
    const filename_pattern_cal = new RegExp("^" + month_list + "-[0-9]{2}\.md$");
    const filename_pattern_cal2 = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$");
    const filename_pattern_cal3 = new RegExp("\.template\.md$");
    
    for await (const dirent of dir) {
      func_logger.trace({"dirent.name": dirent.name});
      if (filename_pattern_md.test(dirent.name)) {
        if (filename_pattern_cal.test(dirent.name)) {
          func_logger.trace({"message": "add events", "file": dirent.name});
          const date_str = dirent.name.slice(0, 10);
          event_data["events"][date_str] = "";
        } else {
          if (filename_pattern_cal3.test(dirent.name)) {
            func_logger.trace({"message": "add template", "file": dirent.name});
            const template_name = dirent.name.slice(0, dirent.name.length - 12);
            event_data["templates"].push(template_name);
          } else if (!filename_pattern_cal2.test(dirent.name)) {
            func_logger.trace({"message": "add others", "file": dirent.name});
            event_data["others"].push(dirent.name);
          }
        }
      }
    }
  } catch (e) {
    func_logger.trace({"message": "unknown error", "error": e});
  }

  func_logger.trace({"message": "END", "params": {
    "target_month_list": target_month_list,
    "user_id": user_id},
    "event_data": event_data});
  return event_data;
}

function set_schedule_sub(target_calendar: MonthSchedule, event_data: EventData, type: string) {
  const func_logger = logger.child({ "func": "set_schedule_sub" });
  func_logger.trace({"message": "START", "params": {
    "target_calendar": "target_calendar", "event_data": "event_data", "type": type}});
  
  const month = target_calendar["month"];
  for (const week_data of target_calendar["data"]) {
    for (const day_data of week_data["caldata"]) {
      const date = day_data["date"];
      if (date != "") {
        const date_str = month + "-" + String(date).padStart(2, "0");
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
  func_logger.trace({"message": "END", "params": {
    "target_calendar": "target_calendar", "event_data": "event_data", "type": type}});
}

function set_schedule(calendars_base: ScheduleData, event_data: EventData, type: string) {
  const func_logger = logger.child({ "func": "set_schedule" });
  func_logger.trace({"message": "START", "params": {"calendars_base": "calendars_base", "event_data": "event_data", "type": type}});
  
  set_schedule_sub(calendars_base.cal1, event_data, type);
  set_schedule_sub(calendars_base.cal2, event_data, type);
  set_schedule_sub(calendars_base.cal3, event_data, type);
  event_data["others"].sort();
  calendars_base.markdownFiles = event_data["others"];
  event_data["templates"].sort();
  calendars_base.templates = event_data["templates"];
  
  func_logger.trace({"message": "END", "params": {"calendars_base": "calendars_base", "event_data": "event_data", "type": type}});
}

export async function GET(req: NextRequest) {
  const func_logger = logger.child({ "func": "GET" });
  func_logger.info({"message": "START", "params": {"req": req}});

  const session = await auth.api.getSession({ headers: await headers() });
  const params = req.nextUrl.searchParams;
  func_logger.trace({"session": session});
  if (!session) {
    func_logger.info({"message": "SESSION Invalid"});
    const res = NextResponse.json({}, {status: 401});
    func_logger.debug({"message": "END", "params": {"req": req}, "res": res});
    return res;
  }
  const user_id = session.user.id;
  const today_str = moment().format("YYYY-MM-DD");
  const target_date_str = params.has("target") ? params.get("target") : today_str;

  // func_logger.info({"message": "GET呼び出し", "target_date_str": target_date_str});
  
  // カレンダーの日付を計算する
  func_logger.trace({"today_str": today_str, "target_date_str": target_date_str});
  const target_date = moment(target_date_str, "YYYY-MM-DD");
  func_logger.trace({"target_date": target_date});
  const target_month = target_date.startOf("month");
  const prev_month = target_month.clone().subtract(1, "M");
  const next_month = target_month.clone().add(1, "M");
  func_logger.trace({"target_months": [prev_month, target_month, next_month]});

  const calendars_data: ScheduleData = {
    "cal1": create_calendar_base(prev_month),
    "cal2": create_calendar_base(target_month),
    "cal3": create_calendar_base(next_month),
    "markdownFiles": [],
    "templates": [],
  };
  
  // {"cal1": [{"id": "week1", "caldata": [["", "", "", 0], [""...]...

  const data_directory: string = process.env.DATA_DIRECTORY || "";
  const directory = build_path(process.env.DATA_DIRECTORY || "", user_id);
  func_logger.trace({"directory": directory});
  // ディレクトリを作り
  await mkdir(directory, { recursive: true });
  const holiday_file: string = build_path(data_directory, user_id) + "/holiday.md";
  const base_holiday_file = data_directory + "/base/holiday.md";
  const holiday_data = await load_events(holiday_file, base_holiday_file);
  // {"2024-01-01": {"holiday": "元旦"}, ...}
  const private_file = build_path(data_directory, user_id) + "/private.md";
  const private_data = await load_events(private_file, null);
  
  set_schedule(calendars_data, holiday_data, "holiday");
  set_schedule(calendars_data, private_data, "memo");
  // console.log("data=", calendars_data, ", holiday_data=", holiday_data);
  // console.log("calendars_data=", calendars_data);
  const diary_check_result: EventData = await check_diary_exists(
    [
      calendars_data["cal1"]["month"],
      calendars_data["cal2"]["month"],
      calendars_data["cal3"]["month"]
    ], 
    user_id);
  //console.log("diary_check_result=", diary_check_result);
  set_schedule(calendars_data, diary_check_result, "diary");

  const res = NextResponse.json({"scheduleData": calendars_data});
  func_logger.info({"message": "END", "params": {"req": req}, "res": res});
  return res;
}

