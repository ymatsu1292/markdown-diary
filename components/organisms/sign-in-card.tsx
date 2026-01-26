"use client";

import { useRouter } from "next/navigation";
import { Form, Button } from "@heroui/react";
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
          <Form
            onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await authClient.signIn.username({
                username: username, password: password,
              });
              if (!error) {
                router.push("/");
              }
            }}
          >
            <Input
              label="ユーザ名"
              id="username"
              type="text"
              required
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              value={username}
            />
            <Input
              label="パスワード"
              id="password"
              type="password"
              placeholder="password"
              autoComplete="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

          <Button
            type="submit"
            className="w-full"
          >
            <p>ログイン</p>
          </Button>
          </Form>
        </div>
      </CardBody>
      
    </Card>
  );
}
