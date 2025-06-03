// index.ts

// Import the Express app configuration from app.ts
import dotenv from 'dotenv';

import app from './app.ts';
// Import our database functions
import {
  testConnection,
  closeDatabase,
} from '../database/scripts/connection.ts';

// Import dotenv to load environment variables

// Load .env file variables into process.env
dotenv.config();
// Variable to store our server instance`
// 'let' means this variable can be reassigned later
let server: any;

// Main function to start everything
async function startServer() {
  // First, test if we can connect to the database
  console.log('🔄 Testing database connection...');

  // await means "wait for this to finish before continuing"
  const dbConnected = await testConnection();

  // If database connection failed, stop here
  if (!dbConnected) {
    console.error('❌ Cannot start server without database');
    // Exit the program with error code 1 (means "something went wrong")
    process.exit(1);
  }

  // If we get here, database is working! Now start the web server
  // process.env.PORT comes from your .env file
  // Number() converts the string to a number
  server = app.listen(Number(process.env.PORT), () => {
    // This function runs when server starts successfully
    console.log(
      `🚀 Server running on http://${process.env.HOST}:${process.env.PORT}`
    );
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  });
}

// Function to shut down cleanly
async function shutdown(signal: string) {
  // signal tells us why we're shutting down (SIGTERM, SIGINT, etc.)
  console.log(`\n📴 ${signal} received, shutting down gracefully...`);

  // First, stop accepting new requests
  if (server) {
    // server.close() stops accepting new connections
    // The callback runs when all existing connections are done
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
  }

  // Then close database connections
  await closeDatabase();

  // Finally, exit the program
  console.log('👋 Goodbye!');
  // Exit with code 0 (means "everything is OK")
  process.exit(0);
}

// Start everything!
startServer();

// Listen for shutdown signals
// SIGTERM: Sent by hosting platforms (Heroku, Docker) when stopping
process.on('SIGTERM', () => shutdown('SIGTERM'));

// SIGINT: Sent when you press Ctrl+C in terminal
process.on('SIGINT', () => shutdown('SIGINT'));
