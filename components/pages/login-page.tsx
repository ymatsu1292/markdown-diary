"use client";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });
import SignInCard from "@/components/organisms/sign-in-card";

export function LoginPage() {
  const func_logger = logger.child({ "func": "LoginPage" });
  func_logger.trace({"message": "START"});

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <SignInCard />
    </div>
  );
}
