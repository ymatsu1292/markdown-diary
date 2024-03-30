import styles from './ContentViewer.module.css';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, Tab, Card, CardBody } from '@nextui-org/react';
import { Input, Button } from '@nextui-org/react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import markdownit from 'markdown-it';
import mdContainer from 'markdown-it-container';
import { tasklist } from '@mdit/plugin-tasklist';
import hljs from 'highlight.js';
import { useSession } from 'next-auth/react';

import base_logger from '@/utils/logger';
const logger = base_logger.child({ filename: __filename });

export function ContentViewer(
  { targetPage, calendarRefreshHook, userId } : {
    targetPage: string;
    calendarRefreshHook: () => void;
    userId: string;
  }
) {
  const func_logger = logger.child({ "func": "ContentViewer" });
  func_logger.trace({"message": "START", "params": {
    "targetPage": targetPage, 
    "calendarRefreshHook": calendarRefreshHook,
    "userId": userId
  }});
  const { data: session, status } = useSession();
  const md = markdownit({html: true, linkify: true, typographer: true, 
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }
      return '';
    }}).use(mdContainer, 'info').use(tasklist);
  const [ mode, setMode ] = useState("normal");
  const [ markdownText, setMarkdownText ] = useState("");
  const [ markdownHtml, setMarkdownHtml ] = useState("");
  const [ timerTime, setTimerTime ] = useState(new Date().getTime());
  const [ dirty, setDirty ] = useState<boolean>(false);

  const onChange = useCallback((val: string) => {
    const func_logger = logger.child({ "func": "ContentViewer.onChange" });
    func_logger.trace({"message": "START", "params": {"val": val}});
    
    setMarkdownText(val);
    let base_text = targetPage + "\n=====\n" + val;
    setMarkdownHtml(md.render(base_text));
    setDirty(true);

    func_logger.trace({"message": "END", "params": {"val": val}});
  }, [md, targetPage]);

  const loadData = async() => {
    const func_logger = logger.child({ "func": "ContentViewer.loadData" });
    func_logger.debug({"message": "START"});
    
    setMode('load');
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown?target=${targetPage}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    func_logger.trace({"json_data": json_data});
    onChange(json_data["markdown"]);
    setMode('normal');
    setDirty(false);
    
    func_logger.debug({"message": "END"});
  }
  
  const saveData = async(rcscommit: boolean, userId: string | undefined | null) => {
    const func_logger = logger.child({ "func": "ContentViewer.saveData" });
    func_logger.debug({"message": "START", "params": {"rcscommit": rcscommit, "userId": userId}});

    func_logger.debug({"session": session});
    if (session == null && userId == null) {
      func_logger.debug({
        "message": "END", 
        "params": {"rcscommit": rcscommit, "userId": userId},
        "res": "no session"
      });
      return;
    }
    const markdown_data = {
      "target": targetPage,
      "rcscommit": rcscommit,
      "markdown": markdownText
    };
    func_logger.trace({ "markdown_data": markdown_data });
    setMode('save');
    const response = await fetch(`${process.env.BASE_PATH}/api/markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markdown_data),
    })
    if (response.ok) {
      func_logger.trace({ "message": "POST OK", "response": response });
      calendarRefreshHook();
    }
    setDirty(false);
    setMode('normal');

    func_logger.debug({"message": "END", "params": {"rcscommit": rcscommit, "userId": userId}});
  };

  useEffect(() => {
    const func_logger = logger.child({ "func": "ContentViewer.useEffect[1]" });
    func_logger.debug({"message": "START"});
    
    if (session != null) {
      func_logger.debug({"message": "DO loadData()"});
      loadData();
    } else {
      func_logger.debug({"message": "SKIP loadData()"});
    }
    func_logger.debug({"message": "END"});
  }, [targetPage, session]);

  // タイマー時刻が更新された際にデータを保存する
  useEffect(() => {
    const func_logger = logger.child({ "func": "ContentViewer.useEffect[2]" });
    func_logger.debug({"message": "START"});
    
    if (process.env.NEXT_PUBLIC_USE_RCS === "true") {
      func_logger.debug({"message": "DO autosave by timer"});
      saveData(false, session?.user?.email);
    }
    
    func_logger.debug({"message": "END"});
  }, [timerTime]);
  
  // 定期的にタイマー時刻を更新する
  useEffect(() => {
    const func_logger = logger.child({ "func": "ContentViewer.useEffect[3]" });
    func_logger.debug({"message": "START"});
    
    if (process.env.NEXT_PUBLIC_USE_RCS === "true") {
      func_logger.debug({"message": "SET interval timer for autosave"});
      const intervalTime: number = 1000 * 60; // 一分
      const intervalId = setInterval(() => {
        func_logger.debug({"message": "DO interval timer for autosave"});
        setTimerTime(new Date().getTime());
      }, intervalTime);
      return () => clearInterval(intervalId);
    }
    
    func_logger.debug({"message": "END"});
  }, []);
  
  func_logger.trace({"message": "END", "params": {
    "targetPage": targetPage, 
    "calendarRefreshHook": calendarRefreshHook,
    "userId": userId
  }});
  
  return (
    <div className="container mx-auto">
      <Tabs aria-label="editor">
        <Tab key="editor" title="編集">
          <Card>
            <CardBody>
              <div className="flex">
                <div className="grow">
                  <Input type="text" label="タイトル" value={targetPage} />
                </div>
                <div className="flex-none ml-2">
                  {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
                    <>
                      {/* 履歴機能ができるまではいったんコメントアウト
                      <Button color={mode != "save" ? "primary" : "danger"} className="ml-2"
                        size="sm" isDisabled={mode != "normal"}>
                        履歴
                      </Button>
                        */}
                      <Button color={dirty ? "danger" : "primary"} className="ml-2"
                        size="sm" onPress={() => saveData(false, session?.user?.email)} isDisabled={mode != "normal"}>
                        保存
                      </Button>
                    </>
                    : 
                    <></>
                  }
                  <Button color={mode != "save" ? "primary" : "danger"} className="ml-2"
                    size="sm" onPress={() => saveData(true, session?.user?.email)} isDisabled={mode != "normal"}>
                    {process.env.NEXT_PUBLIC_USE_RCS === "true" ? "コミット" : "保存"}
                  </Button>
                </div>
              </div>
              <div id="editor">
                <CodeMirror value={markdownText} height="640px"
                  extensions={[markdown({base: markdownLanguage, codeLanguages: languages})]}
                  onChange={onChange} 
                />
              </div>
            </CardBody>
          </Card>
        </Tab>
        <Tab key="viewer" title="参照">
          <Card>
            <CardBody>
              <div className="flex">
                <div className="grow" />
                <div className="flex-none ml-2">
                  {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
                    <>
                      {/* 履歴機能ができるまでいったんコメントアウト
                      <Button color={mode != "save" ? "primary" : "danger"} className="ml-2"
                        size="sm" onPress={() => saveData(true, session?.user?.email)} isDisabled={mode != "normal"}>
                        履歴
                      </Button>
                        */}
                      <Button color={dirty ? "danger" : "primary"} className="ml-2"
                        size="sm" onPress={() => saveData(false, session?.user?.email)} isDisabled={mode != "normal"}>
                        保存
                      </Button>
                    </>
                    : 
                    <></>
                  }
                  <Button color={mode != "save" ? "primary" : "danger"} className="ml-2"
                    size="sm" onPress={() => saveData(true, session?.user?.email)} isDisabled={mode != "normal"}>
                    {process.env.NEXT_PUBLIC_USE_RCS === "true" ? "コミット" : "保存"}
                  </Button>
                </div>
              </div>
              <div className="markdown-body" id="viewer"
                dangerouslySetInnerHTML={{__html: markdownHtml}}>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
