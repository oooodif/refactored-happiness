// This file extends the main vite.config.ts without modifying it directly
// It runs before the main vite config and sets environment variables

// Increase chunk size warning limit to prevent deployment issues
process.env.VITE_APP_CHUNK_SIZE_WARNING_LIMIT = "1000";

console.log("Vite config extension loaded - chunk size warning limit set to 1000KB");