---
name: api-recorder
description: "Record API requests and responses during web interactions using Playwright. Use when capturing API traffic, analyzing network calls, generating API logs, or documenting API behavior for testing."
---

# APIレコーダー

## 概要

Webブラウジングセッション中のHTTP APIリクエストとレスポンスを記録します。リクエスト/レスポンスの詳細、ヘッダー、ボディ、タイミング情報を含むJSONログを生成します。

**使用技術:** Playwright (Chromium)

## クイックスタート

### 基本的な記録

```bash
cd .claude/skills/api-recorder
npm install
node src/cli.js --url https://automationintesting.online/ --scenario "hotel_booking"
```

**何が起こるか:**
1. ターゲットURLでブラウザが開く
2. サイトを操作（クリック、フォーム入力、ナビゲート）
3. すべてのAPI呼び出しが自動的にキャプチャされる
4. Ctrl+Cを押すか、タイムアウトを待つ
5. すべてのAPIトラフィックを含むJSONファイルが保存される

### 出力例

```json
{
  "scenario": "hotel_booking",
  "recorded_at": "2025-12-27T10:30:00.000Z",
  "entries": [
    {
      "seq": 1,
      "request": {
        "method": "GET",
        "url": "/api/room",
        "headers": {...}
      },
      "response": {
        "status": 200,
        "body": {"rooms": [...]},
        "duration_ms": 156
      }
    }
  ]
}
```

## コアワークフロー

1. **CLIディレクトリに移動**
   ```bash
   cd .claude/skills/api-recorder
   ```

2. **依存関係がインストールされていることを確認**
   ```bash
   npm install
   npx playwright install chromium  # 初回のみ
   ```

3. **記録を開始**
   ```bash
   node src/cli.js --url <対象URL> --scenario "シナリオ名"
   ```

4. **サイトを操作**
   - ブラウザが自動的に開く
   - ユーザーアクションを実行（ログイン、フォーム入力、ナビゲート）
   - すべてのAPI呼び出しがバックグラウンドでキャプチャされる

5. **記録を停止**
   - 期間を待つ（デフォルト: 60秒）
   - またはCtrl+Cで早期停止

6. **出力をレビュー**
   - JSONファイルが作成される: `YYYYMMDD_HHMMSS_シナリオ名.json`
   - キャプチャされたすべてのAPIリクエスト/レスポンスを含む

## 一般的なユースケース

### ユースケース1: API発見

**シナリオ:** WebアプリがどのAPIを使用しているか理解する

```bash
node src/cli.js -u https://example.com -s "api_discovery" -d 120
```

**結果:** 操作中に呼び出されたすべてのAPIエンドポイントの完全なログ

### ユースケース2: テストデータ生成

**シナリオ:** テストフィクスチャー用の実際のAPIレスポンスをキャプチャ

```bash
node src/cli.js -u https://staging.example.com -s "test_data" -i "/api/"
```

**結果:** テストモックとして使用可能なJSONレスポンス

### ユースケース3: APIドキュメント作成

**シナリオ:** 実際の例でAPIの動作を文書化

```bash
node src/cli.js -u https://example.com -s "api_docs" --include "/api/v1/"
```

**結果:** ドキュメント用の完全なリクエスト/レスポンス例

## 主要オプション

| オプション | 説明 | 例 |
|--------|-------------|---------|
| `--url` `-u` | 対象URL（必須） | `-u https://example.com` |
| `--scenario` `-s` | シナリオ名 | `-s "user_login"` |
| `--duration` `-d` | 記録時間（秒） | `-d 120` |
| `--include` `-i` | キャプチャするURLパターン | `-i "/api/,/graphql"` |

**デフォルト動作:**
- `/api/`にマッチするURLを記録
- 静的ファイル（.css、.js、画像）を除外
- レスポンスボディを10KBに制限
- ヘッドモードで実行（ブラウザ表示）

## クイック例

**特定のAPIのみ:**
```bash
node src/cli.js -u https://example.com -i "/api/booking"
```

**長時間セッション:**
```bash
node src/cli.js -u https://example.com -d 300
```

