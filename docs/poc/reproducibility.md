# クリーンクローンでの再現性とCI確認

状態：2026-11-17にローカルの独立クローン検証とGitHub Actions上のCI検証を完了。
判断者：プロジェクトオーナー。次の対応：保守コストと比較評価を整理する。Pages公開は未実施。
SSG選定・PoC終了まで証拠として保持し、実行手順は開発資料に維持する。

## ローカルの再現性

検証対象はコミット`7790e7ba2fcfefd79fb93efd31f9460de6d276cf`。
同じWindowsマシン上で、コミット済み内容だけを`git clone --no-hardlinks`で別ディレクトリへ取得した。
チェックアウト時の改行変換は無効にした。既存のnode_modules・生成物はコピーしていない。
インストール前にそれらが存在しないことを確認し、空の専用npmキャッシュを使った。

検証場所：`.generated/repro-916ea805/checkout`。
Node 22.23.4／npm 11.11.0を使用し、次の全コマンドに成功した。

| コマンド                                       | 結果                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| `npm ci --ignore-scripts --cache ../npm-cache` | 依存485パッケージを新規インストール                    |
| `npm run check`                                | format・lint・TypeScript/Vue型検査・51テストに成功     |
| `npm run source:acquire`                       | 公開gitlodeからstable／nextを新規取得し、固定SHAを確認 |
| `npm run content:stage`                        | 各バージョン6文書をステージング                        |
| `npm run previews:build`                       | 両SSG×両バージョンの4ビルドと統合出力検証に成功        |
| `npm run previews:verify`                      | HTTP確認に成功                                         |
| `npm run search:verify`                        | 64通りの照会と検索結果URL・フラグメント検証に成功      |

終了後のクローンはGit上で変更なし。HTTP確認の58169／58170、検索確認の58175はホストで解放を確認し、
検証クローンを参照するNodeプロセスも残っていない。元の作業ディレクトリのプレビュー参照先は変更していない。
診断用のクローン・キャッシュ・生成物は無視対象の`.generated/`内に保持している。

これは同一マシン上の新規インストール・再ビルドの確認であり、別OSやGitHub Actionsでの成功とは区別する。
このローカル検証時点では、GitHubから対象コミットをクローンする確認は未実施だった。後述のCIではGitHubからPRを取得して検証した。

## 出力の比較

新しい成果物はクローン内の`.generated/previews/combined-NAl3oY/dist`。
以前の検索有効版`combined-tf2nRh/dist`との比較では、どちらも260ファイルだった。
64通りの検索結果は、URLとタイトルの集合として一致した。

ただし、出力ファイルの全バイト一致はしていない。ハッシュ付きアセット名や生成HTMLに差があり、
StarlightのCSSは生成されたスコープIDを除くと一致した。VitePressの検索インデックスにもバイト差がある。
今回確認したのは機能・入力固定・実行手順の再現性であり、ビット単位の再現可能ビルドを達成したとは扱わない。
全差分の原因解明・ビット単位の一致は今回のPoCの追加要件にはしない。

## CI設定の監査

`.github/workflows/docs.yml`は次の構成である。

- Ubuntuで実行し、Node/npmとロックファイルを使用する。
- PR、mainへのpush、手動実行を入口とする。
- 権限は`contents: read`。checkoutで認証情報を保持しない。
- インストール、check、取得・ステージング、4ビルド、HTTP、検索を検証する。
- デプロイ処理やPages/OIDCの書き込み権限は持たない。

コードとロックファイルの確認では、Ubuntu実行を妨げる明確な問題は見つからなかった。
シンボリックリンクのテストはOS差を考慮し、Gitテストのユーザー情報は明示されている。
これは静的監査であり、Ubuntu上での実行成功を意味しない。

## GitHub上の初回確認とCI結果

push前のGitHub APIの読み取りでは、リモートにあるブランチはmainのみと確認した。
mainは`f5e4a7ceb821555e16eccae2835a80df78462573`で、CI定義はまだ存在しない。
ローカル検証対象コミットの取得は「コミットなし」、対応するworkflow runは0件だった。

現行設定では作業ブランチをpushするだけではCIが起動しない。既存設定のまま検証するには、
`work/initial-poc`をpushし、main向けのDraft PRを作成する。
mainにCI定義がないため、現時点では手動実行を代わりに使うこともできない。
その後、オーナーの承認を得てpushし、[Draft PR #1](https://github.com/gitlode/docs/pull/1)を作成した。
head `4420aec8a04fc39c9139de0692984536fb47ca27`に対する
[CI run 44033616926](https://github.com/gitlode/docs/actions/runs/44033616926)は全工程成功。
PRのマージ参照をcheckoutしたUbuntu上で、インストール、51テストを含むcheck、取得・ステージング、4ビルド、HTTP、64通りの検索検証を完了した。
ログで確認用リスナーの終了とジョブ終了も確認した。ローカル側では新たなサーバーを起動していない。
成果物のアップロード・Pagesデプロイは現行CIに含まれない。
GitHub側の公開準備は[設定メモ](github-setup.md)に整理した。
PRは検証・レビュー用であり、マージ・SSG選定・公開の承認とは別である。

## 残る指摘

- インストール時の依存監査は従来どおり3件（moderate 2、high 1）。今回新たに解消したとは扱わない。
- Starlightの任意i18nコレクション・独自404に関する既知の警告は残る。
- GitHub Actionsのcheckout@v4/setup-node@v4にNode 20非推奨・Node 24への強制移行警告が出た。今回の実行は成功したが、Actionsのバージョン更新は保守項目として残す。プロジェクトのNode 22とは別のランタイムである。
