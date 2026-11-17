# SSGの将来性とVitePress v2移行の参考調査

状態：2026-11-17、公式情報調査と隔離環境での移行実験を完了。
判断者：プロジェクトオーナー。次の対応：v2を含めた選定方針のレビュー。
現行版の比較とは分離した参考情報。選定まで保持し、採用後の条件は意思決定記録へ移す。

## 結論

オーナーの見立ては概ね妥当。ただし「安定」「実用レベル」「今後の開発」は別々に判断する必要がある。
VitePress v2は単なる将来構想ではなく、公式導入経路と実際に動く実装を持つため、今回の選定で考慮すべきである。
今回のPoCを移行する変更は小さかった。一方、alphaである以上、次のalphaや正式版へも同じ小コストで移行できる保証はない。
Starlightもbetaで、マイナー更新の破壊的変更は可能性に留まらず実例がある。

## 確認できた事実と推測

| 対象         | 確認した事実                                                                              | そこからの見立て・未確定事項                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| VitePress v1 | npm latestは1.6.4。リリース日は2025-08-05。公式サイトはv1の資料を別に案内                 | 新機能の中心はv2と推測できる。ただしv1のEOL、LTS、backport期間の保証は調査した公式資料で見つからず、「保守終了」とは断定しない |
| VitePress v2 | npm nextは2.0.0-alpha.21（2026-10-25）。公式quickstartはvitepress@nextとNode 22以上を案内 | 評価対象とする根拠は十分。ただし公式導入経路であることは互換性・本番品質の保証ではない                                         |
| Starlight    | npm latestは0.43.1。公式導入資料はbetaと明記。0.43.0に破壊的変更あり                      | minor更新でも変更履歴・部品・CSSの確認が必要。v1公開時期や今後の互換性を断定しない                                             |

