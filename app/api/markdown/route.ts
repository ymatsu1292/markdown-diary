import { NextRequest, NextResponse } from 'next/server';
import { open, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { exec } from 'child_process';
import { authOptions } from '@/app/authOptions';
import { getServerSession } from 'next-auth/next';
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
  const session = await getServerSession(authOptions);
  if (!session) {
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
  console.log("GET: END ", markdown);
  return res;
}

export async function POST(req: Request) {
  console.log("markdown POST: START");
  const session = await getServerSession(authOptions);
  console.log("session=", session);
  if (!session) {
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
        const dtstr = moment().format();
        // mkdir RCS
        console.log("mkdir");
        await mkdir(directory + "/RCS", { recursive: true });
        // co -l "日時" ファイル名
        let cmd = 'co -l "' + target + '.md"'; 
        console.log("co -l:", cmd);
        exec(cmd, {"cwd": directory})
        // ファイルを出力する
        let fd;
        try {
          fd = await open(filename, 'w');
          fd.writeFile(markdown);
        } finally {
          await fd?.close();
        }
        // ci -m "日時" ファイル名
        cmd = 'echo . | ci -l -m"' + dtstr + '" "' + target + '".md'; 
        console.log("ci:", cmd);
        exec(cmd, {"cwd": directory})
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
  return res;
}

