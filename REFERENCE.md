# API Recorder - Complete Reference

## Installation

### 1. Install Dependencies

```bash
cd /path/to/api-recorder
npm install
```

### 2. Install Playwright Browser (First Time Only)

```bash
npx playwright install chromium
```

## Command Line Options

### Basic Syntax

```bash
node src/cli.js --url <URL> [options]
```

### Options Table

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--url` | `-u` | Target URL (required) | - |
| `--scenario` | `-s` | Scenario name | `scenario_YYYYMMDD_HHMMSS` |
| `--output` | `-o` | Output file path | `<timestamp>_<scenario>.json` |
| `--duration` | `-d` | Recording duration (seconds) | 60 |
| `--include` | `-i` | Include patterns (comma-separated) | `/api/` |
| `--exclude` | `-e` | Exclude patterns (comma-separated) | Static files |
| `--headless` | - | Headless mode | false |
| `--body-limit` | - | Response size limit (bytes) | 10000 |

## Advanced Examples

### Long Duration Recording

```bash
node src/cli.js -u https://example.com -d 300 -s "full_scenario"
```

### Specific APIs Only

```bash
node src/cli.js -u https://example.com -i "/api/room,/api/booking"
```

### Headless Mode (CI/CD)

```bash
node src/cli.js -u https://example.com --headless -d 30
```

### Custom Output Location

```bash
node src/cli.js -u https://example.com -o ./recordings/my-test.json
```

## Output Format

### JSON Structure

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

### Entry Fields

- **seq**: Sequence number of the request
- **timestamp**: ISO 8601 timestamp
- **page_url**: URL of the page where request originated
- **duration_ms**: Request duration in milliseconds
- **request**: Request details (method, URL, headers, body)
- **response**: Response details (status, headers, body, truncation info)

### Response Size Handling

When response exceeds `--body-limit`:

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

## Filtering Requests

### Include Patterns

URL paths matching these patterns will be recorded.

**Default:** `/api/`

**Multiple patterns:**
```bash
--include "/api/,/v1/,/graphql"
```

**Record everything:**
```bash
--include "*"
```

### Exclude Patterns

URLs matching these patterns will NOT be recorded.

**Default:** `.css`, `.js`, `.woff`, `.woff2`, `.ttf`, `.ico`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`

**Custom exclusions:**
```bash
--exclude ".css,.js,.map,.woff"
```

## Programmatic Usage

### Basic API

```javascript
const { APIRecorder } = require('./src/recorder.js');

async function main() {
  const recorder = new APIRecorder({
    scenarioName: 'my_scenario',
    includePatterns: ['/api/'],
    headless: false,
    bodySizeLimit: 10000
  });

  // Start recording
  const page = await recorder.start('https://automationintesting.online/');

  // Optional: Program interactions
  // await page.click('button#submit');

  // Wait for duration
  await new Promise(r => setTimeout(r, 30000));

  // Stop recording
  const result = await recorder.stop();

  // Save results
  require('fs').writeFileSync('output.json', JSON.stringify(result, null, 2));
}

main();
```

### Constructor Options

```javascript
new APIRecorder({
  scenarioName: string,        // Scenario identifier
  includePatterns: string[],   // URL patterns to include
  excludePatterns: string[],   // URL patterns to exclude
  headless: boolean,           // Run in headless mode
  bodySizeLimit: number        // Max response body size (bytes)
})
```

### Methods

#### `start(url: string): Promise<Page>`

Starts recording and navigates to URL.

**Returns:** Playwright Page object for programmatic control

#### `stop(): Promise<RecordingResult>`

Stops recording and returns captured data.

**Returns:** Recording result object (see Output Format)

## Troubleshooting

### Browser Won't Launch

**Symptom:** Error about browser not installed

**Solution:**
```bash
npx playwright install chromium
```

### No APIs Recorded

**Possible causes:**

1. **Include pattern too narrow**
   - Check actual API paths in browser DevTools
   - Try wider pattern: `--include "*"`

2. **APIs excluded by default**
   - Review exclude patterns
   - Override if needed

3. **Request timing**
   - APIs might load before/after recording window
   - Increase duration: `--duration 120`

