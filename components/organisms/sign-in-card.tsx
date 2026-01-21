"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { Input } from "@heroui/react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignInCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  return (
    <Card className="max-w-md w-200">
      <CardHeader>
        <div className="text-lg md:text-xl">サインイン</div>
      </CardHeader>
      <CardBody>
        <div className="grid gap-4">

          <div className="grid gap-2">
            <label htmlFor="username">ユーザ名</label>
            <Input
              id="username"
              type="text"
              required
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              value={username}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <label htmlFor="password">パスワード</label>
                
            </div>

            <Input
              id="password"
              type="password"
              placeholder="password"
              autoComplete="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            onClick={async () => {
              const { error } = await authClient.signIn.username({
                username: username, password: password,
              });
              if (!error) {
                router.push("/");
              }
            }}
          >
            <p>ログイン</p>
          </Button>
        </div>
      </CardBody>
      
    </Card>
  );
}
