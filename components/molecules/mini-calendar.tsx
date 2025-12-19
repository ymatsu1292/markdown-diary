import { Table, TableHeader, TableColumn ,TableBody, TableRow, TableCell } from "@heroui/react";
import { Link, Tooltip } from "@heroui/react";
import { getTodayStr } from "@/lib/dateutils";
import { MonthSchedule, WeekSchedule, DaySchedule } from "@/types/schedule-data-type";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

export function MiniCalendar(
  { monthSchedule, handleTargetPageChange, calendarDate } : {
    monthSchedule: MonthSchedule,
    handleTargetPageChange: (newPage: string) => void,
    calendarDate: string,
  }
) {
  const func_logger = logger.child({ "func": "MiniCalendar" });
  func_logger.trace({"message": "START", "params": {
    "monthSchedule": monthSchedule,
    "handleTargetPageChange": handleTargetPageChange,
    "calendarDate": calendarDate
  }});
  
  func_logger.trace({"monthSchedule": monthSchedule});
  const weekday_color = ["bg-red-200", "", "", "", "", "", "bg-blue-200"];

  const changePage = (dateStr: string) => {
    func_logger.trace({"changePage": dateStr});
    handleTargetPageChange(dateStr);
  };
  
  const calcCellColor = (daySchedule: DaySchedule, count: number, otherMonth: boolean): string => {
    let color = weekday_color[count];
    if (otherMonth) {
      return "";
    }
    if (daySchedule.holiday != "")  {
      color = "bg-red-200";
    }
    if (daySchedule.memo != "") {
      color = "bg-yellow-200";
    }
    return color;
  };
  
  const drawCell = (daySchedule: DaySchedule, monthStr: string, todayStr: string, weekday: number, calendarDate: string) => {
    const func_logger = logger.child({ "func": "MiniCalendar.drawCell" });
    func_logger.trace({"message": "START"})

    let fontStyle = "font-normal";
    //console.log(todayStr);
    let dateStr: string = monthStr + "-" + String(daySchedule.date).padStart(2, "0");
    //console.log("drawCell: START ", calendarDate, dateStr);
    let key: string = dateStr;
    let otherMonth: boolean = false;
    if (daySchedule.date == "") {
      key = "dummy-" + String(weekday);
      otherMonth = true;
    }
    //console.log("drawCell.dateStr=", dateStr);
    if (todayStr == dateStr) {
      fontStyle = "font-black";
    }
    if (calendarDate == dateStr) {
      fontStyle = "font-black text-red-900";
    }
    let linkType: "none" | "always" = "none";
    if (daySchedule.hasDiary) {
      linkType = "always";
    }
    //console.log("drawCell.dateStr=", dateStr);
    let res0 = <Link data-date={dateStr} size="sm" rel="me" color="foreground" underline={linkType}
                 data-focus-visible={false}
                 className={fontStyle} onPress={(e) => {
                   if (e.target instanceof HTMLElement) {
                     changePage(String(e.target.dataset.date));
                   }
                 }}>
                 {daySchedule.date}
               </Link>;
    let res1 = res0;
    if (daySchedule.holiday !="" || daySchedule.memo != "") {
      let message = daySchedule.holiday;
      if (daySchedule.holiday == "") {
	message = daySchedule.memo;
      } else if (daySchedule.memo != "") {
	message = daySchedule.holiday + "/" + daySchedule.memo;
      }
      res1 = <Tooltip showArrow={true} content={message}>{res0}</Tooltip>;
    }
    //console.log("res1=", res1);
    //console.log("drawCell: END");
    let res2 = <TableCell key={weekday} className={`m-0 p-0 text-center ${calcCellColor(daySchedule, weekday, otherMonth)}`}>{res1}</TableCell>;
    func_logger.trace({"message": "END", "res": res2})
    return res2;
  }
  const todayStr = getTodayStr();
  
  func_logger.trace({"message": "END", "params": {
    "monthSchedule": monthSchedule,
    "handleTargetPageChange": handleTargetPageChange,
    "calendarDate": calendarDate
  }});
  
  return (
    <div className="mini-calendar m-0 p-1">
      <Table aria-label="cal-aria1" table-fixed isCompact radius="sm" className="mx-1 my-0 px-1 py-0 gap-0"
        topContent=<span className="h-1 gap-0 m-0 p-0 text-center text-sm">{monthSchedule.month}</span>>
	<TableHeader className="m-0 p-0 gap-0 h-6">
	  <TableColumn className="m-0 p-0 h-6 text-center"><span className="text-red-900">日</span></TableColumn>
	  <TableColumn className="m-0 p-0 h-6 text-center">月</TableColumn>
	  <TableColumn className="m-0 p-0 h-6 text-center">火</TableColumn>
	  <TableColumn className="m-0 p-0 h-6 text-center">水</TableColumn>
	  <TableColumn className="m-0 p-0 h-6 text-center">木</TableColumn>
	  <TableColumn className="m-0 p-0 h-6 text-center">金</TableColumn>
	  <TableColumn className="m-0 p-0 h-6 text-center"><span className="text-blue-900">土</span></TableColumn>
	</TableHeader>
	<TableBody>
	  {monthSchedule.data.map((item: WeekSchedule) => (
            <TableRow key={item.id} data-focus-visible={false}>
	    {item.caldata.map((daySchedule: DaySchedule, count: number) => 
  	      drawCell(daySchedule, monthSchedule.month, todayStr, count, calendarDate)
            )}
	    </TableRow>
          ))}
	</TableBody>
      </Table>
    </div>
  );
};

