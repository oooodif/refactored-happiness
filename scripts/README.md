# Railway Deployment Scripts

This directory contains scripts to help with deploying the AI LaTeX Generator to Railway, specifically for handling issues with Docker file detection.

## Available Scripts

### 1. prepare-railway-deploy.js

This script prepares the project for Railway deployment by handling Docker-related files in node_modules:

```bash
node scripts/prepare-railway-deploy.js
```

**What it does:**
- Finds Docker-related files in node_modules (like Dockerfile, docker-compose.yml)
- Renames them with a .railway-bak extension to prevent Railway from detecting them
- Updates the .npmignore file to exclude Docker-related patterns
- Creates a log file for easy restoration

**Files Found in This Project:**
In our project, we've identified Docker-related files in the following locations:
- `/node_modules/knex/scripts/docker-compose.yml`
- `/node_modules/knex/scripts/stress-test/docker-compose.yml`

These files were causing Railway to incorrectly use Docker instead of Nixpacks.

### 2. restore-railway-files.js

This script restores renamed Docker files after deployment:

```bash
node scripts/restore-railway-files.js
```

**What it does:**
- Reads the log file created by prepare-railway-deploy.js
- Restores all renamed files to their original names
- Deletes the log file if all files were successfully restored

## Technical Notes

Both scripts are written as ES modules since the project is configured with `"type": "module"` in package.json. They use:

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current script directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

This pattern is needed because `__dirname` and `__filename` are not available in ES modules by default.

## Deployment Process

For a full guide on deploying to Railway, refer to the `deployment-guide.md` file in the project root directory.

The basic deployment workflow is:

1. Prepare your project: `node scripts/prepare-railway-deploy.js`
2. Commit and push changes
3. Deploy to Railway through the Railway dashboard
4. After successful deployment, restore the files: `node scripts/restore-railway-files.js`

## Troubleshooting

If you encounter issues with Docker detection even after running the preparation script:

1. Check the Railway dashboard and explicitly set the builder to "Nixpacks"
2. Verify the contents of .railway.toml and railway.json
3. Look for any other Docker-related files that might have been missed