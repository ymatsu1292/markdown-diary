import { NextRequest, NextResponse } from 'next/server';
import { open, mkdir, writeFile, readFile, rm } from 'node:fs/promises';

export async function GET(req: NextRequest) {
  console.log("GET: START");
  const params = req.nextUrl.searchParams;
  const user = params.get('user');
  const target = params.get('target');
  console.log(params, user, target);
  
  const directory = process.env.DATA_DIRECTORY + "/" + user;
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
  const json_data = await req.json();
  const user = json_data['user'];
  const target = json_data['target'];
  const markdown = json_data['markdown'];
  const directory = process.env.DATA_DIRECTORY + "/" + user;
  console.log("directory=", directory);
  // ディレクトリを作り
  await mkdir(directory, { recursive: true });
  console.log("mkdir done");
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
  } else {
    await rm(filename);
  }
  const res = NextResponse.json({});
  return res;
}

