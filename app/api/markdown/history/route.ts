import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { promisify } from "node:util";
import { build_path } from "@/lib/build-path";
import { rlog_parse } from "@/lib/rlog-parse";
import { exec } from "child_process";
import { History } from "@/types/history-data-type";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

const aexec = promisify(exec);

export async function GET(req: NextRequest) {
  const func_logger = logger.child({ "func": "GET" });
  func_logger.trace({"message": "START"});
  const session = await auth.api.getSession({ headers: await headers() });
  let res;
  func_logger.trace({"session": session});
  if (!session || !session.user || !session.user.email) {
    res = NextResponse.json({}, {status: 401});
    func_logger.trace({"message": "no session", "res": res});
    return res;
  }
  const user = session.user.email;
  const params = req.nextUrl.searchParams;
  const target: string = params.has("target") ? params.get("target") || "" : "";
  const revision: string = params.has("revision") ? params.get("revision") || "" : "";
  func_logger.debug({"params": params, "user": user, "target": target, "revision": revision});
  
  const directory = build_path(process.env.DATA_DIRECTORY || "", user);
  const filename = directory + "/" + target + ".md";

  if (revision === "") {
    // 履歴全体を取得する場合
    let histories: History[] = [];
    let cmd: string = "rlog " + target + ".md";
    try {
      // func_logger.trace({"command": cmd, "message": "exec"});
      func_logger.info({"command": cmd, "message": "exec"});
      let exec_res = await aexec(cmd, {"cwd": directory});
      func_logger.info({"command": cmd, "res": exec_res});
      
      histories = rlog_parse(exec_res["stdout"]);
      func_logger.info({"histories": histories});
      
    } catch (err) {
      func_logger.warn({"command": cmd, "res": res, "error": err});
    }  
    res = NextResponse.json({"histories": histories});
  } else {
    // リビジョンを指定してその内容を取得する場合
    let text: string = "";
    let cmd: string = "co -p" + revision + " " + target + ".md";
    try {
      // func_logger.trace({"command": cmd, "message": "exec"});
      func_logger.info({"command": cmd, "message": "exec"});
      let exec_res = await aexec(cmd, {"cwd": directory});
      func_logger.info({"command": cmd, "res": exec_res});
      
      text = exec_res["stdout"];
      func_logger.info({"text": text});
      
    } catch (err) {
      func_logger.warn({"command": cmd, "res": res, "error": err});
    }  
    res = NextResponse.json({"text": text});
  }
  func_logger.debug({"message": "END", "res": res});
  return res;
}
