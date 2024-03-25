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
  { targetPage, calendarRefreshHook } : {
    targetPage: string;
    calendarRefreshHook: () => void;
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

  const userId = useMemo(() => session?.user?.email, [session]);
  
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
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown?target=${targetPage}&user=${userId}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    //console.log("json=", json_data);
    //setMarkdownText(json_data["markdown"]);
    onChange(json_data["markdown"]);
    setMode('normal');
    
    //console.log("ContentViewer.loadData: END");
  }
  
  const saveData = async(rcscommit: boolean) => {
    console.log("ContentViewer.saveData: START");
    console.log("session=", session);
    if (session == null || session == undefined || !("user" in session) || ("user" in session && session["user"] != undefined && !("email" in session["user"]))) {
      console.log("no session");
      return;
    }
    const markdown_data = {
      "user": userId,
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
  
  if (process.env.NEXT_PUBLIC_USE_RCS === "true") {
    useEffect(() => {
      const intervalTime: number = 1000 * 60; // 一分
      const intervalId = setInterval(() => {
        saveData(false);
        setTimerTime(new Date().getTime());
      }, intervalTime);
      return () => clearInterval(intervalId);
    }, []);
  }

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
                  <Button color={mode != "save" ? "primary" : "danger"}
                    size="lg" onPress={() => saveData(true)} isDisabled={mode != "normal"}>
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
