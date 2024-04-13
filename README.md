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
1.  Node.js 20.11.1をインストールしたLinux環境を用意する
    できればRCSもインストールする(ubuntuであればapt install rcsでインストール)
2.  git cloneでリポジトリをクローンする
3.  設定ファイル(markdown-diary/.env)を設定する
    ```
    $ cd markdown-diary
    $ vi .env
    ```
    デフォルトでは3002ポートで実行されるので、必要に応じてpackage.jsonの-H 0.0.0.0、-p 3002の部分を修正する
    
4.  動作確認する
    ```
    $ npm run dev
    ```
    ブラウザで"http://サーバのIPアドレス/mdiary"を開く

5.  問題なければビルドする
    ```
    $ npm run build
    ```

6.  手動で起動するか、systemdに登録するなどして起動する
    手動起動の場合
    ```
    $ npm run start
    ```

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

TODO
-----
*   不要なログ出力・コンソール出力を除去する
*   ドキュメントを整備する
*   固定的にポート指定しているところを修正する