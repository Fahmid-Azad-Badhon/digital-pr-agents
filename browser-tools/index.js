/**
 * Browser Tools - Main Entry Point
 * Start, stop, and manage the debuggable Chrome browser
 */

const ChromeLauncher = require('./core/chrome-launcher');
const BrowserHealthChecker = require('./core/browser-health');
const MuckRackCollector = require('./collectors/muckrack-collector');
const config = require('./core/browser-config');
const logger = require('./utils/logger');

const log = new logger('BrowserTools');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'start';

async function main() {
  try {
    switch (command) {
      case 'start':
        await startBrowser();
        break;
        
      case 'stop':
        await stopBrowser();
        break;
        
      case 'restart':
        await restartBrowser();
        break;
        
      case 'health':
      case 'check':
        await healthCheck();
        break;
        
      case 'collect':
        await runCollector();
        break;
        
      case 'test-cdp':
        await testCDP();
        break;
        
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Available commands: start, stop, restart, health, collect, test-cdp');
        process.exit(1);
    }
  } catch (error) {
    log.error('Command failed:', error.message);
    process.exit(1);
  }
}

/**
 * Start debug browser
 */
async function startBrowser() {
  const forceNew = args.includes('--force') || args.includes('-f');
  
  log.info('═══════════════════════════════════════════════════');
  log.info('  Starting Debuggable Chrome Browser');
  log.info('═══════════════════════════════════════════════════');
  
  const launcher = new ChromeLauncher();
  
  const result = await launcher.launch({ forceNew });
  
  console.log('\n✓ Chrome is ready!');
  console.log(`  Port: ${result.port}`);
  console.log(`  Profile: ${result.userDataDir}`);
  console.log(`  WebSocket: ${result.webSocket}`);
  console.log(`  Reused: ${result.reuse ? 'Yes' : 'No'}`);
  console.log('\n  DevTools URL: http://localhost:' + result.port + '/json');
  console.log('  DevTools WebSocket: ' + result.webSocket);
}

/**
 * Stop debug browser
 */
async function stopBrowser() {
  log.info('Stopping debug Chrome...');
  
  const launcher = new ChromeLauncher();
  await launcher.killDebugChrome();
  
  log.info('Debug Chrome stopped');
}

/**
 * Restart debug browser
 */
async function restartBrowser() {
  log.info('Restarting debug Chrome...');
  
  await stopBrowser();
  await startBrowser();
  
  log.info('Debug Chrome restarted');
}

/**
 * Run health check
 */
async function healthCheck() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Browser Health Check');
  console.log('═══════════════════════════════════════════════════\n');
  
  const checker = new BrowserHealthChecker();
  const results = await checker.checkAll();
  
  checker.printResults(results);
  
  // Exit with error if unhealthy
  if (results.summary.status !== 'healthy') {
    process.exit(1);
  }
}

/**
 * Run Muck Rack collector
 */
async function runCollector() {
  // Parse collector arguments
  let beat = null;
  let count = 500;
  let port = config.get('chrome.debugPort');
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--beat' || args[i] === '-b') {
      beat = args[++i];
    } else if (args[i] === '--count' || args[i] === '-c') {
      count = parseInt(args[++i], 10);
    } else if (args[i] === '--port' || args[i] === '-p') {
      port = parseInt(args[++i], 10);
    }
  }
  
  if (!beat) {
    console.log('Error: --beat is required');
    console.log('Usage: node index.js collect --beat "pedestrian safety" --count 100');
    process.exit(1);
  }
  
  log.info('═══════════════════════════════════════════════════');
  log.info(`  Collecting journalists for: ${beat}`);
  log.info('═══════════════════════════════════════════════════');
  
  const results = await MuckRackCollector.runCollection(beat, count, { port });
  
  console.log('\n✓ Collection complete!');
  console.log(`  Beat: ${results.beat}`);
  console.log(`  Total collected: ${results.count}`);
  console.log(`  Pages processed: ${results.pages}`);
}

/**
 * Test CDP connection
 */
async function testCDP() {
  console.log('Testing CDP connection...\n');
  
  const checker = new BrowserHealthChecker();
  
  // Check port
  const portResult = await checker.checkDebugPort();
  console.log(`Debug Port: ${portResult.status === 'pass' ? '✓' : '✗'} ${portResult.message}`);
  
  // Check endpoint
  const endpointResult = await checker.checkDevToolsEndpoint();
  console.log(`DevTools: ${endpointResult.status === 'pass' ? '✓' : '✗'} ${endpointResult.message}`);
  
  // Check targets
  const targetResult = await checker.checkTargetListing();
  console.log(`Targets: ${targetResult.status === 'pass' ? '✓' : '✗'} ${targetResult.message}`);
  
  if (endpointResult.status === 'pass') {
    console.log('\n✓ CDP connection is working!');
    console.log(`  Browser: ${endpointResult.details.browser}`);
    console.log(`  WebSocket: ${endpointResult.details.webSocket}`);
  } else {
    console.log('\n✗ CDP connection failed. Run "start" first.');
  }
}

// Run main
main();