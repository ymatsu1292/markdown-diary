import { NextRequest, NextResponse } from 'next/server';
import { open, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { exec } from 'child_process';
import moment from 'moment';

const useRcs: boolean = ("NEXT_PUBLIC_USE_RCS" in process.env)
  ? (process.env["NEXT_PUBLIC_USE_RCS"] == "true" ? true : false)
  : false;

function build_path(base_directory: string, user_email: string) {
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
  return base_directory + "/" + parent_dir + "/" + child_dir;
}

export async function GET(req: NextRequest) {
  console.log("GET: START");
  const params = req.nextUrl.searchParams;
  const user: string = params.has('user') ? params.get('user') || "" : 'user';
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
  console.log("GET: END ", markdown);
  return res;
}

export async function POST(req: Request) {
  console.log("POST: START");
  const json_data = await req.json();
  console.log(json_data);
  const user = json_data['user'];
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
    // ファイルを出力する
    let fd;
    try {
      fd = await open(filename, 'w');
      fd.writeFile(markdown);
    } finally {
      await fd?.close();
    }
    if (useRcs && rcscommit) {
      console.log("use RCS");
      // RCSを利用する場合は以下を実行する
      try {
        const dtstr = moment().format();
        // mkdir RCS
        console.log("mkdir");
        await mkdir(directory + "/RCS", { recursive: true });
        // ci -m "日時" ファイル名
        let cmd = 'ci -l -m"' + dtstr + '" ' + target + ".md"; 
        console.log("ci:", cmd);
        exec(cmd, {"cwd": directory})
      } finally {
      }
    }
  } else {
    await rm(filename);
  }
  const res = NextResponse.json({});
  return res;
}

