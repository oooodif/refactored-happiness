/**
 * This script restores Docker-related files that were renamed
 * by the prepare-railway-deploy.js script
 */

const fs = require('fs');
const path = require('path');

// Path to the log file with renamed files
const logFile = path.join(__dirname, 'railway-renamed-files.json');

/**
 * Restore renamed files to their original names
 */
function restoreFiles() {
  console.log('Restoring renamed Docker files...');
  
  // Check if log file exists
  if (!fs.existsSync(logFile)) {
    console.error(`Log file not found: ${logFile}`);
    console.log('It appears no files were renamed or the log file was moved/deleted.');
    return;
  }
  
  try {
    // Read the log file with renamed files
    const renamedFiles = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    
    if (renamedFiles.length === 0) {
      console.log('No files to restore.');
      return;
    }
    
    console.log(`Found ${renamedFiles.length} files to restore:`);
    
    // Restore each file
    let restoredCount = 0;
    for (const file of renamedFiles) {
      try {
        if (fs.existsSync(file.renamed)) {
          fs.renameSync(file.renamed, file.original);
          console.log(`Restored: ${file.renamed} -> ${file.original}`);
          restoredCount++;
        } else {
          console.warn(`Warning: Cannot find renamed file: ${file.renamed}`);
        }
      } catch (error) {
        console.error(`Failed to restore ${file.renamed}: ${error.message}`);
      }
    }
    
    console.log(`\nRestored ${restoredCount} of ${renamedFiles.length} files.`);
    
    // Delete the log file if all files were restored
    if (restoredCount === renamedFiles.length) {
      fs.unlinkSync(logFile);
      console.log(`Removed log file: ${logFile}`);
    }
  } catch (error) {
    console.error(`Error restoring files: ${error.message}`);
  }
}

// Execute the script
console.log('Starting restoration of Docker files renamed for Railway deployment...');
restoreFiles();
console.log('\nRestoration process completed!');