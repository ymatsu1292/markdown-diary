import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment';
import { ScheduleData, MonthSchedule, WeekSchedule, DaySchedule } from '@/components/atoms/scheduleDataType';
import { EventData, EventItem } from '@/components/atoms/scheduleDataType';

function create_calendars_base(check_month: any): MonthSchedule {
  const year = check_month.clone().year();
  const month = check_month.clone().month();
  let result: MonthSchedule = {
    "month": check_month.format("YYYY-MM"),
    "data": []
  }
  let start_date = check_month.clone().weekday(0);
  console.log("start_date=", start_date, ", check_month=", month);
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
      //console.log("calc_date=", calc_date, ", calc_date_str=", calc_date_str, ", month=", month, ", calc_date.month()=", calc_date.month(), ", continue_flag=", continue_flag);
    }
    result["data"].push(week_data);
    week_number += 1;
  }
  console.log(result);
  return result;
}

function load_data(calc_month: string): EventData {
  let eventData: EventData = {events: []}
  return eventData
}

function set_schedule(calendars_base: ScheduleData, schedule: EventData) {
  return calendars_base;
}

export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  console.log("api/schedule GET: start - ", params);
  const today_str = moment().format("YYYY-MM-DD");
  const target_date_str = params.has('target') ? params.get('target') : today_str;

  // カレンダーの日付を計算する
  console.log("today_str=", today_str, ", target_date_str=", target_date_str);
  const target_date = moment(target_date_str, "YYYY-MM-DD");
  console.log("target_date=", target_date);
  const target_month = target_date.startOf('month');
  const prev_month = target_month.clone().subtract(1, "M");
  const next_month = target_month.clone().add(1, "M");
  console.log("target_months=", prev_month, target_month, next_month);

  let calendars_base: ScheduleData = {
    "cal1": create_calendars_base(prev_month),
    "cal2": create_calendars_base(target_month),
    "cal3": create_calendars_base(next_month)
  };
  
  // {"cal1": [{"id": "week1", "caldata": [["", "", "", 0], [""...]...
  
  const schedule = load_data(String(target_month));
  // {"2024-01-01": [true, "元旦"], "2024-01-02": [false, None], ...}
  
  const data = set_schedule(calendars_base, schedule);
  console.log("data=", data);

  // const data = {
  //   "cal1": {
  //     "month": "2024-02",
  //     "data": [
  // 	{
  // 	  "id": "week1",
  //         "caldata": [
  // 	    ["", "", "", 0],
  // 	    ["", "", "", 0],
  // 	    ["", "", "", 0],
  // 	    ["", "", "", 0],
  // 	    ["1", "", "", 0],
  // 	    ["2", "", "", 1],
  // 	    ["3", "", "", 1],
  // 	  ],
  // 	},
  // 	{
  // 	  "id": "week2",
  //         "caldata": [
  // 	    ["4", "", "", 0],
  // 	    ["5", "", "", 0],
  // 	    ["6", "", "", 0],
  // 	    ["7", "", "", 0],
  // 	    ["8", "", "", 0],
  // 	    ["9", "", "", 1],
  // 	    ["10", "", "", 1],
  // 	  ],
  // 	},
  // 	{
  // 	  "id": "week3",
  // 	  "caldata": [
  // 	    ["11", "建国記念の日", "", 0],
  // 	    ["12", "振替休日", "", 0],
  // 	    ["13", "", "", 0],
  // 	    ["14", "テスト", "メモ1", 0],
  // 	    ["15", "", "メモ2", 0],
  // 	    ["16", "", "", 0],
  // 	    ["17", "", "", 0],
  // 	  ],
  // 	},
  //     ],
  //   },
  //   "cal2": {
  //     "month": "2024-03",
  //     "data": [
  // 	{
  // 	  "id": "week1",
  //         "caldata": [
  // 	    ["", "", "", 0],
  // 	    ["", "", "", 0],
  // 	    ["", "", "", 0],
  // 	    ["", "", "", 0],
  // 	    ["1", "", "", 0],
  // 	    ["2", "", "", 1],
  // 	    ["3", "", "", 1],
  // 	  ],
  // 	},
  // 	{
  // 	  "id": "week2",
  //         "caldata": [
  // 	    ["4", "", "", 0],
  // 	    ["5", "", "", 0],
  // 	    ["6", "", "", 0],
  // 	    ["7", "", "", 0],
  // 	    ["8", "", "", 0],
  // 	    ["9", "", "", 1],
  // 	    ["10", "", "", 1],
  // 	  ],
  // 	},
  // 	{
  // 	  "id": "week3",
  // 	  "caldata": [
  // 	    ["11", "建国記念の日", "", 0],
  // 	    ["12", "振替休日", "", 0],
  // 	    ["13", "", "", 0],
  // 	    ["14", "テスト", "メモ1", 0],
  // 	    ["15", "", "メモ2", 0],
  // 	    ["16", "", "", 0],
  // 	    ["17", "", "", 0],
  // 	  ],
  // 	},
  //     ]
  //   },
  // };

  const res = NextResponse.json({"scheduleData": data});
  return res;
}

