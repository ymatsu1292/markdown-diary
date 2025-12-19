"use client";

import Script from "next/script";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import { getTodayStr, getTodayMonth } from "@/lib/dateutils";
import { MiniCalendars } from "@/components/organisms/mini-calendars";
import { MarkdownFileList } from "@/components/organisms/markdown-file-list";
import { ContentViewer } from "@/components/organisms/content-viewer";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { Link, Button, Input } from "@heroui/react";
import { Card, CardBody } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@heroui/react";
import { Book, List } from "lucide-react";
import { Tabs, Tab } from "@heroui/react";
import { Listbox, ListboxSection, ListboxItem } from "@heroui/react";
import { PageData } from "@/types/page-data-type";
import { ScheduleData } from "@/types/schedule-data-type";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

export function MainPage() {
  const func_logger = logger.child({ "func": "MainPage" });
  func_logger.trace({"message": "START"});

  const { data: session } = useSession();
  const [ pageData, setPageData ] = useState<PageData>({
    title: getTodayStr(),
    calendarDate: getTodayStr(),
    scheduleData: null,
  });
  const [ searchText, setSearchText ] = useState<string>("");
  const [ userId, setUserId ] = useState("user");
  const dirty = useRef<boolean>(false);

  const today_month = getTodayMonth();
  
  // カレンダーの日付が変更された際の処理
  const loadSchedule = async(targetDate: string): Promise<ScheduleData | null> => {
    //console.log("loadSchedule開始");
    const func_logger = logger.child({ "func": "MainPage.loadData" });
    func_logger.debug({"message": "START"});

    let res = null;
    
    const uri = encodeURI(`/api/schedule?target=${targetDate}`);
    const response = await fetch(uri);
    if (response.ok) {
      func_logger.debug({"message": "fetch OK"});
      let jsonData = await response.json();
      func_logger.trace({"jsonData": jsonData});
      res = jsonData["scheduleData"];
    } else {
      func_logger.debug({"message": "fetch NG"});
    }
    func_logger.debug({"message": "END"});
    //console.log("loadSchedule終了");
    return res;
  };
  
  // ページが変更されたときの処理
  const setPage = (
    newTitle: string, 
  ) => {
    //console.log("setPage開始");
    (async () => {
      const func_logger = logger.child({ "func": "MainPage.setPage" });
      func_logger.debug({"message": "START"});
      func_logger.info({"message": "START", "dirty.current": dirty.current});
    
      if (dirty.current && newTitle != pageData.title) {
        const answer = window.confirm("ページを移動してもよろしいですか?")
        if (!answer) {
          return
        }
      }
      
      let newPageData = {
        title: pageData.title,
        calendarDate: pageData.calendarDate,
        scheduleData: pageData.scheduleData,
      }
      func_logger.info({"newPageData": newPageData});
      
      const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
      if (datePattern.test(newTitle)) {
        func_logger.debug({"message": "target is " + newTitle});
        newPageData["title"] = newTitle;
        newPageData["calendarDate"] = newTitle;
        //setPageData({...pageData, title: newTitle, calendarDate: newTitle});
      } else {
        // 日付以外のページなら今日をターゲットにする
        func_logger.debug({"message": "target is TODAY"});
        newPageData["title"] = newTitle;
        newPageData["calendarDate"] = getTodayStr();
        //setPageData({...pageData, title: newTitle, calendarDate: getTodayStr()});
      }
      let sched = await loadSchedule(newPageData["calendarDate"]);
      newPageData["scheduleData"] = sched;
      //func_logger.info({"pageData": newPageData});
      setPageData(newPageData);
      
      if (session?.user == undefined) {
        func_logger.debug({"message": "NO SESSION"});
        return;
      }
      func_logger.debug({"message": "END"});
    })();
    //console.log("setPage終了");
  }

  // セッション情報が設定されたときの処理
  useEffect(() => {
    const func_logger = logger.child({ "func": "MainPage.useEffect[3]" });
    func_logger.debug({"message": "START"});

    // if (session?.error == "refresh_access_token_error") {
    //   func_logger.debug({"message": "TOKEN ERROR -> signIn"});
    //   signIn();
    // }
    
    if (userId != session?.user?.email) {
      setUserId(session?.user?.email || "dummy");
      setPage(getTodayStr());
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
  
  const doSearchIfNecessary = async (key: string, page: string) => {
    if (key == "Enter" && !isInvalid) {
      // ページを設定する
      setPage(page);
    }
  };

  //console.log(pageData);

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
          <NavbarItem key="menu">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly variant="light" title="menu"><List size={24}/></Button>
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
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <div className="flex">
        <div className="flex-basis-220">
          <Tabs>
            <Tab key="calendar" title={<div className="flex items-center space-x-2"><span>カレンダー</span></div>}>
              <MiniCalendars
                pageData={pageData}
                setPage={setPage} />
            </Tab>
            <Tab key="files" title={<div className="flex items-center space-x-2"><span>ファイル</span></div>}>
              <MarkdownFileList pageData={pageData} setPage={setPage} />
            </Tab>
          </Tabs>
        </div>
        <div className="grow">
          <ContentViewer
            dirty={dirty}
            pageData={pageData}
          />
        </div>
      </div>
      <Script src="https://cdn.jsdelivr.net/combine/npm/markdown-it@12/dist/markdown-it.min.js,npm/markdown-it-container@3/dist/markdown-it-container.min.js" />
    </div>
  );
}