### Headless Mode Failures

**Cause:** Some sites detect and block headless browsers

**Solution:** Remove `--headless` flag

### Authentication Required

**Approach:**

1. Don't use headless mode
2. Browser will open - log in manually
3. Continue with interactions
4. Recording captures authenticated requests

**Security Note:** Authorization headers and cookies are recorded. Handle logs carefully.

### Large Response Bodies Truncated

**Default limit:** 10,000 bytes

**Increase limit:**
```bash
--body-limit 100000  # 100KB
```

**Disable limit:**
```bash
--body-limit 0  # No limit (caution: large files)
```

## Security Considerations

### Sensitive Data

The recorder captures:
- ✓ Authorization headers
- ✓ Cookie values
- ✓ Request/response bodies
- ✓ Authentication tokens

**Best practices:**
- Don't commit recordings to version control
- Sanitize logs before sharing
- Use `.gitignore` for output directory
- Consider using test credentials only

### Recommended .gitignore

```gitignore
# API Recorder outputs
*.json
recordings/
api-logs/
```

## Supported Environments

| Environment | Support |
|-------------|---------|
| Claude Code | ✅ |
| Claude Desktop | ✅ |
| Claude.ai (Computer Use) | ✅ |
| Windows | ✅ |
| macOS | ✅ |
| Linux | ✅ |

## WebSocket Support

**Current limitation:** WebSocket traffic is NOT recorded.

Only HTTP/HTTPS requests and responses are captured.

## File Structure

```
api-recorder/
├── SKILL.md              # Quick start guide
├── REFERENCE.md          # This file
├── TUTORIAL.md           # Step-by-step tutorial
├── package.json          # Dependencies
├── src/
│   ├── cli.js            # CLI entry point
│   └── recorder.js       # Core recording logic
└── examples/
    └── sample_output.json
```

## Performance Tips

### Optimal Recording Duration

- **Quick tests:** 30-60 seconds
- **User flows:** 120-180 seconds
- **Comprehensive:** 300+ seconds

### Include Pattern Strategy

**Start narrow, expand if needed:**

```bash
# Start with specific API
--include "/api/v1/"

# Expand if missing traffic
--include "/api/"

# Last resort: capture all
--include "*"
```

### Body Size Limits

**Recommended:**
- **API testing:** 10,000 bytes (default)
- **Large responses:** 100,000 bytes
- **File downloads:** 0 (no limit)

## Integration with Testing

### Generate Test Data

Use recordings to create test fixtures:

```javascript
const recording = require('./output.json');

// Extract test data
const testCases = recording.entries.map(entry => ({
  method: entry.request.method,
  url: entry.request.url,
  expectedStatus: entry.response.status,
  responseBody: entry.response.body
}));
```

### Mock API Responses

Use recordings to generate mocks:

```javascript
// Convert recording to mock server config
recording.entries.forEach(entry => {
  mockServer.on(entry.request.method, entry.request.url, {
    status: entry.response.status,
    body: entry.response.body
  });
});
```

## Advanced Filtering

### Multiple Include Patterns

```bash
# Capture multiple API versions
--include "/api/v1/,/api/v2/,/graphql"
```

### Exclude Specific Endpoints

```bash
# Exclude health checks and metrics
--exclude "/health,/metrics,/ping"
```

### Combine Patterns

```bash
# Include all APIs except specific ones
--include "/api/" --exclude "/api/internal"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Record API Traffic
  run: |
    cd api-recorder
    npm install
    npx playwright install chromium
    node src/cli.js \
      --url https://staging.example.com \
      --headless \
      --duration 60 \
      --output ./artifacts/api-recording.json

- name: Upload Recording
  uses: actions/upload-artifact@v2
  with:
    name: api-recording
    path: api-recorder/artifacts/
```

### GitLab CI Example

```yaml
record_api:
  script:
    - cd api-recorder
    - npm install
    - npx playwright install chromium
    - node src/cli.js -u $STAGING_URL --headless -d 60
  artifacts:
    paths:
      - api-recorder/*.json
```

## Version History

See [TUTORIAL.md](TUTORIAL.md) for migration notes and updates.
