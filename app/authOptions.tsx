import NextAuth from 'next-auth';
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { jwtDecode } from 'jwt-decode';
import { JWT } from 'next-auth/jwt';
import { cookies } from 'next/headers';

import base_logger from '@//utils/logger';
const logger = base_logger.child({ filename: __filename });

export const authOptions: NextAuthOptions = {
  debug: true,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "パスワード認証",
      credentials: {
        password: { label: "パスワード", type: "password" }
      },
      async authorize(credentials, req) {
        const func_logger = logger.child({ "func": "authorize" });
        func_logger.debug({"message": "START", "params": {"credentials": credentials, "req": req}});
        let res = null;
        if (credentials != undefined && credentials["password"] == process.env["AUTH_PASSWORD"]) {
          let userId = process.env["AUTH_USER"];
          const user: User = { id: userId || "", name: userId || "", email: userId || "", image: "" };
          res = user;
        }
        func_logger.debug({"message": "END", "params": {"credentials": credentials, "req": req}, "res": res});
        return res;
      }
    }),
  ],
};

export default NextAuth(authOptions);
