#!/usr/bin/env node

/**
 * API Recorder CLI
 * 
 * 使い方:
 *   node src/cli.js --url <URL> [オプション]
 * 
 * オプション:
 *   --url, -u        対象URL（必須）
 *   --scenario, -s   シナリオ名（デフォルト: scenario_YYYYMMDD_HHMMSS）
 *   --output, -o     出力ファイルパス（デフォルト: ./<timestamp>_<scenario>.json）
 *   --duration, -d   記録時間（秒）（デフォルト: 60）
 *   --include, -i    記録対象パターン（カンマ区切り、デフォルト: /api/）
 *   --exclude, -e    除外パターン（カンマ区切り）
 *   --headless       ヘッドレスモード（デフォルト: false）
 *   --body-limit     レスポンスボディサイズ上限（バイト）（デフォルト: 10000）
 *   --help, -h       ヘルプを表示
 * 
 * 例:
 *   node src/cli.js --url https://automationintesting.online/ --scenario "booking_flow"
 *   node src/cli.js -u https://example.com -d 120 --headless
 */

const { APIRecorder } = require('./recorder.js');
const fs = require('fs');
const path = require('path');

function parseArgs(args) {
  const options = {
    url: null,
    scenarioName: null,
    output: null,
    duration: 60,
    includePatterns: ['/api/'],
    excludePatterns: ['.css', '.js', '.woff', '.woff2', '.ttf', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg'],
    headless: false,
    bodySizeLimit: 10000,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--url':
      case '-u':
        options.url = next;
        i++;
        break;
      case '--scenario':
      case '-s':
        options.scenarioName = next;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = next;
        i++;
        break;
      case '--duration':
      case '-d':
        options.duration = parseInt(next, 10);
        i++;
        break;
      case '--include':
      case '-i':
        options.includePatterns = next.split(',').map(p => p.trim());
        i++;
        break;
      case '--exclude':
      case '-e':
        options.excludePatterns = next.split(',').map(p => p.trim());
        i++;
        break;
      case '--headless':
        options.headless = true;
        break;
      case '--body-limit':
        options.bodySizeLimit = parseInt(next, 10);
        i++;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
API Recorder - WebページのAPIリクエスト/レスポンスを記録

使い方:
  node src/cli.js --url <URL> [オプション]

オプション:
  --url, -u        対象URL（必須）
  --scenario, -s   シナリオ名（デフォルト: scenario_YYYYMMDD_HHMMSS）
  --output, -o     出力ファイルパス（デフォルト: ./<timestamp>_<scenario>.json）
  --duration, -d   記録時間（秒）（デフォルト: 60）
  --include, -i    記録対象パターン（カンマ区切り、デフォルト: /api/）
  --exclude, -e    除外パターン（カンマ区切り）
  --headless       ヘッドレスモード（デフォルト: false）
  --body-limit     レスポンスボディサイズ上限（バイト）（デフォルト: 10000）
  --help, -h       ヘルプを表示

例:
  node src/cli.js --url https://automationintesting.online/ --scenario "booking_flow"
  node src/cli.js -u https://example.com -d 120 --headless
  node src/cli.js -u https://example.com -i "/api/,/v1/" -e ".map,.json"
  `);
}

function generateOutputPath(scenarioName) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .slice(0, 15);
  
  // シナリオ名をファイル名として安全な形式に変換
  const safeName = scenarioName
    .replace(/[^a-zA-Z0-9_\-\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '_')
    .replace(/_+/g, '_');
  
  return `${timestamp}_${safeName}.json`;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options.url) {
    console.error('エラー: --url は必須です');
    printHelp();
    process.exit(1);
  }

  // シナリオ名が指定されていない場合は自動生成
  if (!options.scenarioName) {
    const now = new Date();
    options.scenarioName = `scenario_${now.toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15)}`;
  }

  // 出力パスが指定されていない場合は自動生成
  if (!options.output) {
    options.output = generateOutputPath(options.scenarioName);
  }

  console.log('='.repeat(50));
  console.log('API Recorder');
  console.log('='.repeat(50));
  console.log(`URL: ${options.url}`);
  console.log(`シナリオ: ${options.scenarioName}`);
  console.log(`記録時間: ${options.duration}秒`);
  console.log(`記録対象パターン: ${options.includePatterns.join(', ')}`);
  console.log(`ヘッドレス: ${options.headless}`);
  console.log('='.repeat(50));
  console.log('');

  const recorder = new APIRecorder({
    scenarioName: options.scenarioName,
    includePatterns: options.includePatterns,
    excludePatterns: options.excludePatterns,
    bodySizeLimit: options.bodySizeLimit,
    headless: options.headless,
  });

  // Ctrl+C のハンドリング
  let stopped = false;
  const cleanup = async () => {
    if (stopped) return;
    stopped = true;
    console.log('\n\n記録を停止しています...');
    const result = await recorder.stop();
    saveResult(result, options.output);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await recorder.start(options.url);

    // 指定時間待機または手動停止
    console.log(`\n${options.duration}秒間記録します...`);
    console.log('（Ctrl+C で早期終了可能）\n');
    
    await new Promise(resolve => setTimeout(resolve, options.duration * 1000));

    if (!stopped) {
      const result = await recorder.stop();
      saveResult(result, options.output);
    }
  } catch (error) {
    console.error('エラー:', error.message);
    if (!stopped) {
      await cleanup();
    }
    process.exit(1);
  }
}

function saveResult(result, outputPath) {
  const json = JSON.stringify(result, null, 2);
  fs.writeFileSync(outputPath, json, 'utf-8');
  console.log(`\n出力ファイル: ${outputPath}`);
  console.log(`記録件数: ${result.entries.length}`);
}

main();
