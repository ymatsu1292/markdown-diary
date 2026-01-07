import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { UsersPage } from "@/components/pages/users-page";
import { auth } from "@/lib/auth";

export default async function Users() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  console.log("Login(): session=", session);
  if (!session) {
    console.log("Login(): redirect");
    redirect("/");
  }

  console.log("Users(): UsersPage");
  return (
    <UsersPage />
  );
}
