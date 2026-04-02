"use client";

import { useRouter } from "next/navigation";
import { Form, Button } from "@heroui/react";
import { Card } from "@heroui/react";
import { TextField, Label, Input } from "@heroui/react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignInCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  return (
    <Card className="max-w-md w-200">
      <Card.Header>
        <div className="text-lg md:text-xl">サインイン</div>
      </Card.Header>
      <Card.Content>
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
            <TextField>
              <Label>ユーザ名</Label>
              <Input
                id="username"
                type="text"
                required
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                value={username}
              />
            </TextField>
            <TextField>
              <Label>パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </TextField>
          <Button
            type="submit"
            className="w-full"
          >
            <p>ログイン</p>
          </Button>
          </Form>
        </div>
      </Card.Content>
   </Card>
  );
}
