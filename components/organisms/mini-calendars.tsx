import { Button } from "@heroui/react";
import { MiniCalendar } from "@/components/molecules/mini-calendar";
import { getTodayStr, getPrevMonth, getPrevDay, getNextMonth, getNextDay } from "@/lib/dateutils";
import { ChevronsLeft, ChevronLeft, ChevronsRight, ChevronRight, House } from "lucide-react";
import { PageData } from "@/types/page-data-type";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

export function MiniCalendars(
  { pageData, setPage, hasText } : {
    pageData: PageData,
    setPage: (page: string) => void,
    hasText: boolean | null;
  }
) {
  const func_logger = logger.child({ "func": "MiniCalendars" });
  func_logger.trace({"message": "START"});
  
  const handleTargetPageChange = (newPage: string) => {
    // ページ遷移時の処理
    //console.log("MiniCalendars.handleTargetPageChange()");
    setPage(newPage);
  };

  return (
    <div className="bg-blue-50 w-53">
      <div className="p-0 m-0">
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          aria-label="prev-month"
          onPress={() => handleTargetPageChange(getPrevMonth(pageData.calendarDate))}
        ><ChevronsLeft /></Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          aria-label="prev-day"
          onPress={() => handleTargetPageChange(getPrevDay(pageData.calendarDate))}
        ><ChevronLeft /></Button>
        <Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          aria-label="today"
          onPress={() => handleTargetPageChange(getTodayStr())}
        ><House /></Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          aria-label="next-day"
          onPress={() => handleTargetPageChange(getNextDay(pageData.calendarDate))}
        ><ChevronRight/></Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          aria-label="next-month"
          onPress={() => handleTargetPageChange(getNextMonth(pageData.calendarDate))}
        ><ChevronsRight/></Button>
      </div>
      {pageData.scheduleData != null ? 
      <div className="container mx-auto">
	<MiniCalendar monthSchedule={pageData.scheduleData.cal1} handleTargetPageChange={handleTargetPageChange} calendarDate={pageData.calendarDate} hasText={hasText} />
	<MiniCalendar monthSchedule={pageData.scheduleData.cal2} handleTargetPageChange={handleTargetPageChange} calendarDate={pageData.calendarDate} hasText={hasText} />
	<MiniCalendar monthSchedule={pageData.scheduleData.cal3} handleTargetPageChange={handleTargetPageChange} calendarDate={pageData.calendarDate} hasText={hasText} />
      </div>
      :
      <div className="grid place-items-center h-full">
	準備中
      </div>
      }
    </div>
  )
}
