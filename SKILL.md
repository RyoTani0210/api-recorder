---
name: api-recorder
description: "WebページのAPIリクエスト/レスポンスを記録するスキル。以下の場合に使用: (1) ユーザ操作中のAPIトラフィックのキャプチャ, (2) APIシナリオログの生成, (3) テスト設計者向けのAPI仕様ドキュメント作成"
---

# API Recorder

## 概要

Webサイトのユーザ操作中に発生するAPIリクエスト/レスポンスを記録し、JSONログとして保存するスキルです。Playwrightを使用してブラウザを起動し、ネットワーク通信を監視します。

## 対応環境

| 環境 | 対応状況 |
|------|---------|
| Claude Code | ✅ |
| Claude Desktop | ✅ |
| Claude.ai (Computer Use) | ✅ |

## セットアップ

### 1. 依存関係のインストール

```bash
cd /path/to/api-recorder
npm install
```

### 2. Playwrightブラウザのインストール（初回のみ）

```bash
npx playwright install chromium
```

## 使い方

### 基本コマンド

```bash
node src/cli.js --url <URL> [options]
```

### オプション一覧

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|-------|------|-----------|
| `--url` | `-u` | 対象URL（必須） | - |
| `--scenario` | `-s` | シナリオ名 | `scenario_YYYYMMDD_HHMMSS` |
| `--output` | `-o` | 出力ファイルパス | `<timestamp>_<scenario>.json` |
| `--duration` | `-d` | 記録時間（秒） | 60 |
| `--include` | `-i` | 記録対象パターン（カンマ区切り） | `/api/` |
| `--exclude` | `-e` | 除外パターン（カンマ区切り） | 静的ファイル |
| `--headless` | - | ヘッドレスモード | false |
| `--body-limit` | - | レスポンスサイズ上限（バイト） | 10000 |

### 実行例

**基本的な記録:**
```bash
node src/cli.js --url https://automationintesting.online/ --scenario "部屋予約フロー"
```

**長時間記録:**
```bash
node src/cli.js -u https://example.com -d 300 -s "full_scenario"
```

**特定のAPIのみ記録:**
```bash
node src/cli.js -u https://example.com -i "/api/room,/api/booking"
```

**ヘッドレスモード（CI向け）:**
```bash
node src/cli.js -u https://example.com --headless -d 30
```

## ワークフロー

### Claude Code / Claude Desktop での使用

```
ユーザ: このサイトのAPIを記録して https://automationintesting.online/

Claude: 了解しました。APIレコーダーを実行します。

        [bash実行]
        cd /path/to/api-recorder
        npm install
        node src/cli.js --url https://automationintesting.online/ --scenario "hotel_api" --duration 60

        ブラウザが開きました。60秒間操作してください。
        記録を早く終了したい場合は Ctrl+C を押してください。

        [60秒後または Ctrl+C 後]
        
        記録が完了しました。
        出力ファイル: 20251221_153000_hotel_api.json
        記録されたAPI: 12件
```

### 対話的な使用

1. Claudeに「APIを記録したい」と伝える
2. URLとシナリオ名を指定
3. ブラウザが開いたら操作を行う
4. 時間経過または Ctrl+C で記録終了
5. JSONファイルが出力される

## 出力フォーマット

```json
{
  "scenario": "部屋予約フロー",
  "recorded_at": "2025-12-21T15:30:00.000Z",
  "base_url": "https://automationintesting.online",
  "config": {
    "include_patterns": ["/api/"],
    "exclude_patterns": [".css", ".js", ".woff", "..."],
    "body_size_limit": 10000
  },
  "entries": [
    {
      "seq": 1,
      "timestamp": "2025-12-21T15:30:01.234Z",
      "page_url": "https://automationintesting.online/",
      "duration_ms": 156,
      "request": {
        "method": "GET",
        "url": "/api/room",
        "headers": { "accept": "application/json" },
        "body": null
      },
      "response": {
        "status": 200,
        "status_text": "OK",
        "headers": { "content-type": "application/json" },
        "body": { "rooms": [...] },
        "body_truncated": false
      }
    }
  ]
}
```

### レスポンスサイズ超過時

```json
"response": {
  "status": 200,
  "status_text": "OK",
  "headers": { "content-type": "application/json" },
  "body": { "_truncated": true, "_preview": "..." },
  "body_truncated": true,
  "body_original_size": 245000
}
```

## 記録対象のフィルタリング

### include_patterns

URLパスがこのパターンにマッチする場合に記録します。

**デフォルト:** `/api/`

**カスタム例:**
```bash
# 複数のAPIパス
--include "/api/,/v1/,/graphql"

# 全てのリクエスト
--include "*"
```

### exclude_patterns

このパターンにマッチするURLは記録しません。

**デフォルト:** `.css`, `.js`, `.woff`, `.woff2`, `.ttf`, `.ico`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`

**カスタム例:**
```bash
# 除外パターンを追加
--exclude ".css,.js,.map,.woff"
```

## プログラムからの使用

```javascript
const { APIRecorder } = require('./src/recorder.js');

async function main() {
  const recorder = new APIRecorder({
    scenarioName: 'my_scenario',
    includePatterns: ['/api/'],
    headless: false,
    bodySizeLimit: 10000
  });

  // 記録開始
  const page = await recorder.start('https://automationintesting.online/');
  
  // プログラムで操作（オプション）
  // await page.click('button#submit');
  
  // 一定時間待機
  await new Promise(r => setTimeout(r, 30000));
  
  // 記録終了
  const result = await recorder.stop();
  
  // 結果を保存
  require('fs').writeFileSync('output.json', JSON.stringify(result, null, 2));
}

main();
```

## トラブルシューティング

### ブラウザが起動しない

```bash
# Playwrightのブラウザを再インストール
npx playwright install chromium
```

### APIが記録されない

1. `--include` パターンを確認
2. 実際のAPIパスを開発者ツールで確認
3. より広いパターン（例: `*`）で試す

### ヘッドレスモードで動作しない

一部のサイトはヘッドレス検出があります。`--headless` を外して試してください。

### 認証が必要なAPI

1. ヘッドレスモードをオフにする
2. ブラウザでログインしてから操作を続ける
3. 認証トークンはヘッダーに記録される（取り扱い注意）

## 注意事項

- 認証情報（Authorization、Cookieヘッダー等）はそのまま記録されます
- WebSocket通信は記録対象外です
- 記録したログの取り扱いに注意してください

## ファイル構成

```
api-recorder/
├── SKILL.md              # このファイル
├── TUTORIAL.md           # チュートリアル
├── package.json          # 依存関係
├── src/
│   ├── cli.js            # CLIエントリポイント
│   └── recorder.js       # コアロジック
└── examples/
    └── sample_output.json
```
