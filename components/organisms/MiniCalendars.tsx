import { Button } from '@nextui-org/react';
import { MiniCalendar } from '@/components/molecules/MiniCalendar';
import { getTodayStr, getPrevMonth, getPrevDay, getNextMonth, getNextDay } from '@/components/utils/dateutils';
import { ArrowFatLeft, ArrowFatRight } from '@phosphor-icons/react';
import { ArrowFatLinesLeft, ArrowFatLinesRight } from '@phosphor-icons/react';
import { ScheduleData } from '@/components/types/scheduleDataType';

export function MiniCalendars(
  { calendarDate, scheduleData, handleTargetPageChange } : {
    calendarDate: string,
    scheduleData: ScheduleData | null,
    handleTargetPageChange: (newPage: string) => void
  }
) {
  return (
    <div className="h-dvh bg-blue-50 w-200">
      <div className="p-0 m-0">
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getPrevMonth(calendarDate))}
        ><ArrowFatLinesLeft /></Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getPrevDay(calendarDate))}
        ><ArrowFatLeft /></Button>
        <Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getTodayStr())}
        >今日</Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getNextDay(calendarDate))}
        ><ArrowFatRight/></Button>
	<Button color="primary" variant="light" size="sm" radius="sm" className="m-0 p-0 min-w-10"
          onPress={() => handleTargetPageChange(getNextMonth(calendarDate))}
        ><ArrowFatLinesRight/></Button>
      </div>
      {scheduleData != null ? 
      <div className="container mx-auto">
	<MiniCalendar monthSchedule={scheduleData.cal1} handleTargetPageChange={handleTargetPageChange} calendarDate={calendarDate} />
	<MiniCalendar monthSchedule={scheduleData.cal2} handleTargetPageChange={handleTargetPageChange} calendarDate={calendarDate} />
	<MiniCalendar monthSchedule={scheduleData.cal3} handleTargetPageChange={handleTargetPageChange} calendarDate={calendarDate} />
      </div>
      :
      <div className="grid place-items-center h-full">
	準備中
      </div>
      }
    </div>
  )
}
