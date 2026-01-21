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
1.  Node.js 24.12.1をインストールしたLinux環境を用意する
    できればRCSもインストールする(ubuntuであればapt install rcsでインストール)
2.  git cloneでリポジトリをクローンする
3.  設定ファイル(markdown-diary/.env)を設定する
    ```
    $ cd markdown-diary
    $ vi .env
    ```
    *   BETTER_AUTH_SECRETにopenssl rand -base64 32で作成した文字列を設定
    *   DOMAINにドメイン名またはIPアドレスを設定
    *   NEXT_PUBLIC_BASE_PATHにサブディレクトリを使用する場合は"/ディレクトリ名"の形式で設定
    *   NEXT_PUBLIC_BASE_URLにURLを設定
    *   DATA_DIRECTORYにデータを置くディレクトリを設定
    *   RCSを利用する場合はNEXT_PUBLIC_USE_RCSにtrueを設定

4.  利用するパッケージをダウンロードする
    ```
    $ npm install
    ```
    
5.  問題なければビルドする
    ```
    $ npm run build
    ```

6.  手動で起動するか、systemdに登録するなどして起動する
    手動起動の場合
    ```
    $ npm run start
    ```

7.  ブラウザでURLを開き、ユーザ名「admin」、パスワード「admin1234」でログインする
    adminユーザのパスワードは変更してください