**ヘッドレス（CI/CD）:**
```bash
node src/cli.js -u https://example.com --headless -d 60
```

## 認証の処理

**アプローチ:**
1. `--headless`フラグを使用しない
2. UIでブラウザが開く
3. 手動でログイン
4. 操作を続ける
5. 記録が認証済みリクエストをキャプチャ

**注意:** トークンとCookieは出力に保存されます。安全に取り扱ってください。

## キャプチャトラフィックのフィルタリング

### インクルードパターン（何を記録するか）

**デフォルト:** `/api/`（APIエンドポイントのみ）

**カスタム:**
```bash
--include "/api/,/v1/,/graphql"  # 複数パターン
--include "*"                     # すべて
```

### エクスクルードパターン（何を無視するか）

**デフォルト:** 静的ファイル（.css、.js、.woff、画像）

**カスタム:**
```bash
--exclude ".css,.js,.map"  # カスタム除外
```

## 出力構造

各記録には以下が含まれます:

```json
{
  "scenario": "シナリオ名",
  "recorded_at": "ISOタイムスタンプ",
  "base_url": "https://example.com",
  "config": {
    "include_patterns": [...],
    "exclude_patterns": [...]
  },
  "entries": [
    {
      "seq": 1,
      "timestamp": "ISOタイムスタンプ",
      "page_url": "現在のページURL",
      "duration_ms": 156,
      "request": {
        "method": "GET",
        "url": "/api/endpoint",
        "headers": {...},
        "body": {...}
      },
      "response": {
        "status": 200,
        "headers": {...},
        "body": {...},
        "body_truncated": false
      }
    }
  ]
}
```

## プログラマティックな使用

```javascript
const { APIRecorder } = require('./src/recorder.js');

async function record() {
  const recorder = new APIRecorder({
    scenarioName: 'my_scenario',
    includePatterns: ['/api/']
  });

  const page = await recorder.start('https://example.com');

  // オプション: 操作を自動化
  await page.click('button#login');
  await page.fill('input#username', 'test');

  await new Promise(r => setTimeout(r, 30000));

  const result = await recorder.stop();
  console.log(`${result.entries.length}件のAPI呼び出しを記録しました`);
}
```

## トラブルシューティング

### ブラウザが起動しない
```bash
npx playwright install chromium
```

### APIがキャプチャされない
- `--include`パターンが実際のAPIパスとマッチするか確認
- DevToolsのNetworkタブでAPI URLを確認
- `--include "*"`ですべてをキャプチャして試す

### ヘッドレスモードが失敗する
- 一部のサイトはヘッドレスブラウザをブロック
- `--headless`フラグを削除

## リファレンスドキュメント

完全なドキュメントは以下を参照:
- **すべてのオプションと例:** [REFERENCE.md](REFERENCE.md)
- **ステップバイステップチュートリアル:** [TUTORIAL.md](TUTORIAL.md)

## サポート環境

- ✅ Claude Code
- ✅ Claude Desktop
- ✅ Claude.ai (Computer Use)
- ✅ Windows / macOS / Linux

## ファイル構成

```
api-recorder/
├── SKILL.md          # このファイル
├── REFERENCE.md      # 完全リファレンス（英語）
├── TUTORIAL.md       # チュートリアル（日本語）
├── src/
│   ├── cli.js        # CLIツール
│   └── recorder.js   # コアロジック
└── package.json      # 依存関係
```

## 重要な注意事項

- **セキュリティ:** 認証トークン、Cookie、APIキーをキャプチャ - ログを慎重に取り扱う
- **WebSocket:** サポート外（HTTP/HTTPSのみ）
- **レスポンスサイズ:** 大きなレスポンスは切り詰められる（`--body-limit`で設定可能）
- **.gitignore:** 機密記録をコミットしないよう`*.json`を追加

## 次のステップ

1. **初めて?** ガイド付きウォークスルーは[TUTORIAL.md](TUTORIAL.md)参照
2. **特定のオプションが必要?** すべての設定は[REFERENCE.md](REFERENCE.md)参照
3. **統合?** CI/CD例は[REFERENCE.md](REFERENCE.md)参照
