const CDPClient = require('./core/cdp-client');

async function test() {
  const client = new CDPClient({ port: 9222 });
  await client.connect();
  
  console.log('Navigating to google...');
  try {
    const result = await client.navigate('https://google.com');
    console.log('Result:', result);
  } catch (e) {
    console.error('Navigation error:', e.message);
  }
  
  client.disconnect();
}

test();