const CDPClient = require('./core/cdp-client');

async function test() {
  const client = new CDPClient({ port: 9222 });
  await client.connect();
  
  console.log('Navigating to Muck Rack...');
  try {
    const result = await client.navigate('https://hennessey-digital.muckrack.com/search/results?q=technology&result_type=person&page=1');
    console.log('Result:', result);
  } catch (e) {
    console.error('Navigation error:', e.message);
  }
  
  client.disconnect();
}

test();