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
  const directory = build_path(process.env.DATA_DIRECTORY || "", user_id);

  const params = req.nextUrl.searchParams;
  const target1: string = params.has("t1") ? params.get("t1") || "" : "";
  const target2: string = params.has("t2") ? params.get("t2") || "" : "";
  func_logger.debug({"params": params, "target1": target1, "target2": target2});

  let diff_html: string = "";
  const cmd: string = "git diff --color " + target1 + ".md " + target2 + ".md | ansi2html";
  try {
    const exec_res = await aexec(cmd, {"cwd": directory});
    func_logger.info({"command": cmd, "res": exec_res});

    diff_html = exec_res["stdout"];
  } catch (err) {
    func_logger.warn({"command": cmd, "error": err});
  }
  return NextResponse.json({"diff_html": diff_html});
}
