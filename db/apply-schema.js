// This script applies database schema changes automatically
import { exec } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Run drizzle-kit push
console.log('Applying database schema changes...');
const child = exec('drizzle-kit push --config=./drizzle.config.ts');

// Auto-respond to prompts
child.stdout.on('data', (data) => {
  console.log(data);
  
  // If asked about truncating tables or confirmation, automatically choose "No, add the constraint without truncating the table"
  if (data.includes('truncate') || data.includes('Are you sure')) {
    child.stdin.write('\n'); // Press enter to select default option
    console.log('Automatically selected: No, add constraint without truncating');
  }
});

child.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

child.on('close', (code) => {
  console.log(`Schema update completed with code ${code}`);
  rl.close();
  process.exit(code);
});