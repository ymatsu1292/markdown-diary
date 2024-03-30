import { NextRequest, NextResponse } from 'next/server';
import { open, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { exec } from 'child_process';
import { authOptions } from '@/app/authOptions';
import { getServerSession } from 'next-auth/next';
import { promisify } from 'node:util';

import moment from 'moment';

import base_logger from '@/components/utils/logger';
const logger = base_logger.child({ filename: __filename });

const useRcs: boolean = ("NEXT_PUBLIC_USE_RCS" in process.env)
  ? (process.env["NEXT_PUBLIC_USE_RCS"] == "true" ? true : false)
  : false;

const aexec = promisify(exec);

function build_path(base_directory: string, user_email: string) {
  const func_logger = logger.child({ "func": "build_path" });
  func_logger.debug({"message": "START"});
  func_logger.debug({"message": this});
  const words = user_email.split('@');
  let parent_dir = "common";
  let child_dir = "dummy";
  if (words.length == 1) {
    parent_dir = "common";
    child_dir = words[0];
  } else if (words.length == 2) {
    parent_dir = words[1];
    child_dir = words[0];
  }
  const res = base_directory + "/" + parent_dir + "/" + child_dir;
  func_logger.debug({"message": "END", "result": res});
  return res;
}

export async function GET(req: NextRequest) {
  logger.debug("app/api/markdown/route.ts - GET(): START");
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({}, {status: 401});
  }
  const user = session.user.email;
  
  const params = req.nextUrl.searchParams;
  const target: string = params.has('target') ? params.get('target') || "" : "";
  console.log(params, user, target);

  const directory = build_path(process.env.DATA_DIRECTORY || "", user);
  const filename = directory + "/" + target + ".md";
  
  let markdown = "";
  try {
    markdown = await readFile(filename, { encoding: "utf-8" });
  } catch (error) {
    // エラーが出ても気にしない
  }
  const res = NextResponse.json({"markdown": markdown});
  logger.debug("app/api/markdown/route.ts - GET(): END res=", res);
  return res;
}

export async function POST(req: Request) {
  logger.debug("app/api/markdown/route.ts - POST(): START");
  const session = await getServerSession(authOptions);
  console.log("session=", session);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({}, {status: 401});
  }
  const user = session.user.email;
  
  const json_data = await req.json();
  console.log(json_data);
  //const user = json_data['user'];
  const target = json_data['target'];
  const rcscommit = json_data['rcscommit']
  const markdown = json_data['markdown'];
  const directory = build_path(process.env.DATA_DIRECTORY || "", user);
  console.log("directory=", directory);
  // ディレクトリを作り
  await mkdir(directory, { recursive: true });
  //console.log("mkdir done");
  // ファイル名を作る
  const filename = directory + "/" + target + ".md";

  if (markdown != "") {
    console.log("markdown is NOT NULL");
    if (useRcs && rcscommit) {
      console.log("use RCS");
      // RCSを利用する場合は以下を実行する
      try {
        let cmd = "";
        let res;
        const dtstr = moment().format();
        // mkdir RCS
        console.log("mkdir");
        await mkdir(directory + "/RCS", { recursive: true });
        // RCS logで履歴があるかどうかをチェックする
        // 1の場合のみ新規チェックイン
        try {
          cmd = 'rlog -R ' + target + '.md';
          console.log('rlog: ', cmd);
          res = await aexec(cmd, {"cwd": directory});
          console.log('rlog: RESULT=', res);

          try {
            // 履歴が存在する場合はロックをとって書き込む
            // co -l "日時" ファイル名
            //cmd = 'co -l "' + target + '.md"'; 
            //console.log("co -l:", cmd);
            //res = await aexec(cmd, {"cwd": directory})
            // ファイルを出力する
            let fd;
            try {
              fd = await open(filename, 'w');
              fd.writeFile(markdown);
            } finally {
              await fd?.close();
            }
            // ci -m "日時" ファイル名
            cmd = 'echo . | ci -f -l -m"' + dtstr + '" "' + target + '.md"'; 
            console.log("ci:", cmd);
            res = await aexec(cmd, {"cwd": directory})
            
          } catch (err) {
            console.log("ERROR!!!:", err);
          }
          
        } catch (err) {
          // 履歴が存在しない場合は新規登録する
          try {
            // ファイルを出力する
            let fd;
            try {
              fd = await open(filename, 'w');
              fd.writeFile(markdown);
            } finally {
              await fd?.close();
            }
            // 初期登録する
            cmd = 'echo . | ci -i -l -m"' + dtstr + '" "' + target + '.md"';
            console.log('initial ci: ', cmd);
            res = await aexec(cmd, {"cwd": directory});
            console.log('initial ci: RESULT=', res)
          } catch (err) {
            console.log('initial ci: FAIL!');
          }
        }
      } finally {
      }
    } else {
      // ファイルを出力する
      let fd;
      try {
        fd = await open(filename, 'w');
        fd.writeFile(markdown);
      } finally {
        await fd?.close();
      }
    }      
  } else {
    await rm(filename, {"force": true});
  }
  const res = NextResponse.json({});
  logger.debug("app/api/markdown/route.ts - POST(): END res=", res);
  return res;
}

