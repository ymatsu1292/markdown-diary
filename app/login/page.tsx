import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { LoginPage } from "@/components/pages/login-page";
import { auth } from "@/lib/auth";

export default async function Login() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  console.log("Login(): session=", session);
  if (session) {
    console.log("Login(): redirect");
    redirect("/");
  }

  console.log("Login(): LoginPage");
  return (
    <LoginPage />
  );
}
