"use client";

import Script from "next/script";
import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { Tabs } from "@heroui/react";
import { getTodayStr } from "@/lib/dateutils";
import { MiniCalendars } from "@/components/organisms/mini-calendars";
import { MarkdownFileList } from "@/components/organisms/markdown-file-list";
import { GrepResultList } from "@/components/organisms/grep-result-list";
import { ContentViewer } from "@/components/organisms/content-viewer";
import { PageData } from "@/types/page-data-type";
import { ScheduleData } from "@/types/schedule-data-type";
import { MdNavbar } from "@/components/organisms/md-navbar";

export function MainPage() {
  const { data: session } = useSession();
  const [ activeTab, setActiveTab ] = useState("calendar");
  const [ pageData, setPageData ] = useState<PageData>({
    title: getTodayStr(),
    calendarDate: getTodayStr(),
    scheduleData: null,
    grepText: "",
    grepResults: [],
  });
  const [ hasText, setHasText ] = useState<boolean | null>(null);
  const dirty = useRef<boolean>(false);

  // カレンダーの日付が変更された際の処理
  const loadSchedule = async(targetDate: string): Promise<ScheduleData | null> => {
    //console.log("loadSchedule開始");
    //const func_logger = logger.child({ "func": "MainPage.loadData" });
    //func_logger.debug({"message": "START"});

    let res = null;
    
    const uri = encodeURI(process.env.NEXT_PUBLIC_BASE_PATH + `/api/schedule?target=${targetDate}`);
    const response = await fetch(uri);
    if (response.ok) {
      //func_logger.debug({"message": "fetch OK"});
      const jsonData = await response.json();
      //func_logger.trace({"jsonData": jsonData});
      res = jsonData["scheduleData"];
    } else {
      //func_logger.debug({"message": "fetch NG"});
    }
    //func_logger.debug({"message": "END"});
    //console.log("loadSchedule終了");
    return res;
  };

  // 検索実施時の処理
  const doSearch = (
    searchText: string,
  ) => {
    (async () => {
      const uri = encodeURI(process.env.NEXT_PUBLIC_BASE_PATH + `/api/search?target=${searchText}`);
      const response = await fetch(uri);
      if (response.ok) {
        const jsonData = await response.json();
        setPageData({...pageData, grepText: searchText, grepResults: jsonData["grepResults"]});
      }
    })();
  };

  const setPage = (
    newTitle: string,
  ) => {
    //console.log("setPage開始");
    (async () => {
      //const func_logger = logger.child({ "func": "MainPage.setPage" });
      //func_logger.debug({"message": "START"});
      //func_logger.info({"message": "START", "dirty.current": dirty.current});
    
      if (dirty.current && newTitle != pageData.title) {
        const answer = window.confirm("ページを移動してもよろしいですか?")
        if (!answer) {
          return
        }
      }
      
      const newPageData = {
        title: pageData.title,
        calendarDate: pageData.calendarDate,
        scheduleData: pageData.scheduleData,
        grepText: pageData.grepText,
        grepResults: pageData.grepResults,
      }
      //func_logger.info({"newPageData": newPageData});
      
      const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
      if (datePattern.test(newTitle)) {
        //func_logger.debug({"message": "target is " + newTitle});
        newPageData["title"] = newTitle;
        newPageData["calendarDate"] = newTitle;
        //setPageData({...pageData, title: newTitle, calendarDate: newTitle});
      } else {
        // 日付以外のページなら今日をターゲットにする
        //func_logger.debug({"message": "target is TODAY"});
        newPageData["title"] = newTitle;
        newPageData["calendarDate"] = getTodayStr();
        //setPageData({...pageData, title: newTitle, calendarDate: getTodayStr()});
      }
      const sched = await loadSchedule(newPageData["calendarDate"]);
      newPageData["scheduleData"] = sched;
      //func_logger.info({"pageData": newPageData});
      setPageData(newPageData);
      setHasText(null);
      
      if (session?.user == undefined) {
        //func_logger.debug({"message": "NO SESSION"});
        return;
      }
      //func_logger.debug({"message": "END"});
    })();
    //console.log("setPage終了");
  }

  useEffect(() => {
    async function doSetPage() {
      setPage(getTodayStr());
    }
    doSetPage();
    // eslint-disable-next-line
  }, []);
  
  const doSearchIfNecessary = async (key: string, searchText: string) => {
    if (key == "Enter") {
      setActiveTab("grep");
      doSearch(searchText);
    }
  };
  const goPageIfNecessary = async (key: string, page: string) => {
    if (key == "Enter") {
      // ページを設定する
      setPage(page);
    }
  };
  
  return (
    <div>
      <MdNavbar doSearchIfNecessary={doSearchIfNecessary} goPageIfNecessary={goPageIfNecessary} />
      <div className="flex">
        <div>
          <Tabs className="w-full max-w-md text-center gap-0"
            selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
            <Tabs.ListContainer className="mt-1">
              <Tabs.List aria-label="disp" className="w-fit *:w-fit *:text-sm *:px-3">
                <Tabs.Tab id="calendar">カレンダー<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id="files">ファイル<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id="search">検索<Tabs.Indicator /></Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id="calendar" className="pt-1">
              <MiniCalendars
                pageData={pageData}
                setPage={setPage}
                hasText={hasText}
              />
            </Tabs.Panel>
            <Tabs.Panel id="files" className="pt-1">
              <MarkdownFileList pageData={pageData} setPage={setPage} />
            </Tabs.Panel>
            <Tabs.Panel id="search" className="pt-1">
              <GrepResultList pageData={pageData} setPage={setPage} />
            </Tabs.Panel>
          </Tabs>
        </div>
        <div className="grow">
          <ContentViewer
            dirtyRef={dirty}
            pageData={pageData}
            hasText={hasText}
            setHasText={setHasText}
          />
        </div>
      </div>
      <Script src="https://cdn.jsdelivr.net/combine/npm/markdown-it@12/dist/markdown-it.min.js,npm/markdown-it-container@3/dist/markdown-it-container.min.js" />
    </div>
  );
}
