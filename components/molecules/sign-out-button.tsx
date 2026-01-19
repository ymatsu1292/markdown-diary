"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <Button onPress={async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => { router.push("/login"); },
        },
      });
    }}>
      ログアウト
    </Button>
  );
}
