// Import the Express module
const express = require('express');

// Create an Express application
const app = express();

// Define a port number
const port = 5000;

// Create a route for the root URL "/"
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
