"use client";

import base_logger from "@/lib/logger";
const logger = base_logger.child({ filename: __filename });

export function LoginPage() {
  const func_logger = logger.child({ "func": "LoginPage" });
  func_logger.trace({"message": "START"});

  return (
    <LoginPage />
  );
}
