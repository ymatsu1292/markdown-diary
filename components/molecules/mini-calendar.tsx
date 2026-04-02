import { Table } from "@heroui/react";
import { Link, Tooltip } from "@heroui/react";
import { getTodayStr } from "@/lib/dateutils";
import { MonthSchedule, WeekSchedule, DaySchedule } from "@/types/schedule-data-type";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

export function MiniCalendar(
  { monthSchedule, handleTargetPageChange, calendarDate, hasText } : {
    monthSchedule: MonthSchedule,
    handleTargetPageChange: (newPage: string) => void,
    calendarDate: string,
    hasText: boolean | null;
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
    const regex = /^\[([a-z]*)\](.*)$/;
    const m = regex.exec(daySchedule.memo);
    if (m != null) {
      color = "bg-" + m[1] + "-200";
    }
    return color;
  };
  
  const drawCell = (daySchedule: DaySchedule, monthStr: string, todayStr: string, weekday: number, calendarDate: string) => {
    const func_logger = logger.child({ "func": "MiniCalendar.drawCell" });
    func_logger.trace({"message": "START"})

    let fontStyle = "font-normal";
    //console.log(todayStr);
    const dateStr: string = monthStr + "-" + String(daySchedule.date).padStart(2, "0");
    //console.log("drawCell: START ", calendarDate, dateStr);
    //let key: string = dateStr;
    let otherMonth: boolean = false;
    if (daySchedule.date == "") {
      //key = "dummy-" + String(weekday);
      otherMonth = true;
    }
    //console.log("drawCell.dateStr=", dateStr);
    if (todayStr == dateStr) {
      fontStyle = "font-black";
    }
    if (calendarDate == dateStr) {
      fontStyle = "font-black text-red-900";
    }
    let linkType: string = "no-underline";
    if (daySchedule.hasDiary) {
      linkType = "underline underline-offset-2 decoration-red-900";
    }
    if (calendarDate == dateStr) {
      //console.log("calendarDate==dateStr hasText=", hasText);
      if (hasText == null) {
        if (daySchedule.hasDiary) {
          linkType = "underline underline-offset-2 decoration-red-900";
        }
      } else if (hasText) {
        linkType = "underline underline-offset-2 decoration-red-900";
      }
    }
    const styleType: string = "border-none " + fontStyle + " " + linkType;
    //console.log("drawCell.dateStr=", dateStr);
    const res0 = <Link data-date={dateStr} rel="me"
                 data-focus-visible={false}
                 className={styleType} onPress={(e) => {
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
        const memo = daySchedule.memo;
        message = memo.replace(/^\[[a-z]*\]/, "");
      } else if (daySchedule.memo != "") {
	message = daySchedule.holiday + "/" + daySchedule.memo;
      }
      res1 = <Tooltip><Tooltip.Trigger>{res0}</Tooltip.Trigger><Tooltip.Content>{message}</Tooltip.Content></Tooltip>;
    }
    //console.log("res1=", res1);
    //console.log("drawCell: END");
    const res2 = <Table.Cell key={weekday} className={`border-none text-xs m-0 p-0 text-center ${calcCellColor(daySchedule, weekday, otherMonth)} rounded-none`}>{res1}</Table.Cell>;
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
    <div className="mini-calendar m-1 p-1 rounded bg-white">
      <span className="flex items-center justify-center gap-0 m-0 p-0 text-center text-sm">{monthSchedule.month}</span>
      <Table aria-label="cal-aria1" className="mx-0 my-0 px-1 py-0 gap-0 rounded-none bg-white">
        <Table.ScrollContainer>
          <Table.Content aria-label="mini-cal-content">
	    <Table.Header className="m-0 p-0 gap-0 h-6">
	      <Table.Column isRowHeader className="m-0 p-0 h-6 text-center"><span className="text-red-900">日</span></Table.Column>
	      <Table.Column className="m-0 p-0 h-6 text-center">月</Table.Column>
	      <Table.Column className="m-0 p-0 h-6 text-center">火</Table.Column>
	      <Table.Column className="m-0 p-0 h-6 text-center">水</Table.Column>
	      <Table.Column className="m-0 p-0 h-6 text-center">木</Table.Column>
	      <Table.Column className="m-0 p-0 h-6 text-center">金</Table.Column>
	      <Table.Column className="m-0 p-0 h-6 text-center"><span className="text-blue-900">土</span></Table.Column>
	    </Table.Header>
	    <Table.Body>
	      {monthSchedule.data.map((item: WeekSchedule) => (
                <Table.Row key={item.id} data-focus-visible={false}>
	          {item.caldata.map((daySchedule: DaySchedule, count: number) => 
  	            drawCell(daySchedule, monthSchedule.month, todayStr, count, calendarDate)
                  )}
	        </Table.Row>
              ))}
	    </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
};

