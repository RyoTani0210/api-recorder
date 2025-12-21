# API Recorder チュートリアル

このチュートリアルでは、**Restful-booker-platform** を使ってAPIの記録方法を学びます。

## 対象サイト

**Restful-booker-platform** は、テスト自動化の学習用に作られたホテル予約サイトです。

| 項目 | 内容 |
|------|------|
| URL | https://automationintesting.online/ |
| 機能 | 部屋一覧表示、予約、問い合わせ、管理者ログイン |
| 管理者 | Username: `admin` / Password: `password` |

---

## クイックスタート

### 1. セットアップ

```bash
cd /path/to/api-recorder
npm install
npx playwright install chromium
```

### 2. 記録を実行

```bash
node src/cli.js \
  --url https://automationintesting.online/ \
  --scenario "部屋予約フロー" \
  --duration 60
```

### 3. ブラウザで操作

ブラウザが開いたら、以下の操作を行います：

1. トップページを表示（部屋一覧が自動で読み込まれる）
2. 「Book this room」ボタンをクリック
3. カレンダーで日付を選択
4. 予約フォームに情報を入力

### 4. 記録を終了

60秒経過するか、ターミナルで `Ctrl+C` を押すと記録が終了します。

```
Recording stopped. 8 API calls recorded.
Output saved to: 20251221_153000_部屋予約フロー.json
```

---

## サイトの主要API一覧

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/branding` | GET | サイト情報（名前、連絡先、地図） |
| `/api/room` | GET | 部屋一覧 |
| `/api/room/{id}` | GET | 部屋詳細 |
| `/api/booking` | POST | 予約作成 |
| `/api/message` | POST | 問い合わせ送信 |
| `/api/auth/login` | POST | 管理者ログイン |

---

## シナリオ別の実行例

### シナリオ1: 部屋閲覧のみ

```bash
node src/cli.js \
  --url https://automationintesting.online/ \
  --scenario "room_browsing" \
  --duration 30
```

トップページを表示するだけで以下のAPIが記録されます：
- `GET /api/branding`
- `GET /api/room`

### シナリオ2: 予約フロー

```bash
node src/cli.js \
  --url https://automationintesting.online/ \
  --scenario "booking_flow" \
  --duration 120
```

操作：
1. 部屋を選択
2. 「Book this room」をクリック
3. 日付を選択
4. フォームに入力して送信

記録されるAPI：
- `GET /api/branding`
- `GET /api/room`
- `POST /api/booking`

### シナリオ3: 管理者操作

```bash
node src/cli.js \
  --url "https://automationintesting.online/#/admin" \
  --scenario "admin_flow" \
  --duration 180
