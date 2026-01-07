import { NextRequest, NextResponse } from "next/server";
import { open, mkdir, writeFile, readFile, rm, stat, mkdtemp, cp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { exec } from "child_process";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { promisify } from "node:util";
import { build_path } from "@/lib/build-path";

import moment from "moment";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

const useRcs: boolean = ("NEXT_PUBLIC_USE_RCS" in process.env)
  ? (process.env["NEXT_PUBLIC_USE_RCS"] == "true" ? true : false)
  : false;

const aexec = promisify(exec);

const writeFileLocal = async (filename: string, data: string) => {
  const func_logger = logger.child({ "func": "writeFileLocal" });
  let fd;
  try {
    func_logger.trace({"message": "write file", "filename": filename});
    fd = await open(filename, "w");
    if (data.substr(-1) !== "\n") {
      fd.writeFile(data + "\n");
    } else {
      fd.writeFile(data);
    }      
  } finally {
    await fd?.close();
  }
};

export async function GET(req: NextRequest) {
  const func_logger = logger.child({ "func": "GET" });
  func_logger.trace({"message": "START"});
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({}, {status: 401});
  }
  const user_id = session.user.id;
  console.log("user_id=", user_id);
  
  const params = req.nextUrl.searchParams;
  const target: string = params.has("target") ? params.get("target") || "" : "";
  const oldtimestamp: number = params.has("timestamp") ? parseFloat(params.get("timestamp") || "0.0") || 0.0 : 0.0;
  func_logger.debug({"params": params, "user_id": user_id, "target": target});

  const directory = build_path(process.env.DATA_DIRECTORY || "", user_id);
  const filename = directory + "/" + target + ".md";

  let markdown = "";
  let mtime = 0;
  let committed = true;
  try {
    markdown = await readFile(filename, { encoding: "utf-8" });
    const stat_data = await stat(filename);
    mtime = stat_data.mtimeMs;
    if (mtime != oldtimestamp) {
      // タイムスタンプが予期せず更新されている
      // 誰かほかの人が更新したのかもしれないが、GET時は使わない
    }

    if (useRcs) {
      // RCSを利用している場合はrcsdiffでコミットされていない情報があるかどうかをチェック
      let cmd: string = 'rcsdiff -r ' + target + '.md';
      try {
        func_logger.info({"command": cmd, "message": "exec"});
        let exec_res = await aexec(cmd, {"cwd": directory});
        func_logger.info({"command": cmd, "res": exec_res});
        // 差分がない場合
      } catch (error) {
        // 差分がある場合(保存されていない)
        func_logger.info({"command": cmd, "error": error});
        committed = false;
      }
    }
  } catch (error) {
    // エラーが出ても気にしない
    func_logger.debug({"message": "IGNORE ERROR", "error": error})
  }
  const res = NextResponse.json({"markdown": markdown, "committed": committed, "timestamp": mtime});
  func_logger.debug({"message": "END", "res": res});
  return res;
}

