/**
 * Socket Bridge - Main Entry Point
 * 
 * This is the main entry point for the Socket Bridge application.
 * It creates and starts a WebSocket bridge server that relays messages
 * between connected clients.
 * 
 * @module index
 */

import { SocketBridgeServer } from './server';
import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

/**
 * Create and start the WebSocket bridge server
 * Uses configuration from environment variables
 */
function startServer() {
  console.log('Starting Socket Bridge application...');
  
  try {
    // Initialize the server with configuration from environment variables
    const server = new SocketBridgeServer();
    server.start();
    
    // Handle graceful shutdown
    setupShutdownHandlers(server);
    
    console.log('Socket Bridge application started successfully');
  } catch (error) {
    console.error('Failed to start Socket Bridge application:', error);
    process.exit(1);
  }
}

/**
 * Set up handlers for graceful shutdown
 * @param {SocketBridgeServer} server - The server instance to shut down
 */
function setupShutdownHandlers(server: SocketBridgeServer) {
  // Handle termination signals
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`Received ${signal} signal. Shutting down gracefully...`);
      
      try {
        await server.stop();
        console.log('Shutdown complete. Exiting process.');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // Attempt graceful shutdown
    server.stop().finally(() => process.exit(1));
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });
}

// Start the server
startServer();
