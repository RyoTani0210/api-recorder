/**
 * API Recorder - コア記録ロジック
 * Playwrightを使用してWebページのAPIリクエスト/レスポンスを記録する
 */

const { chromium } = require('playwright');

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG = {
  includePatterns: ['/api/'],
  excludePatterns: ['.css', '.js', '.woff', '.woff2', '.ttf', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg'],
  bodySizeLimit: 10000,
  headless: false,
};

/**
 * URLが記録対象パターンにマッチするか判定
 */
function matchesIncludePatterns(url, patterns) {
  if (patterns.length === 0) return true;
  return patterns.some(pattern => {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    }
    return url.includes(pattern);
  });
}

/**
 * URLが除外パターンにマッチするか判定
 */
function matchesExcludePatterns(url, patterns) {
  return patterns.some(pattern => {
    if (pattern.startsWith('*.')) {
      return url.endsWith(pattern.slice(1));
    }
    return url.includes(pattern);
  });
}

/**
 * ボディがサイズ制限を超える場合に切り詰める
 */
function truncateBody(body, limit) {
  if (body === null || body === undefined) {
    return { body: null, truncated: false };
  }
  
  const str = typeof body === 'string' ? body : JSON.stringify(body);
  
  if (str.length <= limit) {
    return { 
      body: typeof body === 'string' ? body : body, 
      truncated: false 
    };
  }
  
  // JSONをパースして切り詰めを試行
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    const truncatedStr = str.slice(0, limit);
    
    // 有効な切り詰めJSONを作成
    let truncatedBody;
    try {
      truncatedBody = JSON.parse(truncatedStr);
    } catch {
      // 無効なJSONの場合、プレビューを返す
      truncatedBody = { _truncated: true, _preview: truncatedStr.slice(0, 500) + '...' };
    }
    
    return {
      body: truncatedBody,
      truncated: true,
      originalSize: str.length
    };
  } catch {
    return {
      body: str.slice(0, limit) + '...',
      truncated: true,
      originalSize: str.length
    };
  }
}

/**
 * レスポンスボディを安全にパース
 */
async function parseResponseBody(response) {
  try {
    const contentType = response.headers()['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    
    const text = await response.text();
    
    // JSONとしてパースを試行
    try {
      return JSON.parse(text);
    } catch {
      return text.length > 1000 ? text.slice(0, 1000) + '...' : text;
    }
  } catch (e) {
    return null;
  }
}

/**
 * リクエストボディを安全にパース
 */
function parseRequestBody(request) {
  try {
    const postData = request.postData();
    if (!postData) return null;
    
    try {
      return JSON.parse(postData);
    } catch {
      return postData;
    }
  } catch {
    return null;
  }
}

/**
 * メイン記録クラス
 */
class APIRecorder {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.entries = [];
    this.seq = 0;
    this.browser = null;
    this.page = null;
    this.startTime = null;
    this.scenarioName = options.scenarioName || `scenario_${this.getTimestamp()}`;
    this.baseUrl = null;
  }

  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
  }

  getISOTimestamp() {
    return new Date().toISOString();
  }

  /**
   * 記録を開始
   */
  async start(url) {
    this.startTime = this.getISOTimestamp();
    this.baseUrl = new URL(url).origin;

    this.browser = await chromium.launch({ 
      headless: this.config.headless 
    });
    
    const context = await this.browser.newContext();
    this.page = await context.newPage();

    // レスポンスイベントをリッスン
    this.page.on('response', async (response) => {
      await this.handleResponse(response);
    });

    await this.page.goto(url);
    
    console.log(`記録開始: ${this.scenarioName}`);
    console.log(`URL: ${url}`);
    console.log(`Ctrl+Cで記録を停止、またはタイムアウトまで待機`);
    
    return this.page;
  }

  /**
   * レスポンスイベントを処理
   */
  async handleResponse(response) {
    const request = response.request();
    const url = request.url();
    const urlPath = new URL(url).pathname + new URL(url).search;

    // パターンでフィルタリング
    if (!matchesIncludePatterns(urlPath, this.config.includePatterns)) {
      return;
    }
    if (matchesExcludePatterns(url, this.config.excludePatterns)) {
      return;
    }

    // http(s)以外はスキップ
    if (!url.startsWith('http')) return;

    this.seq++;
    const timestamp = this.getISOTimestamp();

    // ボディをパース
    const requestBody = parseRequestBody(request);
    const responseBody = await parseResponseBody(response);
    
    // 必要に応じて切り詰め
    const { body: truncatedBody, truncated, originalSize } = 
      truncateBody(responseBody, this.config.bodySizeLimit);

    // タイミング情報を取得
    const timing = response.request().timing();
    const duration = timing ? Math.round(timing.responseEnd - timing.requestStart) : 0;

    const entry = {
      seq: this.seq,
      timestamp,
      page_url: this.page.url(),
      duration_ms: duration > 0 ? duration : null,
      request: {
        method: request.method(),
        url: urlPath,
        headers: this.filterHeaders(request.headers()),
        body: requestBody
      },
      response: {
        status: response.status(),
        status_text: response.statusText(),
        headers: this.filterHeaders(response.headers()),
        body: truncatedBody,
        body_truncated: truncated
      }
    };

    if (truncated && originalSize) {
      entry.response.body_original_size = originalSize;
    }

    this.entries.push(entry);
    console.log(`[${this.seq}] ${request.method()} ${urlPath} => ${response.status()}`);
  }

  /**
   * 必要なヘッダーのみをフィルタリング
   */
  filterHeaders(headers) {
    const filtered = {};
    const keepHeaders = [
      'content-type', 
      'accept', 
      'authorization',
      'cookie',
      'cache-control',
      'content-length'
    ];
    
    for (const [key, value] of Object.entries(headers)) {
      if (keepHeaders.includes(key.toLowerCase())) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * 記録を停止して結果を返す
   */
  async stop() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    const result = {
      scenario: this.scenarioName,
      recorded_at: this.startTime,
      base_url: this.baseUrl,
      config: {
        include_patterns: this.config.includePatterns,
        exclude_patterns: this.config.excludePatterns,
        body_size_limit: this.config.bodySizeLimit
      },
      entries: this.entries
    };

    console.log(`\n記録停止。${this.entries.length}件のAPIを記録しました。`);
    return result;
  }

  /**
   * 外部制御用に現在のページを取得
   */
  getPage() {
    return this.page;
  }
}

module.exports = { APIRecorder, DEFAULT_CONFIG };
