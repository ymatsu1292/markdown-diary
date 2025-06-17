import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { jwtDecode } from 'jwt-decode';
import { JWT } from 'next-auth/jwt';
import { cookies } from 'next/headers';

async function refreshAccessToken(token: JWT) {
  const url = process.env.KEYCLOAK_TOKEN_ENDPOINT_URL || "";
  const params = new URLSearchParams();
  params.append("client_id", process.env.KEYCLOAK_ID || "");
  params.append("client_secret", process.env.KEYCLOAK_SECRET || "");
  params.append("grant_type", "refresh_token")
  params.append("refresh_token", String(token.refresh_token) || "");
  console.log("refreshAccessToken(): url=", url, ", params=", String(params));
  // Keycloakではアクセストークンのリフレッシュにclient_idとclient_secretとrefresh_tokenを利用する
  // grant_typeでrefresh_tokenを指定する方法以外にもありそうだが未調査
  const res = await fetch(url, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    method: "POST",
  });
  const new_refresh_token = await res.json();
  console.log("new_refresh_token=", new_refresh_token);
  if (!res.ok) {
    // トークンのリフレッシュに失敗したときは例外を発生させる
    throw new_refresh_token;
  }
  // token内のアクセストークン・リフレッシュトークンの情報を更新して返却する
  return {
    ...token,
    access_token: new_refresh_token.access_token,
    expires_at: Math.floor(Date.now() / 1000) + new_refresh_token.expires_in,
    refresh_token: new_refresh_token.refresh_token,
  }
}

export const authOptions: NextAuthOptions = {
  debug: true,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "パスワード認証",
      credentials: {
        user: { label: "ユーザ", type: "text", placeholder: "user" },
        password: { label: "パスワード", type: "password" }
      },
      async authorize(credentials, req) {
        console.log(credentials);
        console.log(req);
        const user = { id: "user", name: "user", email: "user" };
        return user;
      }
    }),
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID || "",
      clientSecret: process.env.KEYCLOAK_SECRET || "",
      issuer: process.env.KEYCLOAK_ISSUER,
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      session.error = token.error || undefined;
      return session;
    },
    jwt: async ({ token, user, account, profile, isNewUser }) => {
      const now = Math.floor(Date.now() / 1000);
      let expires_at: number = Number(token?.expires_at || 0);
      // rolesの情報をaccess tokenから取り出す
      let decoded_access_token: any | null = null;
      let decoded_refresh_token: any | null = null;
      if (account) {
        // サインインしたときか新しいセッションが利用されるときにのみaccountは登録されている
        // Keycloakの場合はprofileにrolesの設定を含めることもできるが、今回はアクセストークンから取り出してみる
        // アクセストークンが無効になった際にリフレッシュするため、リフレッシュトークンはtokenに登録しておく
        if (account.refresh_token) {
          token.refresh_token = account.refresh_token;
          decoded_refresh_token = jwtDecode(account.refresh_token);
        }
        console.log("jwt_decoded refresh_token=", decoded_refresh_token);
        if (decoded_refresh_token && decoded_refresh_token.exp < now) {
          // refresh tokenがタイムアウトしているので何もせず終了する
          console.log("refresh tokenが期限切れです");
          return token;
        }
        if (account.access_token) {
          token.access_token = account.access_token;
          decoded_access_token = jwtDecode(account.access_token);
        }
        console.log("jwt_decoded access_token=", decoded_access_token);
        expires_at = Number(decoded_access_token.expires_at || 0);
        if (now < expires_at) {
          // アクセストークンが無効になっているので更新する
          try {
            const refreshed_token = await refreshAccessToken(token);
            console.log("tokenをリフレッシュしました");
            console.log("refreshed_token=", refreshed_token);
          } catch (error) {
            // リフレッシュできなかった場合は元のトークンを返し、errorという項目を追加してみる
            // こうなった場合は、クライアント側でいったんログアウトして再ログインする必要があるのかな
            console.log("アクセスtokenがリフレッシュできませんでした", error);
            return {...token, error: "refresh_access_token_error"};
          }
        } else if (now < expires_at) {
          // account情報がない場合は現状の情報を引き続き利用するが、tokenが有効かどうかは確認する
          return token;
	} else {
          // tokenがexpire時間を超えている場合は更新する
          console.log("tokenが無効なので更新が必要(now=", now, ", expires_at=", expires_at, ")");
          try {
            const refreshed_token = await refreshAccessToken(token);
            console.log("tokenをリフレッシュしました");
            console.log("refreshed_token=", refreshed_token);
            return refreshed_token;
          } catch (error) {
            //console.log("jwt cookies=", cookies().getAll());
            // リフレッシュできなかった場合は元のトークンを返し、errorという項目を追加してみる
            // こうなった場合は、クライアント側でいったんログアウトして再ログインする必要があるのかな
            console.log("アクセスtokenがリフレッシュできませんでした", error);
            let result =  {
              ...token,
              error: "refresh_access_token_error"
            }
            console.log("jwt(refresh).result=", result);
            return result;
          }
	}
      }
      console.log("jwt(no refresh).result=", token);
      return token;
    }
  },
  events: {
    signOut: async ({ token, session }) => {
      // サインアウトのイベントが発生した場合、Keycloakのlogout endpointをたたき、
      // シングルサインオンからもログアウトする。シングルサインオンからのログアウトをしないのであれば不要な処理
      console.log("in event.signOut", token, session);
      const logoutEndpointUrl = process.env.KEYCLOAK_LOGOUT_ENDPOINT_URL || "";
      const params = new URLSearchParams();
      params.append("client_id", process.env.KEYCLOAK_ID || "");
      params.append("client_secret", process.env.KEYCLOAK_SECRET || "");
      params.append("refresh_token", String(token.refresh_token));
      // Keycloakではclient_id/client_secret/refresh_tokenを必要とするらしい
      const result = await fetch(logoutEndpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      console.log(result);
    }
  }

};

export default NextAuth(authOptions);
