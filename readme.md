Scheduler in Typescript


Example of usage:
*** Usage examples
const scheduler = new Scheduler();

// Basic usage
scheduler.schedule('dailyBackup', () => {
    console.log('🔄 Running daily backup...', new Date().toLocaleString());
}, 'day');