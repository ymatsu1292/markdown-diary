import { Table, TableHeader, TableColumn ,TableBody, TableRow, TableCell } from '@nextui-org/react';
import { Link, Tooltip } from '@nextui-org/react';

export function MiniCalendar(
  { scheduleData1m, handleTargetPageChange, calendarDate } : {
    scheduleData1m: any,
    handleTargetPageChange: (newPage: string) => void,
    calendarDate: string,
  }
) {
  console.log("MiniCalendar: START");
  console.log("scheduleData1m:", scheduleData1m);
  const weekday_color = ["bg-red-200", "", "", "", "", "", "bg-blue-200"];

  const changePage = (dateStr) => {
    console.log("changePage: dateStr=", dateStr);
    console.log("changePage: target=", dateStr.target);
    console.log("handleTargetPageChange=", handleTargetPageChange);
    handleTargetPageChange(dateStr);
  };
  
  const calcCellColor = (values: any[], count: number): string => {
    //console.log("calcCellColor: START");
    //console.log("values=", values);
    //console.log("count=", count);
    //console.log("calcCellColor: END");
    let color = weekday_color[count];
    if (values.length > 0 && values[1] != "") {
      color = "bg-red-200";
    }
    if (values.length > 0 && values[2] != "") {
      color = "bg-yellow-200";
    }
    return color;
  };
  
  const drawCell = (values: any[], monthStr: string, todayStr: string, weekday: number): JSX.Element => {
    //console.log("drawCell: START");
    let fontStyle = "font-normal";
    //console.log(todayStr);
    let dateStr: string = monthStr + "-" + String(values[0]).padStart(2, "0");
    let key: string = dateStr;
    if (values[0] == "") {
      key = "dummy-" + String(weekday);
    }
    //console.log("drawCell.dateStr=", dateStr);
    if (todayStr == dateStr) {
      fontStyle = "font-black";
    }
    let linkType: "none" | "always" = "none";
    if (values[3] == 1) {
      linkType = "always";
    }
    //console.log("drawCell.dateStr=", dateStr);
    let res0 = <Link data-date={dateStr} size="sm" href="#" color="foreground" underline={linkType} className={fontStyle} onPress={(e) => changePage(e.target.dataset.date)}>{values[0]}</Link>;
    let res1 = res0;
    if (values[1] !="" || values[2] != "") {
      let message = values[1];
      if (values[1] == "") {
	message = values[2];
      } else if (values[2] != "") {
	message = values[1] + "/" + values[2];
      }
      res1 = <Tooltip showArrow={true} content={message}>{res0}</Tooltip>;
    }
    //console.log("res1=", res1);
    //console.log("drawCell: END");
    return res1;
  }
  const todayStr = "2024-02-05";
  console.log("MiniCalendar: END - ", scheduleData1m);
  
  return (
    <div>
      <Table aria-label="cal-aria1" isCompact className="m-1 p-1" topContent=<div className="text-center text-sm">2024-02</div>>
	<TableHeader>
	  <TableColumn className="m-0 p-0 text-center"><span className="text-red-900">日</span></TableColumn>
	  <TableColumn className="m-0 p-0 text-center">月</TableColumn>
	  <TableColumn className="m-0 p-0 text-center">火</TableColumn>
	  <TableColumn className="m-0 p-0 text-center">水</TableColumn>
	  <TableColumn className="m-0 p-0 text-center">木</TableColumn>
	  <TableColumn className="m-0 p-0 text-center">金</TableColumn>
	  <TableColumn className="m-0 p-0 text-center"><span className="text-blue-900">土</span></TableColumn>
	</TableHeader>
	<TableBody>
	  {scheduleData1m.data.map((item) => (
            <TableRow key={item.id}>
	    {item.caldata.map((values, count) => (
	      <TableCell key={item.id + "-" + count} className={`m-0 p-0 text-center ${calcCellColor(values, count)}`}>
  	        {drawCell(values, scheduleData1m.month, todayStr, count)}
	      </TableCell>
	    ))}
	    </TableRow>
          ))}
	</TableBody>
      </Table>
    </div>
  );
};

