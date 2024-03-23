import { Button } from '@nextui-org/react';
import { MiniCalendar } from '@/components/molecules/MiniCalendar';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { getTodayStr, getTodayMonth, getPrevMonth, getPrevDay, getNextMonth, getNextDay } from '@/components/atoms/dateutils';
import { ArrowFatLeft, ArrowFatRight } from '@phosphor-icons/react';
import { ArrowFatLinesLeft, ArrowFatLinesRight } from '@phosphor-icons/react';
import { ScheduleData } from '@/components/atoms/scheduleDataType';

export function MiniCalendars(
  { calendarDate, handleTargetPageChange } : {
    calendarDate: string,
    handleTargetPageChange: (newPage: string) => void
  }
) {
  const { data: session, status } = useSession();
  const [ scheduleData, setScheduleData ] = useState<ScheduleData | null>(null);
  const today_month = getTodayMonth();

  useEffect(() => {
    //console.log("START: MiniCalendars.useEffect session=", session);
    if (session?.user == undefined) {
      //console.log("END: MiniCalendars.useEffect NO SESSION");
      return;
    }
    // データを読み込んでscheduleDataに登録する
    const data = async() => {
      //console.log("STARTdata fetch");
      const uri = encodeURI(`${process.env.BASE_PATH}/api/schedule?target=${calendarDate}&user=${session?.user?.email}`);
      const response = await fetch(uri);
      if (response.ok) {
	//console.log("END data fetch: OK ", response);
	let jsonData = await response.json();
	//console.log("JSON=", jsonData);
	setScheduleData(jsonData['scheduleData']);
      } else {
	//console.log("END data fetch: NG ", response);
      }
    }
    data();
    //console.log("END: MiniCalendars.useEffect");
  }, [session, calendarDate]);
  
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
