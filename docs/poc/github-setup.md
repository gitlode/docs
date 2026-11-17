# GitHub側の設定とPages公開の準備

状態：2026-11-17。Draft PR #1を作成済み。公開ワークフローは未実装、Pagesへのデプロイは未実施。
判断者：プロジェクトオーナー。公開準備時に設定を確認し、運用手順が確定したら英語の開発資料へ移す。

## 今回のCI確認

[PR #1](https://github.com/gitlode/docs/pull/1)でGitHub Actionsの`Documentation validation`が起動した。
GitHub ActionsがCIの実行環境、GitHub Pagesが生成済みサイトの公開先であり、別の役割を持つ。
現行ワークフローはインストール・テスト・サイト構築・HTTP・検索検証を行う。Pages設定や追加Secretは不要。
この実行を始めるための人による追加設定は必要なかった。

## 公開開始時に人が確認する設定

| 場所                                                                             | 必要な操作・判断                                                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Settings → Pages](https://github.com/gitlode/docs/settings/pages)               | Build and deploymentのSourceを **GitHub Actions** にする。設定済みなら変更不要。adminまたはmaintainer権限が必要。                                                               |
| [Settings → Actions → General](https://github.com/gitlode/docs/settings/actions) | Actionsを許可し、公開用に使うGitHub公式Actionsも組織ポリシーで許可されていることを確認する。現在のcheckout/setup-nodeは今回実行できている。                                     |
| [Settings → Environments](https://github.com/gitlode/docs/settings/environments) | 公開用`github-pages`環境の許可ブランチを公開元に合わせる。mainから公開する設計ならmainを許可する。必要に応じてレビュー必須にし、その場合はデプロイごとに人が承認する。          |
| 公開先URL                                                                        | 標準URLか独自ドメインかを決める。標準のプロジェクトサイトを使う場合の想定は`https://gitlode.github.io/docs/`で、現在の`/docs/`ベースと対応する。まだ公開確認済みのURLではない。 |

PagesやEnvironmentの現在の設定値は今回取得していないため、未設定と断定していない。
組織ポリシーによって設定変更が制限されている場合は組織管理者の対応が必要。
公式手順：[公開元の設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、
[Actionsの許可設定](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)。

独自ドメインは今回のCI検証に不要。採用する場合のみドメイン所有確認、DNS、PagesのCustom domainとHTTPS設定を別途行う。
参考：[独自ドメインの管理](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)。

## リポジトリ側で実装するもの

公開設定だけではサイトは配信されない。公開前に以下をコードとして追加・レビューする。

- 検証に成功した完全な静的成果物を`actions/upload-pages-artifact`で渡す処理。既存サイトへの追記はしない。
- `actions/configure-pages`と`actions/deploy-pages`を使う公開ジョブ。
- 公開ジョブに限定した`pages: write`と`id-token: write`、`github-pages`環境、およびビルド成功への依存。
- 承認した公開元からだけデプロイする条件と、重複デプロイの制御。PR検証は引き続き読み取り権限で実行する。
- Pagesでのリンク、アセット、言語・バージョン切替、検索、404の実サイト確認。

標準のPages Actions構成では個人用PATやデプロイ鍵を追加する必要はない。
権限はワークフローの公開ジョブで付与し、リポジトリ全体の既定トークン権限を一律書き込みへ変更しない。
実装時は[カスタムPagesワークフローの公式手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)に合わせる。

## 今回の境界

今回承認された操作は作業ブランチのpushとDraft PR作成。マージ・SSG選定・公開開始は別の判断として残す。
次のPoC作業はCI結果の記録と比較評価の整理であり、上記の公開設定を今すぐ変更する必要はない。
