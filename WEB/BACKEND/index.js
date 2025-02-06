// index.js
//
// This file sets up two services:
// 1. A Token Server using Express (port 3000)
// 2. A Git Server using node-git-server (port 7005)
//
// The Token Server provides JWT-based authentication. The Git Server
// requires the client to use HTTP Basic Authentication, where the password
// is the JWT token.

const express = require('express');         // Web framework for the Token Server
const GitServer = require('node-git-server'); // Provides a native Git server
const jwt = require('jsonwebtoken');          // For creating and verifying JWT tokens
const fs = require('fs');                     // File system module to manage folders
const path = require('path');                 // To work with directory paths

// =============================
// Configuration Variables
// =============================
const PORT_TOKEN = 3000;       // Port for the Token Server (Express)
const PORT_GIT = 7005;         // Port for the Git Server (node-git-server)
const JWT_SECRET = 'MY_SECRET_KEY'; // Secret key used for signing/verifying JWTs
                                    // NOTE: Replace with a secure secret in production

// =============================
// TOKEN SERVER SECTION
// =============================

// Create an Express application instance for the token service.
const tokenApp = express();

// Use built-in middleware to parse JSON request bodies.
tokenApp.use(express.json());

// ----------------------------------------------------------------------
// Dummy User Store:
// In a real application, use a database for user credentials.
// Here we use a simple in-memory object for demonstration.
const users = {
  'user1': 'password1',
  'user2': 'password2'
};
// ----------------------------------------------------------------------

/**
 * POST /token
 * 
 * This endpoint authenticates the user and returns a JWT if the credentials are valid.
 * 
 * Expected Request Body (JSON):
 * {
 *   "username": "user1",
 *   "password": "password1"
 * }
 * 
 * On success, the response is:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
 * }
 */
tokenApp.post('/token', (req, res) => {
  const { username, password } = req.body;
  
  // Validate that both username and password are provided and match our dummy store.
  if (!username || !password || users[username] !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Create a JWT token that contains the username in its payload.
  // The token will expire in 1 hour.
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  
  // Return the token to the client.
  res.json({ token });
});

// Start the Token Server on the configured port.
tokenApp.listen(PORT_TOKEN, () => {
  console.log(`Token server running on port ${PORT_TOKEN}`);
});

// =============================
// GIT SERVER SECTION
// =============================

// Define the directory where all Git repositories will be stored.
// This directory will be used by the Git server.
const reposDir = path.join(__dirname, 'repos');

// Ensure that the repositories folder exists. Create it if it does not.
if (!fs.existsSync(reposDir)) {
  fs.mkdirSync(reposDir);
}

/**
 * Create a Git server instance using node-git-server.
 * 
 * The Git server is configured to look for repositories in the "repos" folder.
 * We disable auto-creation of repositories since they must be created manually
 * (for example, using "git init --bare" or via another administrative process).
 * 
 * The "authenticate" function is called for every incoming Git request.
 * It expects clients to use HTTP Basic Authentication where the password field
 * contains a JWT token obtained from the Token Server.
 */
const gitServer = new GitServer({
  path: reposDir,       // Base directory for repositories
  autoCreate: false,    // Repositories must be created manually
  authenticate: (type, repo, user, next) => {
    // Check if the client provided a token in the password field.
    if (!user || !user.password) {
      return next(new Error('No token provided'));
    }
    try {
      // Verify the provided JWT token using the secret.
      // If the token is valid, jwt.verify returns the token payload.
      const payload = jwt.verify(user.password, JWT_SECRET);
      
      // Optionally, attach the username from the token payload to the user object.
      user.username = payload.username;
      
      // Allow the Git operation to proceed.
      next(null, user);
    } catch (err) {
      // If the token is invalid or expired, deny access.
      return next(new Error('Invalid token'));
    }
  },
  // Log all Git server events to the console.
  log: console.log
});

// Start the Git Server on the configured port.
gitServer.listen(PORT_GIT, () => {
  console.log(`Git server running on port ${PORT_GIT}`);
});