export async function POST(req: Request) {
  const func_logger = logger.child({ "func": "POST" });
  func_logger.info({"message": "START"});
  const session = await auth.api.getSession({ headers: await headers() });
  func_logger.trace({"session": session});
  if (!session) {
    const res = NextResponse.json({}, {status: 401});
    func_logger.trace({"message": "no session", "res": res});
    return res;
  }
  const user_id = session.user.id;
  
  const json_data = await req.json();
  func_logger.trace({"json_data": json_data});
  const target = json_data['target'];
  const rcscommit = json_data['rcscommit']
  const markdown = json_data['markdown'];
  const original = json_data['original'];
  const oldtimestamp: number = parseFloat(json_data['timestamp'] || "0.0") || 0.0;
  const directory = build_path(process.env.DATA_DIRECTORY || "", user_id);
  func_logger.trace({"directory": directory});
  func_logger.trace({"markdown": markdown, "original": original, "oldtimestamp": oldtimestamp});
  // ディレクトリを作り
  await mkdir(directory, { recursive: true });
  //console.log("mkdir done");
  // ファイル名を作る
  const filename = directory + "/" + target + ".md";

  let committed = true;
  let mtime = 0;
  let conflicted = false;

  try {
    const stat_data = await stat(filename);
    mtime = stat_data.mtimeMs;
  } catch (error) {
    func_logger.info({"message": "cannot stat"});
  }

  if (markdown != "") {
    func_logger.trace({"message": "マークダウン更新/新規追加"});
    if (useRcs && rcscommit) {
      func_logger.trace({"message": "RCSは利用する"});
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
        let historyExisted = true;
        try {
          cmd = 'rlog -R ' + target + '.md';
          func_logger.trace({"command": cmd, "message": "exec"});
          res = await aexec(cmd, {"cwd": directory});
          func_logger.trace({"command": cmd, "res": res});
        } catch (err) {
          // rlogがエラーになったらRCS未登録
          historyExisted = false;
        }
        if (historyExisted) {
          // 履歴がある場合はファイルを通常更新する
          func_logger.trace({"message": "履歴があるので通常更新を行う(RCS登録)"});
          try {
            // ファイルを出力する
            if (mtime == oldtimestamp) {
              func_logger.trace({"message": "タイムスタンプが変わってないので通常の更新を行う", "old": oldtimestamp, "new": mtime});
              await writeFileLocal(filename, markdown);
              // ci -f -l -m "日時" ファイル名
              cmd = 'echo . | ci -f -l -m"' + dtstr + '" "' + target + '.md"'; 
              func_logger.trace({"command": cmd, "message": "exec(ci)"});
              res = await aexec(cmd, {"cwd": directory})
              func_logger.trace({"command": cmd, "res": res});
            } else {
              func_logger.trace({"message": "タイムスタンプが変わっているので更新しない", "old": oldtimestamp, "new": mtime});
              conflicted = true;
            }
          } catch (err) {
            // 何かエラーが出た
            func_logger.warn({"command": cmd, "message": "通常更新失敗(RCS登録)", "error": err});
          }
        } else {
          // 履歴が存在しない場合は新規登録する
          func_logger.trace({"message": "履歴がないので新規登録する(RCS登録)"});
          try {
            // ファイルを出力する
            await writeFileLocal(filename, markdown);
            // 初期登録する
            cmd = 'echo . | ci -i -l -m"' + dtstr + '" "' + target + '.md"';
            func_logger.trace({"command": cmd, "message": "exec(initial ci)"});
            res = await aexec(cmd, {"cwd": directory});
            func_logger.trace({"command": cmd, "res": res});
          } catch (err) {
            func_logger.warn({"command": cmd, "message": "初期登録失敗(RCS登録)", "error": err});
          }
        }
      } finally {
        // ディレクトリ生成に失敗
      }
    } else {
      func_logger.trace({"message": "RCSコミットは行わずファイル更新のみ行う"});
      // ファイルを出力する
      if (mtime == oldtimestamp) {
        func_logger.trace({"message": "競合していないので通常のファイル更新を行う", "old": oldtimestamp, "new": mtime});
        await writeFileLocal(filename, markdown);
      } else {
        func_logger.trace({"message": "競合しているので更新しない", "old": oldtimestamp, "new": mtime});
        conflicted = true;
      }
    }      
    // タイムスタンプを読み込む
    try {
      const stat_data = await stat(filename);
      mtime = stat_data.mtimeMs;
    } catch (error) {
      func_logger.info({"message": "cannot stat"});
    }
    func_logger.trace({"message": "タイムスタンプ", "timestamp": mtime});
    if (useRcs) {
      // RCSを利用している場合はrcsdiffでコミットされていない情報があるかどうかをチェック
      let cmd: string = 'rcsdiff -r ' + target + '.md';
      try {
        func_logger.info({"command": cmd, "message": "exec"});
        let exec_res = await aexec(cmd, {"cwd": directory});
        func_logger.info({"command": cmd, "res": exec_res});
        // 差分がない場合
      } catch (error) {
        // 差分がある場合(保存されていない)
        func_logger.info({"command": cmd, "error": error});
        committed = false;
      }
      func_logger.trace({"message": "コミットされていない情報があるかどうかをチェック", "committed": committed});
    }
  } else {
    func_logger.trace({"message": "マークダウンファイル削除"});
    func_logger.trace({"message": "markdown is NULL"});
    await rm(filename, {"force": true});
  }
  const res = NextResponse.json({
    "committed": committed, 
    "timestamp": mtime,
    "conflicted": conflicted,
  });
  func_logger.info({"message": "END",
    "committed": committed, 
    "timestamp": mtime,
    "conflicted": conflicted,
  });
  return res;
}

