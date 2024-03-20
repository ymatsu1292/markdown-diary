import { useState, useCallback } from 'react';
import { Tabs, Tab, Card, CardBody } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import markdownit from 'markdown-it';

export function ContentViewer(
  { targetPage } : {
    targetPage: string
  }
) {
  const md = markdownit({html: true, linkify: true, typographer: true});
  const [markdownText, setMarkdownText] = useState("");
  const [markdownHtml, setMarkdownHtml] = useState("");
  const onChange = useCallback((val, viewUpdate) => {
    console.log('val:', val);
    setMarkdownText(val);
    let base_text = targetPage + "\n=====\n" + val;
    console.log('render raw:', base_text) 
    setMarkdownHtml(md.render(base_text));
  }, []);
  console.log("ContentViewer: START");
  console.log("ContentViewer: END");
  return (
    <div className="container mx-auto bg-gray-200">
      <Tabs aria-label="editor">
        <Tab key="editor" title="編集">
	  <Card>
            <CardBody>
	      <Input type="text" label="タイトル" value={targetPage} />
	      <div id="editor">
                <CodeMirror value={markdownText} height="400px" extensions={[markdown({base: markdownLanguage, codeLanguages: languages})]} onChange={onChange} />
              </div>
	    </CardBody>
          </Card>
	</Tab>
        <Tab key="viewer" title="参照">
	  <Card>
            <CardBody>
	      <div>{markdownHtml}</div>
              <div id="viewer" dangerouslySetInnerHTML={{__html: markdownHtml}}>
	      </div>
	    </CardBody>
	  </Card>
	</Tab>
      </Tabs>
    </div>
  );
}
