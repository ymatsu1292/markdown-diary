import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

export async function GET(req: NextRequest) {
  const func_logger = logger.child({ "func": "GET" });
  func_logger.trace({"message": "START"});
  const session = await auth.api.getSession({ headers: await headers() });
  let res;
  if (!session) {
    res = NextResponse.json({"count": 0, "results": []}, {status: 401});
    return res;
  }
  
  const params = req.nextUrl.searchParams;
  console.log("params=", params);
  const page = Number(params.get("page"));

  if (session.user.role == "admin") {
    const users = await auth.api.listUsers({
      query: {
        limit: 20, offset: (page - 1) * 20, sortBy: "username"
      },
      headers: await headers(),
    });
    res = NextResponse.json({"count": users.total, "results": users.users});
  } else {
    const users = { users: [session.user], total: 1, limit: 1, offset: 1 };
    res = NextResponse.json({"count": users.total, "results": users.users});
  }
  
  func_logger.debug({"message": "END", "res": res});
  return res;
}