```

操作：
1. 管理者ログイン（admin / password）
2. 予約一覧を確認
3. 予約を編集

記録されるAPI：
- `POST /api/auth/login`
- `GET /api/booking`
- `PUT /api/booking/{id}`

---

## 記録結果の例

```json
{
  "scenario": "booking_flow",
  "recorded_at": "2025-12-21T15:30:00.000Z",
  "base_url": "https://automationintesting.online",
  "config": {
    "include_patterns": ["/api/"],
    "exclude_patterns": [".css", ".js", "..."],
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
        "url": "/api/branding",
        "headers": { "accept": "application/json" },
        "body": null
      },
      "response": {
        "status": 200,
        "status_text": "OK",
        "headers": { "content-type": "application/json" },
        "body": {
          "name": "Shady Meadows B&B",
          "map": {
            "latitude": 52.6351204,
            "longitude": 1.2733774
          },
          "logoUrl": "https://www.mwtestconsultancy.co.uk/img/rbp-logo.png",
          "description": "Welcome to Shady Meadows...",
          "contact": {
            "name": "Shady Meadows B&B",
            "address": "The Old Farmhouse",
            "phone": "0123456789",
            "email": "fake@fakeemail.com"
          }
        },
        "body_truncated": false
      }
    },
    {
      "seq": 2,
      "timestamp": "2025-12-21T15:30:01.456Z",
      "page_url": "https://automationintesting.online/",
      "duration_ms": 189,
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
        "body": {
          "rooms": [
            {
              "roomid": 1,
              "roomName": "101",
              "type": "Single",
              "accessible": true,
              "image": "https://...",
              "description": "Aenean porttitor...",
              "features": ["WiFi", "TV", "Safe"],
              "roomPrice": 100
            }
          ]
        },
        "body_truncated": false
      }
    },
    {
      "seq": 3,
      "timestamp": "2025-12-21T15:30:25.789Z",
      "page_url": "https://automationintesting.online/",
      "duration_ms": 234,
      "request": {
        "method": "POST",
        "url": "/api/booking",
        "headers": {
          "accept": "application/json",
          "content-type": "application/json"
        },
        "body": {
          "roomid": 1,
          "firstname": "Taro",
          "lastname": "Yamada",
          "depositpaid": true,
          "email": "taro@example.com",
          "phone": "09012345678",
          "bookingdates": {
            "checkin": "2025-01-10",
            "checkout": "2025-01-12"
          }
        }
      },
      "response": {
        "status": 201,
        "status_text": "Created",
        "headers": { "content-type": "application/json" },
        "body": {
          "bookingid": 1,
          "booking": {
            "roomid": 1,
            "firstname": "Taro",
            "lastname": "Yamada",
            "depositpaid": true,
            "bookingdates": {
              "checkin": "2025-01-10",
              "checkout": "2025-01-12"
            }
          }
        },
        "body_truncated": false
      }
    }
  ]
}
```

---

## ログの活用方法

### 1. APIテストケースの設計

記録したログから以下を確認：
- どのエンドポイントが使われているか
- どのパラメータが渡されているか
- レスポンスの構造はどうなっているか

### 2. テストデータの抽出

```json
// 部屋一覧APIのテストケース
{
  "endpoint": "GET /api/room",
  "expected": {
    "status": 200,
    "body.rooms": "array",
    "body.rooms[0].roomid": "number",
    "body.rooms[0].features": ["WiFi", "TV", "Safe"]
  }
}
```

### 3. API依存関係の把握

```
1. GET /api/room         → 部屋一覧を取得（roomidを取得）
2. POST /api/booking     → roomidを使って予約作成
3. GET /api/booking/{id} → 作成した予約の確認
```

---

## オプション活用例

### 特定のAPIのみ記録

```bash
node src/cli.js \
  --url https://automationintesting.online/ \
  --include "/api/room,/api/booking" \
  --scenario "room_and_booking"
```

### 全てのリクエストを記録

```bash
node src/cli.js \
  --url https://automationintesting.online/ \
  --include "*" \
  --scenario "all_requests"
```

### CI/CD向け（ヘッドレス）

```bash
node src/cli.js \
  --url https://automationintesting.online/ \
  --headless \
  --duration 30 \
  --scenario "ci_test"
```

---

## トラブルシューティング

### APIが記録されない

1. 開発者ツール（F12）でNetworkタブを確認
2. 実際のAPIパスを確認
3. `--include "*"` で全リクエストを記録して確認

### ブラウザが表示されない

```bash
# ヘッドレスモードになっていないか確認
# --headless オプションを外す
node src/cli.js --url https://... --scenario test
```

### 認証が必要なページ

1. ヘッドレスモードをオフにする
2. ブラウザでログイン操作を行う
3. 認証後のAPIが記録される

---

## 次のステップ

記録したログを使って：

1. **APIテストコードを作成**
   - pytest + requests
   - Playwright API Testing
   - REST Assured

2. **データ駆動テストを設計**
   - パラメータを変数化
   - 異常系のバリエーションを追加

3. **シナリオテストを構築**
   - API間の依存関係を定義
   - E2Eテストに組み込み