根拠：[VitePress quickstart](https://vitepress.dev/guide/getting-started)、
[v1変更履歴](https://github.com/vuejs/vitepress/blob/v1.6.4/CHANGELOG.md)、
[v2 alpha.21リリース](https://github.com/vuejs/vitepress/releases/tag/v2.0.0-alpha.21)、
[Starlight導入資料](https://starlight.astro.build/getting-started/)。
配布タグは当日のnpm viewでも確認した。タグは将来変わるため、実験ではalpha.21を厳密固定した。

VitePressのメンテナーは2026-08-08時点でbeta前に破壊的変更を進めていると説明し、時期は不確定としていた。
正式版公開日の保証としては使わない。[公式リポジトリの議論 #5201](https://github.com/vuejs/vitepress/issues/5201)。
開発継続は確認できるが、長期の人員・資金・サポート継続を保証する材料ではない。両プロジェクトの将来の優劣を断定する点数化はしない。

## v2の変更点と本プロジェクトへの影響

[alpha.21までの公式変更履歴](https://github.com/vuejs/vitepress/blob/v2.0.0-alpha.21/CHANGELOG.md)に基づく。

| 変更                                                         | 影響                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| alpha.18: Vite 8、Node 20対応終了                            | 本プロジェクトのNode 22.23.4は変更不要だった。依存lockfileは更新が必要                |
| alpha.19: markdown.attrs.disableを廃止                       | attrs: { disable: true }をattrs: falseへ変更。実際に型検査で検出                      |
| Markdown非同期render対応・型変更                             | 独自fallbackレンダラーは重点回帰項目。今回の出力検証は合格                            |
| alpha.19のCSS・非推奨API変更、alpha.20のナビゲーション再設計 | カスタムテーマとモバイルを再確認する必要がある。未使用APIの変更まで移行作業と数えない |
| alpha.21の中国語・日本語検索分割                             | 既存v1の検索制約をそのままv2に適用できない。実験でも改善を確認                        |

## 隔離移行実験

ベースはドキュメントプロジェクト`9a82193`。`.generated/v2-trial`へ独立cloneし、VitePressだけを2.0.0-alpha.21へ更新。
主作業環境のpackage.json、lockfile、候補実装、プレビュー参照先は変更していない。
Node 22.23.4／npm 11.11.0、同じ6文書×stable/next、同じ翻訳で比較した。
第三候補を通常CIへ追加したわけではない。

実施した変更は次の4ファイルに限定された。

- package.json：VitePressバージョンの更新。
- package-lock.json：依存更新。初回installで旧Vite 5/esbuildが残りnpm lsでpeer不整合を検出したため、npm update vite esbuild --ignore-scriptsで再解決。
- candidates/vitepress/config.ts：attrsをfalseに変更。
- src/publishing/search-probe.ts：v2のtokenizeSearchTextを利用し、検索結果IDへeditionのbaseを付加。

最後の変更はサイト本体の不具合修正ではなく、比較スクリプトのv2対応である。
導入済みv2のVPLocalSearchBox.vueは検索結果にwithBaseを適用し、support/local-search.jsはtokenizeSearchTextを使っていた。
旧probeはbaseなしのIDを誤って範囲外と判定した。この失敗をv2サイトのリンク切れと解釈しない。

| 検証                                          | 結果                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| format・lint・TypeScript/Vue型検査・51テスト  | 調整後成功                                                                             |
| stable/nextのVitePress v2とStarlightの4ビルド | 成功。統合HTML、内部リンク、fallback注釈、本文言語、版切替位置・リンクを既存検証で確認 |
| HTTP検証                                      | 成功                                                                                   |
| 検索64照会                                    | v2対応probeで成功。結果URLとフラグメントも確認                                         |
| npm ls vite esbuild --all                     | 依存再解決後成功。Vite 8.3.8                                                           |
| npm audit                                     | 初回は2項目、依存再解決後0項目。両候補を含む実験lockfile全体の当日結果                 |
| ブラウザの見た目・クリック・モバイル          | 今回未実施。v1に対する既存のオーナー評価をv2へ流用しない                               |
| Ubuntu CI・Pages配信                          | このv2構成では未実施                                                                   |

最終成果物：`.generated/v2-trial/.generated/previews/combined-0kOIn1`。
search.jsonに結果、実験checkoutに差分とlockfile、`.generated/v2-audit-final.json`に監査結果を保持。
HTTPの54168/54169、失敗した旧probeの54174、修正版の57016は全て解放済み。
ホスト側でv2-trialを参照するNodeプロセスが残っていないことも確認した。

next日本語のProfiling Guideについて、v1で結果に含まれなかったOpenTelemetryと全体が、v2ではどちらも結果に含まれた。
これは少数語句のエンジンAPI検証であり、ブラウザ検索UIや日本語検索全般の品質保証ではない。
検索の重みを低くする既存判断は変更しない。

## 再実行の要点

独立したcheckoutでのみ次を行う。親プロジェクトの通常手順とは別の移行試験である。

```sh
npm install --save-dev --save-exact vitepress@2.0.0-alpha.21 --ignore-scripts
npm update vite esbuild --ignore-scripts
```

設定のattrsをfalseへ変更。probeでは以下のimportを追加し、MiniSearch.loadJSONのoptionsへtokenize: tokenizeSearchTextを渡す。
結果IDを`/docs/vitepress/${edition}${String(result.id)}`として検証する。これは今回のbase構成専用である。

```ts
import { tokenizeSearchText } from "vitepress/dist/client/shared.js";
```

その後format:write、check、source:acquire、previews:build、previews:verify、search:verify、npm ls、npm auditを実行する。
この内部モジュール参照もalpha.21に依存する検証専用処理であり、将来のAPI互換性は保証されない。
再解決される推移依存は日付で変わるため、完全再現には今回の実験lockfileを使用する。

## Starlightの更新リスク

0.43.0ではCSSスコープ戦略がAstroの設定に従うようになり、既定のセレクター詳細度も変わった。
ThemeSelectの旧API削除やi18nextのメジャー更新も注意事項として記載されている。
[Starlight変更履歴](https://github.com/withastro/starlight/blob/main/packages/starlight/CHANGELOG.md)。

今回の0.43.1はそれらを含む状態で動作確認済みだが、次のminorでも同様の確認が必要。
LanguageSelectの上書き、独自CSS、翻訳API、Astro/processor/loaderとの組合せが更新確認点となる。
標準fallbackの保守上の利点は残るが、Starlightを互換性リスクのない選択肢として提示しない。

## 選定への反映（推論）

- v1固定で始める場合：現在のブラウザ・CI実績を利用できる。一方で将来のv2移行と依存対応を計画に含める。v1の長期保守を前提にしない。
- v2で始める場合：今回の移行は小さく、日本語検索と依存更新に実益があった。有力な採用候補として扱える。ただし厳密固定、更新ごとの検証、ブラウザ・CI確認を採用条件とする。
- Starlightで始める場合：標準fallbackの利点はあるが、minor更新を無条件で受け入れず、変更履歴とテーマ・型検査を確認する。

従来の「現行版ではStarlightを小差で推奨」は維持するが、v2を含む総合選定では優位はさらに限定的。
v1の監査指摘・検索制約をVitePress全体の将来の欠点として使わない。
現時点でv2を除外する根拠はなく、選択肢はStarlightとVitePress v2の双方を有力とする。
v2採用を検討する場合は、今回未実施のブラウザ・Ubuntu CI確認を次の受け入れ工程とする。
