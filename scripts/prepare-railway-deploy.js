/**
 * This script helps prepare the project for Railway deployment
 * by temporarily renaming Docker-related files in node_modules
 * that might cause Railway to incorrectly use Docker instead of Nixpacks.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current script directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that can trigger Docker detection
const DOCKER_FILES = [
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore'
];

// Directory to search
const NODE_MODULES_DIR = path.join(__dirname, '..', 'node_modules');

/**
 * Find all Docker-related files in the node_modules directory
 */
function findDockerFiles() {
  console.log('Searching for Docker files in node_modules...');
  
  let command = `find ${NODE_MODULES_DIR} -type f \\( `;
  
  const patterns = DOCKER_FILES.map(file => `-name "${file}"`);
  command += patterns.join(' -o ');
  command += ' \\)';
  
  try {
    const result = execSync(command, { encoding: 'utf8' });
    const files = result.trim().split('\n').filter(Boolean);
    
    console.log(`Found ${files.length} Docker-related files in node_modules:`);
    files.forEach(file => console.log(`- ${file}`));
    
    return files;
  } catch (error) {
    console.error('Error finding Docker files:', error.message);
    return [];
  }
}

/**
 * Rename files by adding .railway-bak extension
 */
function renameFiles(files) {
  console.log('\nRenaming Docker files to prevent Railway detection...');
  
  if (files.length === 0) {
    console.log('No files to rename.');
    return;
  }
  
  const renamedFiles = [];
  
  for (const file of files) {
    try {
      const newName = `${file}.railway-bak`;
      fs.renameSync(file, newName);
      console.log(`Renamed: ${file} -> ${newName}`);
      renamedFiles.push({ original: file, renamed: newName });
    } catch (error) {
      console.error(`Failed to rename ${file}: ${error.message}`);
    }
  }
  
  // Save the list of renamed files so we can restore them later
  const logFile = path.join(__dirname, 'railway-renamed-files.json');
  fs.writeFileSync(logFile, JSON.stringify(renamedFiles, null, 2));
  console.log(`\nRenamed ${renamedFiles.length} files. List saved to ${logFile}`);
}

/**
 * Create/update .npmignore file to exclude Docker-related files
 */
function createNpmIgnore() {
  console.log('\nUpdating .npmignore file...');
  
  const npmIgnorePath = path.join(__dirname, '..', '.npmignore');
  let content = '';
  
  // Read existing content if file exists
  if (fs.existsSync(npmIgnorePath)) {
    content = fs.readFileSync(npmIgnorePath, 'utf8');
  }
  
  // Add Docker ignore patterns if not already present
  let updated = false;
  for (const file of DOCKER_FILES) {
    const pattern = `**/${file}`;
    if (!content.includes(pattern)) {
      content += `\n${pattern}`;
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(npmIgnorePath, content.trim() + '\n');
    console.log('Updated .npmignore with Docker file patterns.');
  } else {
    console.log('.npmignore already contains all necessary patterns.');
  }
}

// Execute the script
console.log('Preparing project for Railway deployment...');
const dockerFiles = findDockerFiles();
renameFiles(dockerFiles);
createNpmIgnore();
console.log('\nProject is ready for Railway deployment!');
console.log('After deployment, you can restore the renamed files by creating a restore script.');