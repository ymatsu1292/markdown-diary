import { Button } from '@nextui-org/react';
import { MiniCalendar } from '@/components/molecules/MiniCalendar';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { getTodayStr, getTodayMonth } from '@/components/atoms/dateutils';
import { ArrowFatLeft, ArrowFatRight } from '@phosphor-icons/react';

export function MiniCalendars(
  { calendarDate, handleTargetPageChange } : {
    calendarDate: string,
    handleTargetPageChange: (newPage: string) => void
  }
) {
  const { data: session, status } = useSession();
  const [ scheduleData, setScheduleData ] = useState(null);
  const today_month = getTodayMonth();

  useEffect(() => {
    console.log("START: MiniCalendars.useEffect session=", session);
    if (session?.user == undefined) {
      console.log("END: MiniCalendars.useEffect NO SESSION");
      return;
    }
    // データを読み込んでscheduleDataに登録する
    const data = async() => {
      console.log("STARTdata fetch");
      const uri = encodeURI(`${process.env.BASE_PATH}/api/schedule?target=${calendarDate}&user=${session?.user?.email}`)
      const response = await fetch(uri);
      if (response.ok) {
	console.log("END data fetch: OK ", response);
	let d = await response.json();
	console.log("JSON=", d);
	setScheduleData(d);
      } else {
	console.log("END data fetch: NG ", response);
      }
    }
    data();
    console.log("END: MiniCalendars.useEffect");
  }, [session, calendarDate]);
  
  return (
    <div className="h-dvh bg-blue-50 w-200">
      <div className="p-2">
	<Button color="primary" variant="bordered" size="sm" className="m-2"><ArrowFatLeft /></Button>
	<Button color="primary" variant="bordered" size="sm" className="m-2"><ArrowFatRight/></Button>
      </div>
      {scheduleData != null ? 
      <div className="container mx-auto">
	<MiniCalendar scheduleData1m={scheduleData.cal1} handleTargetPageChange={handleTargetPageChange} calendarDate={calendarDate} />
	<MiniCalendar scheduleData1m={scheduleData.cal2} handleTargetPageChange={handleTargetPageChange} calendarDate={calendarDate} />
	<MiniCalendar scheduleData1m={scheduleData.cal3} handleTargetPageChange={handleTargetPageChange} calendarDate={calendarDate} />
      </div>
      :
      <div className="grid place-items-center h-full">
	準備中
      </div>
      }
    </div>
  )
}
