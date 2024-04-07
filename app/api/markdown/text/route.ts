import { NextRequest, NextResponse } from 'next/server';
import { open, mkdir, writeFile, readFile, rm, stat, mkdtemp, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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

const writeFileLocal = async (filename: string, data: string) => {
  const func_logger = logger.child({ "func": "writeFileLocal" });
  let fd;
  try {
    func_logger.trace({"message": "write file", "filename": filename});
    fd = await open(filename, 'w');
    fd.writeFile(data);
  } finally {
    await fd?.close();
  }
};

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
  const oldtimestamp: number = params.has('timestamp') ? parseFloat(params.get('timestamp') || "0.0") || 0.0 : 0.0;
  func_logger.debug({"params": params, "user": user, "target": target});

  const directory = build_path(process.env.DATA_DIRECTORY || "", user);
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
  const original = json_data['original'];
  const oldtimestamp: number = parseFloat(json_data['timestamp'] || "0.0") || 0.0;
  const directory = build_path(process.env.DATA_DIRECTORY || "", user);
  func_logger.trace({"directory": directory});
  func_logger.trace({"markdown": markdown, "original": original, "oldtimestamp": oldtimestamp});
  // ディレクトリを作り
  await mkdir(directory, { recursive: true });
  //console.log("mkdir done");
  // ファイル名を作る
  const filename = directory + "/" + target + ".md";

  let committed = true;
  let mtime = 0;
  let new_markdown: string | null = null;
  let conflicted = false;

  try {
    const stat_data = await stat(filename);
    mtime = stat_data.mtimeMs;
  } catch (error) {
    func_logger.info({"message": "cannot stat"});
  }

  if (markdown != "") {
    func_logger.trace({"message": "マークダウン更新/新規追加"});
    func_logger.trace({"message": "markdown is NOT NULL"});
    if (useRcs && rcscommit) {
      func_logger.trace({"message": "RCSは利用する"});
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
            if (mtime == oldtimestamp) {
              func_logger.trace({"message": "タイムスタンプが変わってないので通常の更新を行う", "old": oldtimestamp, "new": mtime});
              await writeFileLocal(filename, markdown);
            } else {
              func_logger.trace({"message": "タイムスタンプが変わっているのでマージ処理を行う", "old": oldtimestamp, "new": mtime});
              // タイムスタンプがほかのクライアントに更新されていたらマージする
              func_logger.trace({"message": "merge file"});
              // 作業用ディレクトリを作成
              const mkdtemp_result = await mkdtemp(join(tmpdir(), 'mdiary'));
              func_logger.trace({"mkdtemp_result": mkdtemp_result});
              // オリジナルファイルを一時ファイルに出力
              // 新規ファイルを一時ファイルに出力
              // マージコマンドを実行
            }

            // ci -f -l -m "日時" ファイル名
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
            await writeFileLocal(filename, markdown);
            // 初期登録する
            cmd = 'echo . | ci -i -l -m"' + dtstr + '" "' + target + '.md"';
            func_logger.trace({"command": cmd, "message": "exec(initial ci)"});
            res = await aexec(cmd, {"cwd": directory});
            func_logger.trace({"command": cmd, "res": res});
          } catch (err) {
            func_logger.warn({"command": cmd, "message": "initial ci fail", "error": err});
          }
        }
      } finally {
      }
    } else {
      func_logger.trace({"message": "RCSコミットは行わずファイル更新のみ行う"});
      func_logger.trace({"message": "no RCS or no COMMIT", "useRcs": useRcs, "rcscommit": rcscommit});
      // ファイルを出力する
      if (mtime == oldtimestamp) {
        func_logger.trace({"message": "マージ不要なので通常のファイル更新を行う", "old": oldtimestamp, "new": mtime});
        await writeFileLocal(filename, markdown);
      } else {
        func_logger.trace({"message": "マージが必要", "old": oldtimestamp, "new": mtime});
        // タイムスタンプがほかのクライアントに更新されていたらマージする
        func_logger.trace({"message": "merge file"});
        // 作業用ディレクトリを作成
        const mkdtemp_result = await mkdtemp(join(tmpdir(), 'mdiary'));
        func_logger.trace({"mkdtemp_result": mkdtemp_result});
        // ベースファイルをコピー
        const base_filename = join(mkdtemp_result, 'base');
        func_logger.trace({"copyFile": base_filename});
        await cp(filename, base_filename);
        // オリジナルファイルを一時ファイルに出力
        const orig_filename = join(mkdtemp_result, 'original');
        func_logger.info({"writeFileLocal": orig_filename, "data": original});
        await writeFileLocal(orig_filename, original);
        // 新規ファイルを一時ファイルに出力
        const new_filename = join(mkdtemp_result, 'markdown');
        func_logger.info({"writeFileLocal": new_filename, "data": markdown});
        await writeFileLocal(new_filename, markdown);
        // マージコマンドを実行
        let cmd: string = 'merge ' + base_filename + ' ' + orig_filename + ' ' + new_filename;
        try {
          func_logger.info({"command": cmd, "message": "exec"});
          let exec_res = await aexec(cmd, {"cwd": directory});
          func_logger.info({"command": cmd, "res": exec_res});
          // コンフリクトしなかった場合はファイルをコピー
          func_logger.info({"copyFile": base_filename});
          await cp(base_filename, filename);          
          // 結果を読み込む
          func_logger.trace({"message": "マージ結果読み込み"});
          new_markdown = await readFile(filename, { encoding: "utf-8" });
          func_logger.trace({"message": "マージ結果読み込み - 成功"});
        } catch (error) {
          // コンフリクト時は結果を読み込んで返却する
          func_logger.info({"command": cmd, "error": error});
          new_markdown = await readFile(base_filename, { encoding: "utf-8" });
          func_logger.info({"message": "コンフリクトしたのでファイルを読み込んで返却する", "text": new_markdown});
          conflicted = true;
        }
        // 一時ディレクトリを削除する
        cmd = 'rm -rf ' + mkdtemp_result;
        try {
          func_logger.info({"command": cmd, "message": "exec"});
          let exec_res = await aexec(cmd, {"cwd": directory});
          func_logger.info({"command": cmd, "res": exec_res});
        } catch (error) {
          func_logger.info({"command": cmd, "error": error});
        }
      }
      // マージ後のタイムスタンプは読み込む
      try {
        const stat_data = await stat(filename);
        mtime = stat_data.mtimeMs;
      } catch (error) {
        func_logger.info({"message": "cannot stat"});
      }
      func_logger.trace({"message": "マージ後のタイムスタンプ", "timestamp": mtime});
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
    }      
  } else {
    func_logger.trace({"message": "マークダウンファイル削除"});
    func_logger.trace({"message": "markdown is NULL"});
    await rm(filename, {"force": true});
  }
  const res = NextResponse.json({
    "committed": committed, 
    "markdown": new_markdown, 
    "timestamp": mtime,
    "conflicted": conflicted,
  });
  func_logger.info({"message": "END",
    "committed": committed, 
    "markdown": new_markdown, 
    "timestamp": mtime,
    "conflicted": conflicted,
  });
  return res;
}

