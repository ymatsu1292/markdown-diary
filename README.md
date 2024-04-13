markdown-diary
=====
概要
-----
*   Markdownで記載した情報を日記のように日付単位で管理するツール
*   カレンダーで日付を選び、Markdownで何か記載して保存すると、"YYYY-mm-dd.md"形式のファイルに出力して管理される
*   ファイル名を入力して好きなファイルに出力することもできる
*   カレンダーには土日・祝日、日記を書いた日、指定した日などが色付け・アンダーラインなどでわかるように表示される

実行方法
-----
*   node.js/next-authが対応している認証基盤が必要 → ユーザ・パスワードを設定ファイルに書く形で動作するような設定としている。authOptions.tsファイルを書き換えればNext-Authが対応している認証基盤を利用することができる
*   環境設定後 npm run build、npm run startで起動
    *   Node 20.11.1で動作確認を実施

環境設定(.envファイルに記載する)
-----
```
DOMAIN=<ドメイン名を指定 例: github.com>
SUBDIR=/mdiary

NEXT_PUBLIC_BASE_URL=https://${DOMAIN}${SUBDIR}

NEXTAUTH_SECRET=<適当な文字列を設定、uuidコマンドの出力結果など>
NEXTAUTH_URL=https://${DOMAIN}${SUBDIR}/api/auth

DATA_DIRECTORY=<データファイルを置くディレクトリを設定 例: /home/xxxx/mdiary-dataなど>

AUTH_USER=<認証に使用するメールアドレスを設定 例: dummy@test.local>
AUTH_PASSWORD=<認証に使用するパスワードを設定>

# RCSをインストールしてある場合は以下をtrueにすると自動保存・データの版管理ができる
NEXT_PUBLIC_USE_RCS=true
#NEXT_PUBLIC_USE_RCS=false

# ログレベルの設定
NEXT_PUBLIC_LOG_LEVEL=info
#NEXT_PUBLIC_LOG_LEVEL=debug
#NEXT_PUBLIC_LOG_LEVEL=trace
```
