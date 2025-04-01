import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

// Configuration constants
const PORT = 8080;
const VALID_API_KEY = '123456';
const MAX_CLIENTS = 2;

// Interface for connected clients
interface ConnectedClient {
  ws: WebSocket;
  id: number;
}

export class SocketBridgeServer {
  private server: WebSocketServer;
  private clients: ConnectedClient[] = [];
  private clientCounter = 0;

  constructor() {
    this.server = new WebSocketServer({ port: PORT });
    this.initializeServer();
  }

  private initializeServer(): void {
    console.log(`WebSocket Bridge Server starting on ws://localhost:${PORT}`);

    this.server.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      // Authenticate client using API key
      const { query } = parse(request.url || '', true);
      const apiKey = query.apiKey as string;

      if (apiKey !== VALID_API_KEY) {
        console.log('Connection rejected: Invalid API key');
        ws.close(1008, 'Invalid API key');
        return;
      }

      // Check if maximum clients reached
      if (this.clients.length >= MAX_CLIENTS) {
        console.log('Connection rejected: Maximum clients reached');
        ws.close(1013, 'Maximum clients reached');
        return;
      }

      // Create and register new client
      const clientId = ++this.clientCounter;
      const client: ConnectedClient = {
        ws,
        id: clientId
      };

      this.clients.push(client);
      console.log(`Client ${clientId} connected. Total clients: ${this.clients.length}`);

      // Send welcome message to client
      ws.send(JSON.stringify({
        type: 'system',
        message: `Connected as client #${clientId}`,
        timestamp: new Date().toISOString()
      }));

      // Set up message handler for this client
      ws.on('message', (data: Buffer) => {
        this.handleMessage(client, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        this.clients = this.clients.filter(c => c.id !== clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`Error with client ${clientId}:`, error);
      });
    });
  }

  private handleMessage(sender: ConnectedClient, data: Buffer): void {
    const message = data.toString();
    console.log(`Message from client ${sender.id}: ${message}`);

    // Forward message to all other connected clients
    this.clients.forEach(client => {
      if (client.id !== sender.id) {
        try {
          client.ws.send(message);
        } catch (error) {
          console.error(`Failed to send message to client ${client.id}:`, error);
        }
      }
    });
  }

  public start(): void {
    console.log('WebSocket Bridge Server running and ready to accept connections');
  }
}
