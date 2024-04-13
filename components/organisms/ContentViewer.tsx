import './ContentViewer.css';

import { useState, useEffect, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import { Tabs, Tab, Card, CardBody } from '@nextui-org/react';
import { Input, Button, Link, Switch } from '@nextui-org/react';
import { Select, SelectSection, SelectItem } from '@nextui-org/react';
import { Listbox, ListboxItem } from '@nextui-org/react';
import { Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import { Textarea } from '@nextui-org/react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import markdownit from 'markdown-it';
import mdContainer from 'markdown-it-container';
import { tasklist } from '@mdit/plugin-tasklist';
import hljs from 'highlight.js';
import { useSession } from 'next-auth/react';
import { History } from '@/components/types/historyDataType';
import { PageData } from '@/components/types/pageDataType';
import { EditData } from '@/components/types/editDataType';
import { FloppyDisk } from '@phosphor-icons/react';
import { NotifyMessages } from '@/components/molecules/NotifyMessages';

import base_logger from '@/utils/logger';
const logger = base_logger.child({ filename: __filename });

export function ContentViewer(
  { dirty, pageData } : {
    dirty: MutableRefObject<boolean>;
    pageData: PageData;
  }
) {
  const func_logger = logger.child({ "func": "ContentViewer" });
  func_logger.debug({"message": "START", "params": {
    "pageData": pageData,
  }});
  const { data: session, status } = useSession();
  const [ text, setText ] = useState<string>("");
  const [ editData, setEditData ] = useState<EditData>({
    originalText: "",
    html: "",
    committed: true,
    conflicted: false, // コンフリクトしているときはoriginalTextはサーバに保存されていない状態
    timestamp: -1.0,
  });
  const [ autosave, setAutosave ] = useState<boolean>(true);
  const autosaveTimestamp = useRef<number>(new Date().getTime());
  const [ messages, setMessages ] = useState<string[]>([]);
  
  const md = markdownit({html: true, linkify: true, typographer: true, 
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }
      return '';
    }}).use(mdContainer, 'info').use(tasklist);
  const [ timerTime, setTimerTime ] = useState(new Date().getTime());
  const [ selectedTemplate, setSelectedTemplate ] = useState<string>("");
  const [ histories, setHistories ] = useState<History[]>([]);
  const [ showHistories, setShowHistories ] = useState<boolean>(false);
  const [ revisionText, setRevisionText ] = useState<string>("");

  const compareText = (serverText: string, localText: string): boolean => {
    let fixed = localText;
    if (fixed.substr(-1) !== "\n") {
      fixed = localText + "\n";
    }
    return serverText === fixed;
  };
  
  const updateEditData = (newText: string, originalUpdate: boolean, commitFlag: boolean, timestamp: number) => {
    const func_logger = logger.child({ "func": "ContentViewer.updateEditData" });
    func_logger.trace({"message": "START", "params": {"newText": newText, "originalUpdate": originalUpdate, "commitFlag": commitFlag, "timestamp": timestamp}});
    
    const base_text = pageData.title + "\n=====\n" + newText;
    const html_data = md.render(base_text);

    if (originalUpdate) {
      setText(newText);
      setEditData({...editData, originalText: newText, html: html_data, committed: commitFlag, timestamp: timestamp} as EditData);
      dirty.current = false;
    } else {
      setText(newText);
      setEditData({...editData, html: html_data, committed: commitFlag} as EditData);
      dirty.current = (newText != editData.originalText);
    }
    func_logger.trace({"dirty": dirty.current});

    func_logger.trace({"message": "END", "params": {"newText": newText, "originalUpdate": originalUpdate, "commitFlag": commitFlag}});
  }

  const onChange = useCallback((val: string) => {
    const func_logger = logger.child({ "func": "ContentViewer.onChange" });
    func_logger.trace({"message": "START", "params": {"val": val}});
    func_logger.info({"message": "onChange開始"});
    updateEditData(val, false, false, 0);
    func_logger.info({"message": "onChange終了"});
    func_logger.trace({"message": "END", "params": {"val": val}});
  }, [md, pageData.title, editData]);
  
  const checkData = async(): Promise<boolean> => {
    const func_logger = logger.child({ "func": "ContentViewer.checkData" });
    func_logger.debug({"message": "START"});
    func_logger.debug({"message": "タイムスタンプチェック", "title": pageData.title});
    
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown/text/timestamp?target=${pageData.title}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    func_logger.trace({"json_data": json_data});
    func_logger.trace({"タイムスタンプ": json_data["timestamp"]});
    const res = (editData["timestamp"] !== json_data["timestamp"]);
    
    func_logger.debug({"message": "END", "res": res});
    return res;
  };
  
  const loadData = async() => {
    const func_logger = logger.child({ "func": "ContentViewer.loadData" });
    func_logger.debug({"message": "START"});
    func_logger.info({"message": "マークダウン読み込み開始", "title": pageData.title});
    
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown/text?target=${pageData.title}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    func_logger.trace({"json_data": json_data});
    updateEditData(json_data["markdown"], true, json_data["committed"], json_data["timestamp"]);
    
    func_logger.info({"message": "マークダウン読み込み終了"});
    func_logger.debug({"message": "END"});
  }
  
  const saveData = async(rcscommit: boolean) => {
    const func_logger = logger.child({ "func": "ContentViewer.saveData" });
    func_logger.debug({"message": "START", "params": {"rcscommit": rcscommit}});
    func_logger.info({"message": "マークダウン保存開始"});

    func_logger.debug({"session": session});
    if (session === null) {
      func_logger.debug({
        "message": "END", 
        "params": {"rcscommit": rcscommit},
        "res": "no session"
      });
      return;
    }

    let tmpText = text;
    if (tmpText.substr(-1) !== "\n") {
      tmpText = text + "\n";
      setText(tmpText);
    }
    const markdown_data = {
      "target": pageData.title,
      "rcscommit": rcscommit,
      "markdown": tmpText,
      "original": editData.originalText,
      "timestamp": editData.timestamp,
    };
    func_logger.trace({ "markdown_data": markdown_data });
    const response = await fetch(`${process.env.BASE_PATH}/api/markdown/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markdown_data),
    })
    if (response.ok) {
      const res = await response.json();
      const committed = res["committed"];
      const timestamp = res["timestamp"];
      const conflicted = res["conflicted"];
      func_logger.trace({ "message": "POST OK", "response": response, "res": res });
      if (conflicted) {
        // コンフリクトした場合はオリジナルは書き換えない
        console.log("コンフリクトした");
        setEditData({...editData, committed: committed, timestamp: timestamp, conflicted: conflicted});
        console.log("text", text)
        console.log("orig", editData.originalText)
        setMessages(["他の画面から更新されたため自動保存を停止しています"]);
      } else {
        console.log("コンフリクトしてない");
        setEditData({...editData, originalText: tmpText, committed: committed, timestamp: timestamp, conflicted: conflicted});
        console.log("text", text)
        console.log("orig", tmpText)
        setMessages([]);
      }
      dirty.current = false;
      if (showHistories) {
        getHistories(false);
      }
    }

    func_logger.info({"message": "マークダウン保存終了"});
    func_logger.debug({"message": "END", "params": {"rcscommit": rcscommit}});
  };

  const getHistories = async(showToggle: boolean = true) => {
    const func_logger = logger.child({ "func": "ContentViewer.getHistories" });
    func_logger.debug({"message": "START"});

    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown/history?target=${pageData.title}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    func_logger.trace({"json_data": json_data});
    setHistories(json_data['histories']);
    if (showToggle) {
      setShowHistories(true);
    }
    
    func_logger.debug({"message": "END"});
  };

  const appendTemplate = async() => {
    const func_logger = logger.child({ "func": "ContentViewer.appendTemplate" });
    func_logger.debug({"message": "START"});
    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown/template?target=${selectedTemplate}`);
    const result = await fetch(uri);
    const json_data = await result.json();

    let tmpText;
    if (text.substr(-1) === "\n") {
      tmpText = text + json_data["template"];
    } else {
      tmpText = text + "\n" + json_data["template"];
    }
    updateEditData(tmpText, false, false, 0);
    
    func_logger.debug({"message": "END", "json_data": json_data});
  };

  const getHistoryDetail = async(revision: string) => {
    const func_logger = logger.child({ "func": "ContentViewer.getHistoryDetail" });
    func_logger.debug({"message": "START"});

    const uri = encodeURI(`${process.env.BASE_PATH}/api/markdown/history?target=${pageData.title}&revision=${revision}`);
    const result = await fetch(uri);
    const json_data = await result.json();
    func_logger.trace({"json_data": json_data});
    setRevisionText(json_data['text']);
    
    func_logger.debug({"message": "END"});
  };

  const appendHistoryDetail = async() => {
    const func_logger = logger.child({ "func": "ContentViewer.appendHistoryDetail" });
    func_logger.debug({"message": "START"});

    let new_text;
    if (text.substr(-1) === "\n") {
      new_text = text + revisionText;
    } else {
      new_text = text + "\n" + revisionText;
    }
    updateEditData(new_text, false, false, 0);
    
    func_logger.debug({"message": "END"});
  }
  
  const replaceHistoryDetail = async() => {
    const func_logger = logger.child({ "func": "ContentViewer.replaceHistoryDetail" });
    func_logger.debug({"message": "START"});

    updateEditData(revisionText, false, false, 0);
    
    func_logger.debug({"message": "END"});
  }
  
  useEffect(() => {
    (async() => {
      const func_logger = logger.child({ "func": "ContentViewer.useEffect[1]" });
      func_logger.debug({"message": "START"});
      func_logger.info({"message": "ページかセッションが更新された", "targetPage": pageData.title});
      
      if (session != null) {
        func_logger.debug({"message": "DO loadData()"});
        await loadData();
        //setHistories([] as History[]);
        setShowHistories(false);
      } else {
        func_logger.debug({"message": "SKIP loadData()"});
      }
      func_logger.debug({"message": "END"});
      func_logger.info({"message": "ページ情報読み込み完了", "targetPage": pageData.title});
    })()
  }, [pageData.title, session]);

  // タイマー時刻が更新された際にデータをチェックまたは保存する
  useEffect(() => {
    (async() => {
      const func_logger = logger.child({ "func": "ContentViewer.useEffect[2]" });
      func_logger.debug({"message": "START"});
      func_logger.trace({"message": "タイマーチェック/保存"});

      if (editData.timestamp < 0.0) {
        // 読み込み前なのでなにもしない
        func_logger.trace({"message": "データ読み込み前なので何もしない"});
        return;
      }

      if (!autosave) {
        func_logger.trace({"message": "オートセーブでない場合は保存しない"});
        return;
      }

      if (editData.conflicted) {
        func_logger.info({"message": "コンフリクトしている場合は保存しない"});
        console.log("text", text);
        console.log("orig", editData.originalText);
        return;
      }

      if (process.env.NEXT_PUBLIC_USE_RCS === "true") {
        if (await checkData()) {
          // 変更されていた場合
          func_logger.trace({"message": "サーバ側変更あり"});
          if (editData.originalText != text) {
            // ローカルでも変更されていたら保存(マージ)する
            func_logger.trace({"message": "クライアント側でも側変更あり->保存(マージ)実行"});
            func_logger.debug({"message": "DO autosave by timer"});
            await saveData(false);
          } else {
            func_logger.trace({"message": "クライアント側では変更ないがマージ実行"});
            await saveData(false);
          }
        }
        const nowTimestamp = new Date().getTime();
        if (nowTimestamp - autosaveTimestamp.current > 60 * 1000) {
          autosaveTimestamp.current = nowTimestamp;
          // 保存間隔を超えていて、書き換えていた場合は保存する
          func_logger.info({"message": "保存実行間隔超過"});
          if (editData.originalText != text) {
            func_logger.trace({"message": "保存実行"});
            await saveData(false);
          } else {
            func_logger.trace({"message": "保存スキップ"});
          }
        }
      }
      
      func_logger.debug({"message": "END"});
    })()
  }, [timerTime]);
  
  // 定期的にタイマー時刻を更新する
  useEffect(() => {
    const func_logger = logger.child({ "func": "ContentViewer.useEffect[3]" });
    func_logger.debug({"message": "START"});
    
    if (process.env.NEXT_PUBLIC_USE_RCS === "true") {
      func_logger.debug({"message": "SET interval timer for autosave"});
      const intervalTime: number = 1000 * 10; // 10秒
      const intervalId = setInterval(() => {
        func_logger.debug({"message": "DO interval timer for autosave"});
        setTimerTime(new Date().getTime());
      }, intervalTime);
      return () => clearInterval(intervalId);
    }
    
    func_logger.debug({"message": "END"});
  }, []);
  
  func_logger.debug({"message": "END", "params": {
    "targetPage": pageData.title, 
  }});

  return (
    <div className="container mx-auto">
      <Tabs aria-label="editor">
        <Tab key="editor" title="編集" className="flex">
          <Card className="grow">
            <CardBody>
              <div className="flex">
                <div className="grow">
                  <Input type="text" label="タイトル" value={pageData.title} />
                </div>
                <div className="flex min-w-60">
                  {(pageData.scheduleData != null && pageData.scheduleData?.templates != null && pageData.scheduleData.templates.length > 0) ?
                    <>
                      <Select label="テンプレート" className="ml-2 min-w-40"
                        selectionMode="single"
                        onSelectionChange={(keys) => {
                          let keylist: React.Key[] = [...keys];
                          func_logger.trace({"keylist": keylist});
                          keylist.length === 0 ? setSelectedTemplate("") : setSelectedTemplate(keylist[0] as string);
                        }}
                        selectedKeys={[selectedTemplate]} 
                      >
                        {pageData.scheduleData.templates.map((template) => (
                          <SelectItem key={template} value={template}>
                            {template}
                          </SelectItem>
                        ))}
                      </Select>
                      <Button color="primary" className="ml-2 h-full" size="sm"
                        isDisabled={selectedTemplate === "" ? true : false}
                        onPress={() => {
                          appendTemplate();
                        }}
                      >
                        テンプレ<br/>取込
                      </Button>
                    </>
                    :
                    <></>
                  }
                  <Button color="primary" className="ml-1 h-full"
                    isDisabled={!editData.conflicted && compareText(editData.originalText, text)}
                    size="sm" onPress={() => loadData()}>
                    リセット
                  </Button>

                  {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
                    <Switch
                      isSelected={autosave}
                      onValueChange={setAutosave}
                      size="lg"
                      className="ml-1 h-full"
                      startContent={<FloppyDisk />}
                      endContent={<FloppyDisk />}
                      isDisabled={editData.conflicted}
                    />
                    :
                    <></>
                  }
                  <Button color={(!editData.conflicted && compareText(editData.originalText, text)) ? "primary": "danger"} className="ml-0 h-full"
                    size="sm" onPress={() => saveData(false)}>
                    保存
                  </Button>
                  {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
                    <Button color={editData.committed ? "primary" : "danger"} className="ml-1 h-full"
                      size="sm" onPress={() => saveData(true)}>
                      {process.env.NEXT_PUBLIC_USE_RCS === "true" ? "コミット" : "保存"}
                    </Button>
                    :
                    <></>
                  }
                </div>
              </div>
              <div id="editor">
                <CodeMirror value={text} height="640px"
                  onChange={onChange} 
                />
              </div>
            </CardBody>
          </Card>
          {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
            <>
              <Card className={showHistories ? "visible" : "hidden"}>
                <CardBody>
                  <div>
                    バージョン一覧
                    <Link rel="me" onPress={() => setShowHistories(false)}>　》</Link>
                    <hr className="mt-2"/>
                    <div className="m-0">
                      <Listbox aria-label="history-list" className="m-0 p-0">
                        {histories && histories.map((history: History) => 
                          <ListboxItem key={history["revision"]} aria-label={history["revision"]}
                            endContent={<span>{history["revision"]}</span>}
                            className="m-0 p-0">
                            <Popover placement="left" className="m-0 p-0" size="lg"
                              onOpenChange={() => getHistoryDetail(history.revision)}>
                              <PopoverTrigger className="m-0 p-0">
                                <Button className="m-0 p-0" variant="light">
                                  {history["datetime"]}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <div>
                                  <Button className="m-1 p-1" onPress={() => appendHistoryDetail()}>取込</Button>
                                  <Button className="m-1 p-1" onPress={() => replaceHistoryDetail()}>差替</Button>
                                  <Textarea className="w-[600px]" minRows={10} value={revisionText}
                                    isReadOnly />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </ListboxItem>
                        )}
                      </Listbox>
                    </div>
                  </div>
                </CardBody>
              </Card>
              <Card className={showHistories ? "hidden" : "visible"}>
                <CardBody>
                  <div><Link rel="me" onPress={() => getHistories()}>《</Link></div>
                </CardBody>
              </Card>
            </>
            :
            <></>
          }
        </Tab>
        <Tab key="viewer" title="参照">
          <Card>
            <CardBody>
              <div className="flex">
                <div className="grow" />
                <div className="flex">
                  {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
                    <Switch
                      isSelected={autosave}
                      onValueChange={setAutosave}
                      size="lg"
                      className="ml-1 h-full"
                      startContent={<FloppyDisk />}
                      endContent={<FloppyDisk />}
                      disabled={editData.conflicted}
                    />
                    :
                    <></>
                  }
                  <Button color={compareText(editData.originalText, text) ? "primary": "danger"} className="ml-0 h-full"
                    size="sm" onPress={() => saveData(false)}>
                    保存
                  </Button>
                  {process.env.NEXT_PUBLIC_USE_RCS === "true" ?
                    <Button color={editData.committed ? "primary" : "danger"} className="ml-1 h-full"
                      size="sm" onPress={() => saveData(true)}>
                      {process.env.NEXT_PUBLIC_USE_RCS === "true" ? "コミット" : "保存"}
                    </Button>
                    :
                    <></>
                  }
                </div>
              </div>
              <div className="markdown-body"
                dangerouslySetInnerHTML={{__html: editData.html}}>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
      <NotifyMessages messages={messages} />
    </div>
  );
}
