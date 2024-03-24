import { useState, useEffect, useCallback } from 'react';
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
  { targetPage } : {
    targetPage: string
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
  const [mode, setMode] = useState("normal");
  const [markdownText, setMarkdownText] = useState("");
  const [markdownHtml, setMarkdownHtml] = useState("");
  
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
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown?target=${targetPage}&user=${session?.user?.email}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    //console.log("json=", json_data);
    //setMarkdownText(json_data["markdown"]);
    onChange(json_data["markdown"]);
    setMode('normal');
    
    //console.log("ContentViewer.loadData: END");
  }
  
  const saveData = async() => {
    //console.log("ContentViewer.saveData: START");
    //console.log("session=", session);
    const markdown_data = {
      "user": session?.user?.email,
      "target": targetPage,
      "markdown": markdownText
    };
    setMode('save');
    await fetch(`${process.env.BASE_PATH}/api/markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markdown_data),
    })
      .then((response) => response.json())
      .then((data) => {
        //console.log(data);
        setMode('normal');
      })
      .catch((error) => {
        setMode('normal');
      });
    //console.log("ContentViewer.saveData: END");
  };

  useEffect(() => {
  
    //console.log("ContentViewer.useEffect(): START");
    if (session != null) {
      loadData();
    }
    //console.log("ContentViewer.useEffect(): END");
  }, [targetPage, session]);
  
  return (
    <div className="container mx-auto bg-gray-200">
      <Tabs aria-label="editor">
        <Tab key="editor" title="編集">
          <Card>
            <CardBody>
              <div className="flex">
                <div className="grow">
                  <Input type="text" label="タイトル" value={targetPage} />
                </div>
                <div className="flex-none">
                  <Button color="primary" size="lg" onPress={() => saveData()} isDisabled={mode != "normal"}>
                    保存
                  </Button>
                </div>
              </div>
              <div id="editor">
                <CodeMirror value={markdownText} height="400px"
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
