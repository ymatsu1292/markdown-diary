import { NextRequest, NextResponse } from 'next/server';
import { open, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { exec } from 'child_process';
import { authOptions } from '@/app/authOptions';
import { getServerSession } from 'next-auth/next';
import { promisify } from 'node:util';
import { build_path } from '@/utils/buildPath';

import moment from 'moment';

import base_logger from '@/utils/logger';
const logger = base_logger.child({ filename: __filename });

const useRcs: boolean = ("NEXT_PUBLIC_USE_RCS" in process.env)
  ? (process.env["NEXT_PUBLIC_USE_RCS"] == "true" ? true : false)
  : false;

const aexec = promisify(exec);

export async function GET(req: NextRequest) {
  const func_logger = logger.child({ "func": "GET" });
  func_logger.trace({"message": "START"});
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({}, {status: 401});
  }
  const user = session.user.email;
  
  const params = req.nextUrl.searchParams;
  const target: string = params.has('target') ? params.get('target') || "" : "";
  func_logger.debug({"params": params, "user": user, "target": target});

  const directory = build_path(process.env.DATA_DIRECTORY || "", user);
  const filename = directory + "/" + target + ".md";
  
  let markdown = "";
  try {
    markdown = await readFile(filename, { encoding: "utf-8" });
  } catch (error) {
    // エラーが出ても気にしない
    func_logger.debug({"message": "IGNORE ERROR", "error": error})
  }
  const res = NextResponse.json({"markdown": markdown});
  func_logger.debug({"message": "END", "res": res});
  return res;
}

export async function POST(req: Request) {
  const func_logger = logger.child({ "func": "POST" });
  func_logger.debug({"message": "START"});
  const session = await getServerSession(authOptions);
  func_logger.trace({"session": session});
  if (!session || !session.user || !session.user.email) {
    const res = NextResponse.json({}, {status: 401});
    func_logger.trace({"message": "no session", "res": res});
    return res;
  }
  const user = session.user.email;
  
  const json_data = await req.json();
  func_logger.trace({"json_data": json_data});
  const target = json_data['target'];
  const rcscommit = json_data['rcscommit']
  const markdown = json_data['markdown'];
  const directory = build_path(process.env.DATA_DIRECTORY || "", user);
  func_logger.trace({"directory": directory});
  // ディレクトリを作り
  await mkdir(directory, { recursive: true });
  //console.log("mkdir done");
  // ファイル名を作る
  const filename = directory + "/" + target + ".md";

  if (markdown != "") {
    func_logger.trace({"message": "markdown is NOT NULL"});
    if (useRcs && rcscommit) {
      func_logger.trace({"message": "use RCS"});
      // RCSを利用する場合は以下を実行する
      try {
        let cmd = "";
        let res;
        const dtstr = moment().format();
        // mkdir RCS
        func_logger.trace({"message": "mkdir"});
        await mkdir(directory + "/RCS", { recursive: true });
        // RCS logで履歴があるかどうかをチェックする
        // 1の場合のみ新規チェックイン
        try {
          cmd = 'rlog -R ' + target + '.md';
          func_logger.trace({"command": cmd, "message": "exec"});
          res = await aexec(cmd, {"cwd": directory});
          func_logger.trace({"command": cmd, "res": res});

          try {
            // ファイルを出力する
            let fd;
            try {
              func_logger.trace({"message": "write file"});
              fd = await open(filename, 'w');
              fd.writeFile(markdown);
            } finally {
              await fd?.close();
            }
            // ci -m "日時" ファイル名
            cmd = 'echo . | ci -f -l -m"' + dtstr + '" "' + target + '.md"'; 
            func_logger.trace({"command": cmd, "message": "exec(ci)"});
            res = await aexec(cmd, {"cwd": directory})
            func_logger.trace({"command": cmd, "res": res});
            
          } catch (err) {
            func_logger.warn({"command": cmd, "res": res, "error": err});
          }
          
        } catch (err) {
          // 履歴が存在しない場合は新規登録する
          func_logger.trace({"message": "no history"});
          try {
            // ファイルを出力する
            let fd;
            try {
              func_logger.trace({"message": "write file"});
              fd = await open(filename, 'w');
              fd.writeFile(markdown);
            } finally {
              await fd?.close();
            }
            // 初期登録する
            cmd = 'echo . | ci -i -l -m"' + dtstr + '" "' + target + '.md"';
            func_logger.trace({"command": cmd, "message": "exec(initial ci)"});
            res = await aexec(cmd, {"cwd": directory});
            func_logger.trace({"command": cmd, "res": res});
          } catch (err) {
            func_logger.trace({"command": cmd, "message": "initial ci fail", "error": err});
          }
        }
      } finally {
      }
    } else {
      func_logger.trace({"message": "no RCS or no COMMIT", "useRcs": useRcs, "rcscommit": rcscommit});
      // ファイルを出力する
      let fd;
      try {
        func_logger.trace({"message": "write file"});
        fd = await open(filename, 'w');
        fd.writeFile(markdown);
      } finally {
        await fd?.close();
      }
    }      
  } else {
    func_logger.trace({"message": "markdown is NULL"});
    await rm(filename, {"force": true});
  }
  const res = NextResponse.json({});
  func_logger.debug({"message": "END", "res": res});
  return res;
}

