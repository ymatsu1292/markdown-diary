import { NextRequest, NextResponse } from 'next/server';
import { stat } from 'node:fs/promises';
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

  let mtime = 0;
  try {
    const stat_data = await stat(filename);
    mtime = stat_data.mtimeMs;
  } catch (error) {
    // エラーが出ても気にしない
    func_logger.debug({"message": "IGNORE ERROR", "error": error})
  }
  const res = NextResponse.json({"timestamp": mtime});
  func_logger.trace({"message": "タイムスタンプ取得", "mtime": mtime});
  func_logger.debug({"message": "END", "res": res});
  return res;
}
