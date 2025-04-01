import { SocketBridgeServer } from './server';
import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

// Create and start the WebSocket bridge server
const server = new SocketBridgeServer();
server.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
});

console.log('Socket Bridge application started');
