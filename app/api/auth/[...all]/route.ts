import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

//export const { POST, GET } = toNextJsHandler(auth);
const handlers = toNextJsHandler(auth);
//const baseURL = "https://rhyme.mine.nu/mdiary";

function rewriteRequest(req: NextRequest) {
  const { search, pathname } = req.nextUrl;
  const url = new URL(process.env.NEXT_PUBLIC_BASE_URL + pathname);
  url.search = search;

  return new NextRequest(url, req);
}

export async function GET(req: NextRequest) {
  const modified = rewriteRequest(req);
  return handlers.GET(modified);
}

export async function POST(req: NextRequest) {
  const modified = rewriteRequest(req);
  return handlers.POST(modified);
}
