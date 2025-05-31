/**Server Runtime Management
Purpose: Manages the HTTP server lifecycle
Responsibility: Starting, stopping, process management
Focus: "How the app runs" */
import app from './app.ts';
import { config } from './config/config.ts';

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
// TODO: Implement complex disconnection logic if needed
/**
SIGTERM (Signal Terminate)
    Sent by: Process managers (PM2, Docker, Kubernetes)
    When: During deployments, scaling down, container restarts
    Meaning: "Please shut down cleanly"
SIGINT (Signal Interrupt)
    Sent by: User pressing Ctrl+C in terminal
    When: Manual interruption during development
    Meaning: "Stop what you're doing now"
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close(() => {
    console.log('Process terminated');
  });
});
