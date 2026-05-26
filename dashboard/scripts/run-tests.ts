import { runIntegrationTests } from '../src/lib/integrationTests';

runIntegrationTests().then(results => {
  console.log('\n📊 FINAL RESULTS:');
  console.log(JSON.stringify({
    total: results.total,
    passed: results.passed,
    failed: results.failed,
    successRate: results.successRate + '%'
  }, null, 2));
  
  process.exit(results.failed > 0 ? 1 : 0);
});