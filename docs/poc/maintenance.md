# 構築・保守コストの比較

状態：2026-11-17、実装レビュー完了。判断者：プロジェクトオーナー。
対象：`fe456be`時点の実装（VitePress 1.6.4、Astro 7.4.12、Starlight 0.43.1）。
次の対応：選定提案のレビュー。選定まで根拠を保持し、採用後の保守手順を英語の開発資料へ移す。

## 共通部分

取得refの固定、公開allowlist、ナビゲーション、翻訳元ファイルのハッシュ管理、Markdownの安全化、リンク解決、stable／nextの独立ビルドと統合、出力検証は共通処理である。
これらは今回の要件に由来し、SSGを変えてもなくならない。Starlightの標準fallbackも翻訳元の変更検知や翻訳レビューを代行しない。

## 現行実装の比較

| 項目           | VitePress                                                                     | Starlight                                                                              |
| -------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 主設定         | config.tsに言語、sidebar、検索、Markdown制限、fallbackレンダラー              | astro.config.mjsに統合、言語、sidebar、検索、unified processor。別にcontent loader設定 |
| 未翻訳         | アダプターで英語本文の日本語ページを生成。レンダラーで警告と本文lang=enを追加 | 日本語ファイルを生成せず標準fallbackに任せる                                           |
| バージョン切替 | theme/index.tsとVersionSwitch.vue、テーマslotを利用                           | VersionedLanguageSelect.astroで標準LanguageSelectを包む                                |
| 型検査         | tscとvue-tscで設定・Vueテンプレートまで検査                                   | .astro、content.config.ts、.mjsの専用型検査が未導入                                    |
| 検索有効化     | local provider設定                                                            | Pagefind設定                                                                           |
| 文書配置       | content配下。本文H1を保持                                                     | content collection配下。title frontmatterへ移して本文H1を除去                          |
| 更新時の注意   | Vueコンパイル、Markdown拡張、別版へのSPA遷移                                  | Astro/Starlight/processorの互換性、loader、部品上書き                                  |

根拠は`candidates/`、`src/publishing/previews.ts`（未翻訳分岐と生成設定）、`package.json`、`tsconfig.json`。
候補ディレクトリの手書きファイルはVitePress 5ファイル147行、Starlight 3ファイル88行
（空行・コメント・型定義・型検査設定を含み、共通faviconを除く）。共通アダプター内の分岐とテストは含まない。
配置を把握する補助値であり、工数比ではない。型定義を無駄なコードとも評価しない。

VitePressの標準navにはドロップダウンとtarget設定がある。簡易切替を移す余地はあるが、別ビルドへのフル遷移、base、配置、モバイルは再確認が必要。
今回のVue部品が必須とは断定しない。[公式nav設定](https://vitepress.dev/reference/default-theme-nav)。
Starlightの標準fallbackは実装・出力で確認済みで、[公式i18nガイド](https://starlight.astro.build/guides/i18n/)にも説明がある。
標準機能でも更新時の回帰検証は必要。

Astroのビルド成功は専用型検査の代わりではない。この差は現行PoCの改善点であり、Astroに型サポートがないという意味ではない。
両候補とも信頼した生成JSONを読み込むが、そこに実行時schema検証はない。チームの学習コストは未測定。

## 日々の保守

| 変更           | 作業と違い                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| 正本の更新     | 両者ともpin更新、取得、差分・翻訳鮮度確認、ビルド                                                                     |
| 文書・翻訳追加 | allowlist、navigation、manifestを明示更新。出力の違いはアダプターが吸収                                               |
| バージョン追加 | 両者ともstable/next固定処理・UI・検証の見直しが必要                                                                   |
| SSG更新        | 型・テスト・全版ビルド・HTTP・検索・ブラウザ確認。VPはfallbackレンダラー、SLはprocessor・loader・上書き部品を重点確認 |
| 検索更新       | 比較probeがMiniSearch/Pagefind生成形式に依存するため再確認                                                            |

## 依存関係と警告

今回npm auditを再実行し、moderate 2・high 1の計3パッケージ項目を確認した。
対象はesbuild、Vite、VitePress。自動修正案はfixAvailable: false。
記録は`.generated/evaluation-audit.json`。件数は独立した脆弱性3件を意味するとは限らない。
比較環境全体の監査であり、採用候補だけに整理した後は再実行する。

プレビューは独立した静的サーバーを使い、Vite開発サーバーを公開しない。ただし指摘が解消したとは扱わず、採用時は公開前に対応方針を確定する。
詳細・advisoryは[英語段階の記録](english-previews.md#dependency-audit-follow-up)を参照。
Starlightを選べば将来の監査問題もなくなるとは主張しない。

Starlightには任意i18n collection・独自404の既知の警告が残る。
CIのcheckout/setup-node v4にもActionsランタイム非推奨警告がある。後者は共通の保守項目。

## 性能と確認範囲

検索有効時の既存測定はstableがVP 4,877ms／SL 4,967ms、nextがVP 4,895ms／SL 4,795ms。
全候補の成果物合計は9,227,663バイトで、1ページの転送量ではない。
少数文書の単発測定なので性能・大規模化の優劣はつけない。[検索段階の測定](search.md)を参照。

Windows独立クローンとUbuntu CIで両者成功。生成物は全バイト一致ではない。
オーナーのブラウザ確認は主要機能の受け入れ根拠とし、網羅的なアクセシビリティ、端末・ブラウザ網羅、実Pages配信、大規模文書群まで確認済みとは扱わない。

## 本番移行へ残す共通項目

- 公開対象外文書へのGitHubリンクはPoCで許容済み。本番の公開範囲確定後に必要な内部リンクを解決する。
- 明示的な画像・アセット公開と検証。リンクを辿った自動公開はしない。
- stable翻訳snapshot方針と日本語例文の人によるレビュー。ハッシュ一致は翻訳の承認ではない。
- 採用候補に絞ったURL構成、完全なPages成果物、公開ワークフローと実サイト確認。

これらは候補の優劣へ付け替えず、選定後の共通作業として管理する。
