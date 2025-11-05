/**
 * Test Server Status
 * Diagnostic script to test server status APIs directly
 */

const servers = [
  { name: 'Test Server 1', ip: 'play.hypixel.net', port: 25565 },
  { name: 'Test Server 2', ip: 'mc.hypixel.net', port: 25565 },
  // Add your actual servers here
];

async function testMcstatus(ip, port) {
  const address = port === 25565 ? ip : `${ip}:${port}`;
  try {
    console.log(`\n[mcstatus.io] Testing ${address}...`);
    const res = await fetch(`https://api.mcstatus.io/v2/status/java/${address}`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    console.log(`  Status: ${res.status}`);
    console.log(`  Online: ${data.online}`);
    console.log(`  Players: ${data.players?.online ?? 0}/${data.players?.max ?? 0}`);
    console.log(`  Version: ${data.version?.name_clean ?? 'N/A'}`);
    console.log(`  Full response:`, JSON.stringify(data, null, 2));
    return data;
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return null;
  }
}

async function testMcsrvstat(ip, port) {
  const address = port === 25565 ? ip : `${ip}:${port}`;
  try {
    console.log(`\n[mcsrvstat.us] Testing ${address}...`);
    const res = await fetch(`https://api.mcsrvstat.us/3/${address}`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    console.log(`  Status: ${res.status}`);
    console.log(`  Online: ${data.online}`);
    console.log(`  Players: ${data.players?.online ?? 0}/${data.players?.max ?? 0}`);
    console.log(`  Version: ${Array.isArray(data.version) ? data.version[0] : data.version ?? 'N/A'}`);
    console.log(`  Full response:`, JSON.stringify(data, null, 2));
    return data;
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('SERVER STATUS DIAGNOSTIC TEST');
  console.log('='.repeat(60));

  for (const server of servers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${server.name} (${server.ip}:${server.port})`);
    console.log('='.repeat(60));
    
    await testMcstatus(server.ip, server.port);
    await testMcsrvstat(server.ip, server.port);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test completed!');
  console.log('='.repeat(60));
}

main();
