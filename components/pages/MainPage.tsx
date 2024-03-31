'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { getTodayStr, getTodayMonth } from '@/utils/dateutils';
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

import base_logger from '@/utils/logger';
const logger = base_logger.child({ filename: __filename });

export function MainPage() {
  const func_logger = logger.child({ "func": "MainPage" });
  func_logger.trace({"message": "START"});

  const { data: session, status } = useSession();
  const [ targetPage, setTargetPage ] = useState(getTodayStr());
  const [ calendarDate, setCalendarDate ] = useState(getTodayStr());
  const [ scheduleData, setScheduleData ] = useState<ScheduleData | null>(null);
  const [ searchText, setSearchText ] = useState("");
  const [ userId, setUserId ] = useState("user");

  // どこかでページが設定された際の処理
  const handleTargetPageChange = (newPage: string) => {
    const func_logger = logger.child({ "func": "MainPage.handleTargetPageChange" });
    func_logger.debug({"message": "START", "params": {"newPage": newPage}});
    //console.log("MainPage.handleTargetPageChange() START:", newPage);
    setTargetPage(String(newPage));
    //console.log("MainPage.handleTargetPageChange() END");
    func_logger.debug({"message": "END", "params": {"newPage": newPage}});
  };

  // カレンダーの日付が変更された際の処理
  const loadData = async() => {
    const func_logger = logger.child({ "func": "MainPage.loadData" });
    func_logger.debug({"message": "START"});

    const uri = encodeURI(`${process.env.BASE_PATH}/api/schedule?target=${calendarDate}`);
    const response = await fetch(uri);
    if (response.ok) {
      func_logger.debug({"message": "fetch OK"});
      let jsonData = await response.json();
      func_logger.trace({"jsonData": jsonData});
      setScheduleData(jsonData['scheduleData']);
    } else {
      func_logger.debug({"message": "fetch NG"});
    }
    func_logger.debug({"message": "END"});
  };
  
  const today_month = getTodayMonth();
  useEffect(() => {
    const func_logger = logger.child({ "func": "MainPage.useEffect[1]" });
    func_logger.debug({"message": "START"});

    if (session?.user == undefined) {
      func_logger.debug({"message": "NO SESSION"});
      return;
    }
    // データを読み込んでscheduleDataに登録する
    loadData();

    func_logger.debug({"message": "END"});
  }, [session, calendarDate]);
  
  // ページが変更されたときの処理
  useEffect(() => {
    const func_logger = logger.child({ "func": "MainPage.useEffect[2]" });
    func_logger.debug({"message": "START"});

    const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
    if (!datePattern.test(targetPage)) {
      // 日付以外のページなら今日をターゲットにする
      func_logger.debug({"message": "target is TODAY"});
      setCalendarDate(getTodayStr());
    } else {
      func_logger.debug({"message": "target is " + targetPage});
      setCalendarDate(targetPage);
    }
    func_logger.debug({"message": "END"});
  }, [targetPage]);

  // セッション情報が設定されたときの処理
  useEffect(() => {
    const func_logger = logger.child({ "func": "MainPage.useEffect[3]" });
    func_logger.debug({"message": "START"});

    setUserId(session?.user?.email || "dummy");
    if (session?.error == "refresh_access_token_error") {
      func_logger.debug({"message": "TOKEN ERROR -> signIn"});
      signIn();
    }
    func_logger.debug({"message": "END"});
  }, [session]);

  const isInvalid = useMemo(() => {
    const func_logger = logger.child({ "func": "MainPage.isInvalid" });
    func_logger.debug({"message": "START"});

    const filenameNgPattern = /[\\\/:\*\?\"<>\|]/;
    if (searchText === "") {
      func_logger.debug({"message": "END(searchText is null)", "res": false});
      return false;
    }

    const res = filenameNgPattern.test(searchText) ? true : false;
    func_logger.debug({"message": "END", "res": res});
    return res;
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

  func_logger.trace({"message": "END"});

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
              <DropdownItem className="h-14 gap-2" key="username">
                <p>Signed in as</p><p className="font-semibold">{session?.user?.name}</p>
              </DropdownItem>
              <DropdownItem color="danger" onPress={() => signOut()} key="logout">
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
          <ContentViewer targetPage={targetPage} calendarRefreshHook={calendarRefreshHook} 
            templates={scheduleData?.templates || []} />
        </div>
      </div>
    </div>
  );
}
