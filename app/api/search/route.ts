import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { promisify } from "node:util";
import { build_path } from "@/lib/build-path";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

const aexec = promisify(exec);

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
  const directory = build_path(process.env.DATA_DIRECTORY || "", user_id);

  const cmd: string = "grep -r -n '" + target  + "' *.md";
  const grepResults: string[][] = [];
  try {
    func_logger.info({"command": cmd, "message": "exec"});
    const exec_res = await aexec(cmd, {"cwd": directory});
    func_logger.info({"command": cmd, "res": exec_res});
    exec_res["stdout"].split("\n").forEach((line) => {
      func_logger.info({"line": line});
      const data: string[] = line.split(":");
      if (data.length > 2) {
        const key: string = data.shift() || "";
        const linenum: string = data.shift() || "";
        const val: string = data.join(":") || "";
        grepResults.push([key, linenum, val]);
      }
    });
    //grepResults = exec_res["stdout"].split("\n");
    func_logger.info({"grepResults": grepResults});
  } catch (error) {
    func_logger.info({"command": cmd, "error": error});
  }
  const res = NextResponse.json({"grepResults": grepResults});
  func_logger.info({"message": "END", "res": res});
  return res;  
};
