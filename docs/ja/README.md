# ⚡ inmem-memo (日本語版ドキュメント)

> [English Version / 英語版 README はこちら](../../README.md)

<div align="center">

<img src="../../src/assets/icon.png" width="128" height="128" alt="inmem-memo Icon" />

### 超高速・完全インメモリ型スクラッチパッド メモアプリケーション
**npm / npx で即座に起動・インストール可能（Windows / macOS / Linux マルチプラットフォーム対応）**

[![npm version](https://img.shields.io/npm/v/inmem-memo.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/inmem-memo)
[![Framework: Tauri v2](https://img.shields.io/badge/Framework-Tauri%20v2.0-6366f1.svg?style=flat-square&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%205-61dafb.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Storage: In-Memory Only](https://img.shields.io/badge/Storage-In--Memory%20Only-f59e0b.svg?style=flat-square)](https://github.com/jakelizzI/inmem-memo)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=flat-square)](../../LICENSE)

</div>

---

> 💡 **本プロジェクトについて**:  
> 本ソフトウェアは、AI との対話による **バイブコーディング (Vibe Coding)** によって高速に設計・実装・最適化されたアプリケーションです。

---

## 🚀 クイックスタート (npm / npx)

Node.js がインストールされていれば、**インストール不要で今すぐ実行**できます：

```bash
# インストールなしで即座に起動
npx inmem-memo
```

グローバルコマンドとして常駐させたい場合：

```bash
# グローバルインストール
npm install -g inmem-memo

# どこからでも起動
inmem-memo
```

> [!TIP]
> **🍎 macOS で初回起動時にセキュリティ警告が表示された場合**  
> Mac の **「システム設定」➔「プライバシーとセキュリティ」** を開き、画面下部の「"inmem-memo" は開発元を確認できないためブロックされました」の横にある **「このまま開く (Open Anyway)」** を1回クリックしてください。以降は通常通り起動します。

---

## 📖 コンセプト

**「すぐに書いて、すぐに捨てる。」**

日常のコーディングや作業中に発生する一時的なJSONの確認、正規表現による文字列置換、作業ログの控えなど、「保存する必要はないが今すぐ広げて使いたい」メモに特化した軽量スクラッチパッドです。

タイトル編集・ファイル保存・フォルダ階層・検索インデックスといった複雑な管理機能をあえて排除し、**Rust + Tauri v2 による極限の高速起動と軽量性、完全なインメモリ設計**を実現しています。

---

## 🌟 主な機能・特長

### 1. 🛡️ 完全インメモリ保護ポリシー (Pure In-Memory)
- **メモ本文の非永続化**: メモ内容はハードディスク・データベース・localStorage に一切書き込まれません。
- **プロセスの完全終了とデータ破棄**: アプリケーションを完全に終了（設定画面の「アプリを完全終了」またはトレイメニューの「Quit」）すると、OSのメモリ解放によりデータは即座に完全消滅します。
- **macOS / 各 OS での完全終了保証**: `std::process::exit(0)` により、ウィンドウ閉じる防止（`prevent_close`）に阻まれることなく OS レベルで確実に完全終了。
- **誤終了防止**: テキスト入力中にウィンドウを閉じようとした場合のアンロード警告を標準装備。

### 2. ⚡ 右側クイックアクション・ツールバー (JSON整形 & 正規表現置換)
- **JSON自動整形 (JSON Format)**:
  - ツールバー最上段に標準配置。崩れたJSON文字列をインデント付き（2スペース）で瞬時に美しく自動整形。
- **カスタム正規表現アクション**:
  - 設定画面から「よく使う正規表現置換」をユーザー自身で自由に追加・編集・並べ替え・保存可能。
  - **フラグ一覧・設定例ヘルプガイド**: `g` (全体), `m` (複数行), `i` (大小無視), `s` (改行一致) の意味がひと目でわかり、ワンクリックで適用できるクイック選択チップ（`gm`, `g`, `gi`）を搭載。
  - **複数行（マルチライン）リアルタイム動作テスト**: 2ペイン（入力テキスト ➔ 置換結果プレビュー）のテキストエリアで、行頭 `^` や行末 `$`、改行 `\n`、空行削除の挙動を編集しながら直感的にテスト可能。
  - **ワンクリック追加プリセット**:
    - 「空行を削除」(`^\s*$\n` ➔ `""`)
    - 「行末スペース削除」(`[ \t]+$` ➔ `""`)
    - 「カンマを改行に」(`,\s*` ➔ `\n`)
    - 「HTMLタグ除去」(`<[^>]+>` ➔ `""`)
    - 「連続空白を1つに」(`[ \t]+` ➔ `" "`)

### 3. 📝 高機能・超軽量エディタ (行番号・シンタックスハイライト・コード折りたたみ)
- **行番号表示 (ON / OFF 切替)**:
  - エディタ左端に行番号を表示。アクティブ行の強調表示付き。設定画面からいつでも ON / OFF 切替可能。
- **自前シンタックスハイライト (完全依存ゼロの高速トークナイザー)**:
  - **JSON, YAML, JavaScript, Markdown** の構文を自前正規表現で瞬時に解析・色分け。
  - 3つのカラーテーマに完全連動。ステータスバー左下に言語判定バッジ（`JSON`, `YAML`, `JS`, `Markdown`, `Plain`）をリアルタイム表示。
- **エディタ内コード折りたたみ (Code Folding)**:
  - JSON オブジェクト `{...}`、配列 `[...]`、YAML のインデント階層をエディタ左端のアイコン（▼ / ▶）から直接折りたたみ／展開可能。
- **インデント幅設定**:
  - 2スペース / 4スペースを切り替え可能。`Tab` キーによるインデント挿入にも完全対応。

### 4. 🎨 3種類のカラーテーマ & インタラクティブ文字サイズ変更
- **選べる 3 つの外観テーマ**:
  - **Midnight Dark**: 深い夜空のグラデーションが美しいダークモード
  - **OLED Pure Black**: 高コントラストで省電力な完全な漆黒
  - **Clean Light**: 爽やかで明るい白基調のライトモード
- **文字サイズの伸縮**:
  - 設定画面での数値入力、および **`Ctrl + マウスホイール`**（Mac: `Cmd + Wheel`）によるサイレントな滑らかズームに対応。
- **Markdown プレビュー**: `Preview` ボタンでエディタとレンダリング表示をシームレスに切り替え（DOMPurify による XSS 対策済み）。
- **リアルタイムメトリクス**: ステータスバーに文字数・単語数・行数・構文判定バッジおよびバージョン（`v1.3.2`）を表示。

### 5. 📑 2カラム縦並びサイドバー設定画面
- 設定モーダルを横スクロール式から **macOS / VS Code スタイルの左側縦並びサイドバー（2カラム）** に刷新。
- ショートカット、正規表現アクション、外観・フォント、エディタ設定（行番号・折りたたみ・ハイライト）、メモリ・終了の各項目へ瞬時にアクセス可能です。

### 6. ↩️ `Ctrl + Z` (Undo) & `Ctrl + Y` (Redo) 履歴スタックの完全サポート
- JSON整形や正規表現アクションを実行した後でも、**`Ctrl + Z`（Mac: `Cmd + Z`）** を押すだけで、アクション実行前の元のテキストへ一瞬で完璧に巻き戻せます。
- やり直したい場合は **`Ctrl + Y`** または **`Ctrl + Shift + Z`（Mac: `Cmd + Shift + Z`）** で復元可能。
- ヘッダーにも視覚的な「↩️ 戻す」「↪️ やり直す」アイコンボタンを搭載。

### 7. ⌨️ グローバルショートカット & タスクトレイ常駐
- **常駐バックグラウンド待機**: ウィンドウの「×」ボタンを押すと、プロセスを終了せずにタスクトレイ（Windows）/ メニューバー（macOS）へ最小化。
- **瞬時のホットキー呼び出し**:
  - 別の作業中（ブラウザやIDEなど）でも、ショートカットキーを押すだけで画面最前面に即座にポップアップ表示 / 非表示。
  - デフォルトは `Ctrl + Shift + M`（Mac: `Cmd + Shift + M`）。
  - 設定画面の**キー入力レコーダー**で、お好みのショートカットキーに直感的に変更可能（即時反映）。

---

## ⌨️ ショートカットキー一覧

| ショートカット | 動作 |
|---|---|
| `Ctrl + Shift + M` (Mac: `Cmd + Shift + M`) | **グローバル呼び出し**（アプリの表示 / 非表示トグル）※設定で変更可能 |
| `Ctrl + マウスホイール` (Mac: `Cmd + Wheel`) | **文字サイズ変更**（エディタのテキストを直感的に拡大・縮小） |
| `Ctrl + Z` (Mac: `Cmd + Z`) | **元に戻す (Undo)**（手入力・JSON整形・正規表現置換の直前状態へ復元） |
| `Ctrl + Y` / `Ctrl + Shift + Z` | **やり直す (Redo)** |
| `Tab` | エディタ内でのインデント挿入（スペース 2/4） |
| 「×」閉じるボタン / トレイクリック | ウィンドウをトレイに隠す（メモリ上のメモデータは維持） |

---

## 🏗️ 技術スタック & アーキテクチャ

- **コアバックエンド**: [Tauri v2 (2.0)](https://v2.tauri.app/) (Rust)
  - `tauri-plugin-global-shortcut`: システム全体のホットキーバインド
  - `tray-icon`: システムトレイ・メニューバー常駐
  - `include_image!`: ネイティブアイコン埋め込み
- **フロントエンド**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [Lucide Icons](https://lucide.dev/) + [DOMPurify](https://github.com/cure53/DOMPurify)
- **スタイリング**: Vanilla CSS (CSS Variables, Flex/Grid, Glassmorphism, Animations)
- **配信・パッケージング**:
  - npm: CLI 自動ランナー (`inmem-memo`) ※Sigstore Provenance 署名付き
  - GitHub Actions: Windows (`.exe`, `.msi`), macOS (`.dmg`), Linux (`.AppImage`, `.deb`, `.rpm`) 自動ビルド

---

## 💻 ローカル開発・ソースコードからのビルド

```powershell
# リポジトリのクローン
git clone https://github.com/jakelizzI/inmem-memo.git
cd inmem-memo

# 依存パッケージのインストール
npm install

# フロントエンド開発サーバーの起動 (ブラウザ確認)
npm run dev

# Tauri デスクトップアプリのローカル開発起動
npm run tauri dev

# プロダクションビルド
npm run tauri build
```

---

## 📄 ライセンス

[MIT License](../../LICENSE) © 2026 [jakelizzI](https://github.com/jakelizzI/inmem-memo)
