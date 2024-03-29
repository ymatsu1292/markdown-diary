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

export function ContentViewer(
  { targetPage, calendarRefreshHook, userId } : {
    targetPage: string;
    calendarRefreshHook: () => void;
    userId: string;
  }
) {
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
    //console.log('val:', val);
    setMarkdownText(val);
    let base_text = targetPage + "\n=====\n" + val;
    //console.log('render raw:', base_text) 
    setMarkdownHtml(md.render(base_text));
  }, [md, targetPage]);

  const loadData = async() => {
    //console.log("ContentViewer.loadData: START");
    setMode('load');
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown?target=${targetPage}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    //console.log("json=", json_data);
    //setMarkdownText(json_data["markdown"]);
    onChange(json_data["markdown"]);
    setMode('normal');
    
    //console.log("ContentViewer.loadData: END");
  }
  
  const saveData = async(rcscommit: boolean, userId: string | undefined | null) => {
    console.log("ContentViewer.saveData: START");
    console.log("session=", session);
    if (session == null && userId == null) {
      console.log("no session");
      return;
    }
    const markdown_data = {
      "target": targetPage,
      "rcscommit": rcscommit,
      "markdown": markdownText
    };
    console.log("markdown_data=", markdown_data);
    setMode('save');
    const response = await fetch(`${process.env.BASE_PATH}/api/markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markdown_data),
    })
    if (response.ok) {
      //let jsonData = await response.json();
      calendarRefreshHook();
    }
    setMode('normal');
    //console.log("ContentViewer.saveData: END");
  };

  useEffect(() => {
    //console.log("ContentViewer.useEffect(): START");
    if (session != null) {
      loadData();
    }
    //console.log("ContentViewer.useEffect(): END");
  }, [targetPage, session]);

  // タイマー時刻が更新された際にデータを保存する
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_RCS === "true") {
      console.log("タイマーによるsave起動");
      saveData(false, session?.user?.email);
    }
  }, [timerTime]);
  
  // 定期的にタイマー時刻を更新する
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_RCS === "true") {
      const intervalTime: number = 1000 * 60; // 一分
      const intervalId = setInterval(() => {
        console.log("タイマー時刻更新");
        setTimerTime(new Date().getTime());
      }, intervalTime);
      return () => clearInterval(intervalId);
    }
  }, []);
  
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
                <div className="flex-none">
                  {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
                    <>
                      <Button color={dirty ? "danger" : "primary"}
                        size="sm" isDisabled>
                        要書込
                      </Button>
                        
                      <Button color={mode != "save" ? "primary" : "danger"} className="m-2"
                        size="sm" onPress={() => saveData(true, session?.user?.email)} isDisabled={mode != "normal"}>
                        履歴
                      </Button>
                    </>
                    : 
                    <></>
                  }
                  <Button color={mode != "save" ? "primary" : "danger"}
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
