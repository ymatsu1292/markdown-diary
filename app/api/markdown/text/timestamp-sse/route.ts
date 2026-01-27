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
  func_logger.debug({"message": "START"});
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({}, {status: 401});
  }
  const user_id = session.user.id;
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  
  const params = req.nextUrl.searchParams;
  const target: string = params.has("target") ? params.get("target") || "" : "";
  func_logger.debug({"params": params, "user_id": user_id, "target": target});

  const directory = build_path(process.env.DATA_DIRECTORY || "", user_id);
  const filename = directory + "/" + target + ".md";
  let prev_mtime = 0;
  let prev_timestamp = 0;

  const interval = setInterval(async () => {
    func_logger.debug({"message": "do interval"})
    let mtime = 0;
    const timestamp = Date.now();
    try {
      const stat_data = await stat(filename);
      mtime = stat_data.mtimeMs;
      func_logger.trace({"message": "get mtime", "mtime": mtime})
    } catch (error) {
      func_logger.trace({"message": "EventStream(no file)", "error": error})
    }
    try {
      func_logger.trace({"message": "do interval", "filename": filename, "timestamp": timestamp, "mtime": mtime})
      func_logger.debug({"message": "EventStream!"})
      if (mtime != prev_mtime) {
        func_logger.trace({"message": "EventStream - send timestamp1"})
        func_logger.trace({"message": "EventStream", "writer": writer})
        writer.write(new TextEncoder().encode(`event: message\ndata:${mtime}\n\n`));
        prev_mtime = mtime;
        prev_timestamp = timestamp;
        func_logger.trace({"message": "EventStream - send timestamp2"})
      } else if (timestamp - prev_timestamp > 10000) {
        func_logger.trace({"message": "EventStream - health check1"})
        writer.write(new TextEncoder().encode(":\n\n"));
        prev_timestamp = timestamp;
        func_logger.debug({"message": "EventStream - health check", "timestamp": timestamp, "prev_timestamp": prev_timestamp})
      } else {
        func_logger.trace({"message": "EventStream - SKIP", "timestamp": timestamp, "prev_timestamp": prev_timestamp})
      }
    } catch (error) {
      func_logger.info({"message": "EventStram - error", "error": error});
      clearInterval(interval);
      writer.close();
    }
  }, 500);

  req.signal.addEventListener("abort", () => {
    clearInterval(interval);
    writer.close();
  });
  
  func_logger.debug({"message": "END"});
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
