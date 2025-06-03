// src/database/connection.ts

// Import Pool from the 'pg' package (PostgreSQL client for Node.js)
// Pool is like a bucket of database connections that can be reused

import dotenv from 'dotenv';
import { Pool } from 'pg';
// Import dotenv to load environment variables

// Load .env file variables into process.env
dotenv.config();

// Create a new connection pool
// Think of a pool as a group of reusable database connections
// Instead of creating a new connection for each query (slow),
// we reuse connections from the pool (fast)
export const pool = new Pool({
  // Where is your database? (like a house address)
  host: process.env.DB_HOST,

  // What port? (like a door number, PostgreSQL default is 5432)
  port: Number(process.env.DB_PORT),

  // Which database to connect to? (like which room in the house)
  database: process.env.DB_NAME,

  // Username for authentication
  user: process.env.DB_USER,

  // Password for authentication
  password: process.env.DB_PASSWORD,

  // Maximum number of connections to create at once
  // Like saying "I can have maximum 20 phone lines open"
  max: 20,

  // Close a connection if it's been idle for 30 seconds (30000 ms)
  // Prevents keeping unnecessary connections open
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT),

  // If connecting takes more than 2 seconds, give up
  // Prevents hanging forever if database is down
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT),
});

// Test if we can connect to the database
// This function returns a Promise (a future value)
export async function testConnection() {
  try {
    // Try to run a simple query: SELECT NOW() gets current time
    const result = await pool.query('SELECT NOW()');

    // If we get here, connection worked!
    console.log('✅ Database connected at:', result.rows[0].now);
    return true;
  } catch (error) {
    // If something went wrong, log the error
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Function to close all database connections
// Important for graceful shutdown
export async function closeDatabase() {
  try {
    // Tell the pool to close all connections
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
}
