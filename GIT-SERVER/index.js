// Import the named export "Git" from node-git-server
import { Git } from 'node-git-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules, create __dirname manually:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Variables
const PORT_GIT = process.env.PORT || 9418;
const reposDir = path.join(__dirname, 'repos');

console.log("🔹 Git Server starting...");
console.log(`🔹 Repository Directory: ${reposDir}`);

// Ensure that the repositories directory exists; if not, create it.
if (!fs.existsSync(reposDir)) {
  console.log("🟡 Repository directory does not exist, creating it...");
  fs.mkdirSync(reposDir, { recursive: true });
} else {
  console.log("✅ Repository directory exists.");
}

// Create the Git server instance with autoCreate enabled.
const gitServer = new Git(reposDir, {
  autoCreate: true, // Automatically create repositories on push
  log: console.log,
});

// Listen for push events to log incoming pushes.
gitServer.on('push', (push) => {
  console.log(`🔵 Push received: ${push.repo}/${push.commit} (branch: ${push.branch})`);
  push.accept();
});

// Listen for fetch events to log fetch requests.
gitServer.on('fetch', (fetch) => {
  console.log(`🟢 Fetch request received for commit ${fetch.commit}`);
  fetch.accept();
});

console.log("🔹 Initializing Git server...");

// Start the Git server on the specified port.
// The listen() method returns the underlying HTTP server.
const server = gitServer.listen(PORT_GIT, () => {
  console.log(`🚀 Git server callback: running on port ${PORT_GIT}`);
});
console.log("✅ gitServer.listen() called successfully.");

// Attach a listener to the underlying server's "listening" event.
server.on('listening', () => {
  console.log("✅ Underlying server is listening on:", server.address());
});

// Attach an error listener in case something goes wrong.
server.on('error', (err) => {
  console.error("❌ Underlying server encountered an error:", err);
});

// Log all HTTP requests received by the server.
server.on('request', (req, res) => {
  console.log("📬 HTTP request received:", req.method, req.url);
});
