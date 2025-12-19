"use client";

import { Button } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter} from "@heroui/react";
import { Input } from "@heroui/react";
import { Checkbox } from "@heroui/react";
import { useState } from "react";
import { Loader2, Key } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";

export default function SignInCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  

  return (
    <Card className="max-w-md w-200">
      <CardHeader>
        <div className="text-lg md:text-xl">サインイン</div>
      </CardHeader>
      <CardBody>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="email">メールアドレス</label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              required
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
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
	    isDisabled={loading}
            onClick={async () => {
              await signIn.email({ email, password, callbackURL: "/" }, {
                onRequest: (ctx) => {
                  setLoading(true);
                },
                onResponse: (ctx) => {
                  setLoading(false);
                },
              },);
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <p>ログイン</p>
            )}
          </Button>
        </div>
      </CardBody>
      
    </Card>
  );
}
