import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { LoginPage } from "@/components/pages/login-page";
import SignInCard from "@/components/organisms/sign-in-card";
import { auth } from "@/lib/auth";

export default async function Login() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (session) {
    redirect("/");
  }
  console.log("session=", session);

  return (
    <LoginPage />
  );
}
