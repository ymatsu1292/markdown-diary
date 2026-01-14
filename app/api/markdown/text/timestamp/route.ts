import { NextRequest, NextResponse } from "next/server";
import { stat } from "node:fs/promises";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
//import { promisify } from "node:util";
import { build_path } from "@/lib/build-path";

//import moment from "moment";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

// const useRcs: boolean = ("NEXT_PUBLIC_USE_RCS" in process.env)
//   ? (process.env["NEXT_PUBLIC_USE_RCS"] == "true" ? true : false)
//   : false;

export async function GET(req: NextRequest) {
  const func_logger = logger.child({ "func": "GET" });
  func_logger.trace({"message": "START"});
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({}, {status: 401});
  }
  const user_id = session.user.id;
  
  const params = req.nextUrl.searchParams;
  const target: string = params.has("target") ? params.get("target") || "" : "";
  func_logger.debug({"params": params, "user_id": user_id, "target": target});

  const directory = build_path(process.env.DATA_DIRECTORY || "", user_id);
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
