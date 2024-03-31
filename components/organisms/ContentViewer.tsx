import styles from './ContentViewer.module.css';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, Tab, Card, CardBody } from '@nextui-org/react';
import { Input, Button } from '@nextui-org/react';
import { Select, SelectSection, SelectItem } from '@nextui-org/react';
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
  { targetPage, calendarRefreshHook, templates } : {
    targetPage: string;
    calendarRefreshHook: () => void;
    templates: string[];
  }
) {
  const func_logger = logger.child({ "func": "ContentViewer" });
  func_logger.debug({"message": "START", "params": {
    "targetPage": targetPage, 
    "calendarRefreshHook": calendarRefreshHook,
    "templates": templates
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
  const [ selectedTemplate, setSelectedTemplate ] = useState<string>("");

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
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown/text?target=${targetPage}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    func_logger.trace({"json_data": json_data});
    onChange(json_data["markdown"]);
    setMode('normal');
    setDirty(false);
    
    func_logger.debug({"message": "END"});
  }
  
  const saveData = async(rcscommit: boolean) => {
    const func_logger = logger.child({ "func": "ContentViewer.saveData" });
    func_logger.debug({"message": "START", "params": {"rcscommit": rcscommit}});

    func_logger.debug({"session": session});
    if (session == null) {
      func_logger.debug({
        "message": "END", 
        "params": {"rcscommit": rcscommit},
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
    const response = await fetch(`${process.env.BASE_PATH}/api/markdown/text`, {
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

    func_logger.debug({"message": "END", "params": {"rcscommit": rcscommit}});
  };

  const getHistory = async() => {
    const func_logGer = logger.child({ "func": "ContentViewer.getHistory" });
    func_logger.debug({"message": "START"});

    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown/history?target=${targetPage}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    func_logger.info({"json_data": json_data});
    
    func_logger.debug({"message": "END"});
  }

  const appendTemplate = async() => {
    const func_logger = logger.child({ "func": "ContentViewer.appendTemplate" });
    func_logger.debug({"message": "START"});
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown/template?target=${selectedTemplate}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    setMarkdownText(prev => {
      if (prev.substr(-1) == "\n") {
        return prev + json_data["template"];
      } else {
        return prev + "\n" + json_data["template"];
      }
    });
    
    func_logger.debug({"message": "END", "json_data": json_data});
  }
  
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
      saveData(false);
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
  
  func_logger.debug({"message": "END", "params": {
    "targetPage": targetPage, 
    "calendarRefreshHook": calendarRefreshHook,
    "templates": templates
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
                <div className="flex min-w-60 w-60">
                  <Select label="テンプレート" className="ml-2"
                    selectionMode="single"
                    onSelectionChange={(keys) => {
                      let keylist: React.Key[] = [...keys];
                      func_logger.trace({"keylist": keylist});
                      keylist.length == 0 ? setSelectedTemplate("") : setSelectedTemplate(keylist[0] as string);
                    }}
                    selectedKeys={[selectedTemplate]} >
                    {templates != null ? templates.map((template) => (
                      <SelectItem key={template} value={template}>
                        {template}
                      </SelectItem>
                    ))
                      :
                      <></>
                    }
                  </Select>
                  <Button color="primary" className="ml-2 h-full" size="sm"
                    isDisabled={selectedTemplate === "" ? true : false}
                    onPress={() => {
                      console.log("onPress!");
                      appendTemplate();
                    }}
                  >
                    追記
                  </Button>
                </div>
                <div className="flex-none">
                  {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
                    <>
                      <Button color={mode != "save" ? "primary" : "danger"} className="ml-2"
                        size="sm" onPress={() => getHistory()} isDisabled={mode != "normal"}>
                        履歴
                      </Button>
                      <Button color={dirty ? "danger" : "primary"} className="ml-2 h-full"
                        size="sm" onPress={() => saveData(false)} isDisabled={mode != "normal"}>
                        保存
                      </Button>
                    </>
                    : 
                    <></>
                  }
                  <Button color={mode != "save" ? "primary" : "danger"} className="ml-2 h-full"
                    size="sm" onPress={() => saveData(true)} isDisabled={mode != "normal"}>
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
                      <Button color={mode != "save" ? "primary" : "danger"} className="ml-2"
                        size="sm" onPress={() => getHistory()} isDisabled={mode != "normal"}>
                        履歴
                      </Button>
                      <Button color={dirty ? "danger" : "primary"} className="ml-2"
                        size="sm" onPress={() => saveData(false)} isDisabled={mode != "normal"}>
                        保存
                      </Button>
                    </>
                    : 
                    <></>
                  }
                  <Button color={mode != "save" ? "primary" : "danger"} className="ml-2"
                    size="sm" onPress={() => saveData(true)} isDisabled={mode != "normal"}>
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
