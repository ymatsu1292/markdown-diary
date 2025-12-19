import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { MainPage } from "@/components/pages/main-page";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session) {
    redirect("/login");
  }

  return (
    <MainPage />
  );
}
