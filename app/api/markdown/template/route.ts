import { NextRequest, NextResponse } from 'next/server';
import { open, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { exec } from 'child_process';
import { authOptions } from '@/app/authOptions';
import { getServerSession } from 'next-auth/next';
import { promisify } from 'node:util';
import { build_path } from '@/utils/buildPath';

import base_logger from '@/utils/logger';
const logger = base_logger.child({ filename: __filename });

const aexec = promisify(exec);

export async function GET(req: NextRequest) {
  const func_logger = logger.child({ "func": "GET" });
  func_logger.info({"message": "START"});
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({}, {status: 401});
  }
  const user = session.user.email;
  
  const params = req.nextUrl.searchParams;
  const target: string = params.has('target') ? params.get('target') || "" : "";
  func_logger.trace({"params": params, "user": user, "target": target});

  const directory = build_path(process.env.DATA_DIRECTORY || "", user);
  const filename = directory + "/" + target + ".template.md";
  
  let template = "";
  try {
    template = await readFile(filename, { encoding: "utf-8" });
  } catch (error) {
    // エラーが出ても気にしない
    func_logger.debug({"message": "IGNORE ERROR", "error": error})
  }
  const res = NextResponse.json({"template": template});
  func_logger.info({"message": "END", "res": res});
  return res;
}
