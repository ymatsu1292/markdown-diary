'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { getTodayStr, getTodayMonth } from '@/components/utils/dateutils';
import { MiniCalendars } from '@/components/organisms/MiniCalendars';
import { MarkdownFileList } from '@/components/organisms/MarkdownFileList';
import { ContentViewer } from '@/components/organisms/ContentViewer';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/react";
import { Link, Button, Input } from "@nextui-org/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { Book, List } from '@phosphor-icons/react';
import { Tabs, Tab } from '@nextui-org/react';
import { Listbox, ListboxSection, ListboxItem } from '@nextui-org/react';
import { ScheduleData } from '@/components/types/scheduleDataType';

export function MainPage() {
  //console.log("MainPage: START");
  const { data: session, status } = useSession();
  const [ targetPage, setTargetPage ] = useState(getTodayStr());
  const [ calendarDate, setCalendarDate ] = useState(getTodayStr());
  const [ scheduleData, setScheduleData ] = useState<ScheduleData | null>(null);
  const [ searchText, setSearchText ] = useState("");
  const [ userId, setUserId ] = useState("user");

  // どこかでページが設定された際の処理
  const handleTargetPageChange = (newPage: string) => {
    //console.log("MainPage.handleTargetPageChange() START:", newPage);
    setTargetPage(String(newPage));
    //console.log("MainPage.handleTargetPageChange() END");
  };

  // カレンダーの日付が変更された際の処理
  const loadData = async() => {
    //console.log("STARTdata fetch");
    const uri = encodeURI(`${process.env.BASE_PATH}/api/schedule?target=${calendarDate}`);
    const response = await fetch(uri);
    if (response.ok) {
      //console.log("END data fetch: OK ", response);
      let jsonData = await response.json();
      //console.log("JSON=", jsonData);
      setScheduleData(jsonData['scheduleData']);
    } else {
      //console.log("END data fetch: NG ", response);
    }
  };
  
  const today_month = getTodayMonth();
  useEffect(() => {
    //console.log("START: MiniCalendars.useEffect session=", session);
    if (session?.user == undefined) {
      //console.log("END: MiniCalendars.useEffect NO SESSION");
      return;
    }
    // データを読み込んでscheduleDataに登録する
    loadData();
    //console.log("END: MiniCalendars.useEffect");
  }, [session, calendarDate]);
  
  // ページが変更されたときの処理
  useEffect(() => {
    const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
    if (!datePattern.test(targetPage)) {
      // 日付以外のページなら今日をターゲットにする
      setCalendarDate(getTodayStr());
    } else {
      setCalendarDate(targetPage);
    }
  }, [targetPage]);

  // セッション情報が設定されたときの処理
  useEffect(() => {
    setUserId(session?.user?.email || "dummy");
    //console.log("MainPage.useEffect: START");
    if (session?.error == "refresh_access_token_error") {
      signIn();
    }
    //console.log("MainPage.useEffect: END");
  }, [session]);

  const isInvalid = useMemo(() => {
    const filenameNgPattern = /[\\\/:\*\?\"<>\|]/;
    console.log(searchText);
    if (searchText === "") return false;
    return filenameNgPattern.test(searchText) ? true : false;
  }, [searchText]);
  
  const doSearchIfNecessary = (key: string, page: string) => {
    if (key == 'Enter' && !isInvalid) {
      // ページを設定する
      setTargetPage(page);
    }
  };

  const calendarRefreshHook = async () => {
    await loadData();
  };

  //console.log("MainPage: END");
  return (
    <div>
      <Navbar position="sticky" height="3rem" isBordered className="bg-blue-200 min-w-fit mx-auto">
        <NavbarBrand key="a">
          <Link href={process.env.NEXT_PUBLIC_BASE_URL} color="foreground">
            <Book size={24} /><p className="font-bold text-inherit mx-1">Markdown Diary</p>
          </Link>
        </NavbarBrand>
        <NavbarContent className="sm:flex gap-2" justify="center" key="b">
          <NavbarItem key="search">
            <Input type="search" size="sm" placeholder="ページ名" value={searchText} onKeyPress={(e) => {
              if (e.target instanceof HTMLInputElement) {
                doSearchIfNecessary(e.key, e.target.value);
              }
            }}
              onValueChange={setSearchText}
              isInvalid={isInvalid} errorMessage={isInvalid && "ファイル名に使えない文字が含まれています"}
              color={isInvalid ? "danger" : "default"}
              className="max-w-xs"
            />
          </NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light"><List size={24}/></Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile" variant="flat">
              <DropdownItem className="h-14 gap-2">
                <p>Signed in as</p><p className="font-semibold">{session?.user?.name}</p>
              </DropdownItem>
              <DropdownItem color="danger" onPress={() => signOut()}>
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>
      <div className="flex">
        <div className="flex-basis-220">
          <Tabs>
            <Tab key="calendar" title={<div className="flex items-center space-x-2"><span>カレンダー</span></div>}>
              <MiniCalendars calendarDate={calendarDate} scheduleData={scheduleData} handleTargetPageChange={handleTargetPageChange} />
            </Tab>
            <Tab key="files" title={<div className="flex items-center space-x-2"><span>ファイル</span></div>}>
              <MarkdownFileList scheduleData={scheduleData} handleTargetPageChange={handleTargetPageChange} />
            </Tab>
          </Tabs>
        </div>
        <div className="grow">
          <ContentViewer targetPage={targetPage} calendarRefreshHook={calendarRefreshHook} userId={userId} />
        </div>
      </div>
    </div>
  );
}
