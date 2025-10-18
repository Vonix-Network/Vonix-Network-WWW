import { db } from './index';
import { servers } from './schema';

export async function cleanServerDefaults() {
  try {
    console.log('Cleaning default values from servers table...');
    
    // Set all servers to have null/0 for live-fetched fields
    const result = await db
      .update(servers)
      .set({
        status: 'offline',
        playersOnline: 0,
        playersMax: 0,
        version: null,
      });
    
    console.log('Successfully cleaned server default values!');
    console.log('All servers will now fetch live data from mcstatus.io');
    
    return result;
  } catch (error) {
    console.error('Error cleaning server defaults:', error);
    throw error;
  }
}

// Run this to clean existing data
if (require.main === module) {
  cleanServerDefaults().then(() => {
    console.log('Done!');
    process.exit(0);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
