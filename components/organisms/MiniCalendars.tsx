import { useState, useEffect } from 'react';
import { Button } from '@nextui-org/react';
import { MiniCalendar } from '@/components/molecules/MiniCalendar';
import { getTodayStr, getPrevMonth, getPrevDay, getNextMonth, getNextDay } from '@/utils/dateutils';
import { ArrowFatLeft, ArrowFatRight } from '@phosphor-icons/react';
import { ArrowFatLinesLeft, ArrowFatLinesRight } from '@phosphor-icons/react';
import { PageData } from '@/components/types/pageDataType';
import { ScheduleData } from '@/components/types/scheduleDataType';

import base_logger from '@/utils/logger';
const logger = base_logger.child({ filename: __filename });

export function MiniCalendars(
  { pageData, setPage } : {
    pageData: PageData,
    setPage: (page: string) => void,
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
    <div className="h-dvh bg-blue-50 w-200">
      <div className="p-0 m-0">
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getPrevMonth(pageData.calendarDate))}
        ><ArrowFatLinesLeft /></Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getPrevDay(pageData.calendarDate))}
        ><ArrowFatLeft /></Button>
        <Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getTodayStr())}
        >今日</Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getNextDay(pageData.calendarDate))}
        ><ArrowFatRight/></Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getNextMonth(pageData.calendarDate))}
        ><ArrowFatLinesRight/></Button>
      </div>
      {pageData.scheduleData != null ? 
      <div className="container mx-auto">
	<MiniCalendar monthSchedule={pageData.scheduleData.cal1} handleTargetPageChange={handleTargetPageChange} calendarDate={pageData.calendarDate} />
	<MiniCalendar monthSchedule={pageData.scheduleData.cal2} handleTargetPageChange={handleTargetPageChange} calendarDate={pageData.calendarDate} />
	<MiniCalendar monthSchedule={pageData.scheduleData.cal3} handleTargetPageChange={handleTargetPageChange} calendarDate={pageData.calendarDate} />
      </div>
      :
      <div className="grid place-items-center h-full">
	準備中
      </div>
      }
    </div>
  )
}
