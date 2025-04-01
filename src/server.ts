import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

/**
 * Interface for connected WebSocket clients
 * @interface ConnectedClient
 * @property {WebSocket} ws - The WebSocket connection
 * @property {number} id - Unique identifier for the client
 * @property {string} [name] - Optional name for the client
 * @property {Date} connectedAt - When the client connected
 */
interface ConnectedClient {
  ws: WebSocket;
  id: number;
  name?: string;
  connectedAt: Date;
}

/**
 * Message type definitions for the socket bridge
 * @interface SystemMessage
 */
interface SystemMessage {
  type: 'system';
  message: string;
  timestamp: string;
}

/**
 * Socket Bridge Server that relays WebSocket messages between connected clients
 * @class SocketBridgeServer
 */
export class SocketBridgeServer {
  private server: WebSocketServer;
  private clients: ConnectedClient[] = [];
  private clientCounter = 0;
  private readonly port: number;
  private readonly apiKey: string;
  private readonly maxClients: number;
  private readonly verbose: boolean;

  /**
   * Creates a new Socket Bridge Server instance
   * @param {Object} options - Configuration options
   * @param {number} [options.port] - Port to listen on (defaults to environment variable or 8080)
   * @param {string} [options.apiKey] - API key for authentication (defaults to environment variable)
   * @param {number} [options.maxClients] - Maximum number of clients allowed (defaults to environment variable or 10)
   * @param {boolean} [options.verbose] - Whether to log detailed information (defaults to environment variable or false)
   */
  constructor(options: {
    port?: number;
    apiKey?: string;
    maxClients?: number;
    verbose?: boolean;
  } = {}) {
    // Load configuration from environment variables or use defaults
    this.port = options.port || Number(process.env.SOCKET_BRIDGE_PORT) || 8080;
    this.apiKey = options.apiKey || process.env.SOCKET_BRIDGE_API_KEY || '';
    this.maxClients = options.maxClients || Number(process.env.SOCKET_BRIDGE_MAX_CLIENTS) || 10;
    this.verbose = options.verbose || process.env.SOCKET_BRIDGE_VERBOSE === 'true' || false;
    
    if (!this.apiKey) {
      console.warn('Warning: No API key set. Authentication is disabled.');
    }
    
    this.server = new WebSocketServer({ port: this.port });
    this.initializeServer();
  }

  /**
   * Initialize the WebSocket server and set up event handlers
   * @private
   */
  private initializeServer(): void {
    console.log(`WebSocket Bridge Server starting on ws://localhost:${this.port}`);
    console.log(`Maximum clients: ${this.maxClients}`);
    console.log(`Authentication: ${this.apiKey ? 'Enabled' : 'Disabled'}`);
    console.log(`Verbose logging: ${this.verbose ? 'Enabled' : 'Disabled'}`);

    this.server.on('connection', this.handleConnection.bind(this));
    
    this.server.on('error', (error) => {
      console.error('Server error:', error);
    });
  }

  /**
   * Handle new WebSocket connections
   * @private
   * @param {WebSocket} ws - WebSocket connection
   * @param {IncomingMessage} request - HTTP request that initiated the connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    // Parse URL query parameters
    const { query } = parse(request.url || '', true);
    const apiKey = query.apiKey as string;
    const clientName = query.name as string;

    // Authenticate client using API key (if enabled)
    if (this.apiKey && apiKey !== this.apiKey) {
      this.log('Connection rejected: Invalid API key');
      ws.close(1008, 'Invalid API key');
      return;
    }

    // Check if maximum clients reached
    if (this.clients.length >= this.maxClients) {
      this.log('Connection rejected: Maximum clients reached');
      ws.close(1013, 'Maximum clients reached');
      return;
    }

    // Create and register new client
    const clientId = ++this.clientCounter;
    const client: ConnectedClient = {
      ws,
      id: clientId,
      name: clientName || `client-${clientId}`,
      connectedAt: new Date()
    };

    this.clients.push(client);
    this.log(`Client ${client.name} (ID: ${clientId}) connected. Total clients: ${this.clients.length}`);

    // Send welcome message to client
    const welcomeMessage: SystemMessage = {
      type: 'system',
      message: `Connected as ${client.name} (ID: ${clientId})`,
      timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(welcomeMessage));

    // Notify other clients about the new connection if enabled
    if (process.env.SOCKET_BRIDGE_ANNOUNCE_CONNECTIONS === 'true') {
      this.broadcastSystemMessage({
        type: 'system',
        message: `${client.name} has joined the bridge`,
        timestamp: new Date().toISOString()
      }, client.id);
    }

    // Set up message handler for this client
    ws.on('message', (data: Buffer) => {
      this.handleMessage(client, data);
    });

    // Handle disconnection
    ws.on('close', () => {
      this.log(`Client ${client.name} (ID: ${clientId}) disconnected`);
      this.clients = this.clients.filter(c => c.id !== clientId);
      
      // Notify other clients about the disconnection if enabled
      if (process.env.SOCKET_BRIDGE_ANNOUNCE_CONNECTIONS === 'true') {
        this.broadcastSystemMessage({
          type: 'system',
          message: `${client.name} has left the bridge`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`Error with client ${client.name} (ID: ${clientId}):`, error);
    });
  }

  /**
   * Handle a message from a client and relay it to other clients
   * @private
   * @param {ConnectedClient} sender - Client that sent the message
   * @param {Buffer} data - Message data
   */
  private handleMessage(sender: ConnectedClient, data: Buffer): void {
    const message = data.toString();
    this.log(`Message from ${sender.name} (ID: ${sender.id}): ${message}`);

    // Forward message to all other connected clients
    this.clients.forEach(client => {
      if (client.id !== sender.id) {
        try {
          client.ws.send(message);
        } catch (error) {
          console.error(`Failed to send message to client ${client.name} (ID: ${client.id}):`, error);
        }
      }
    });
  }

  /**
   * Broadcast a system message to all clients
   * @private
   * @param {SystemMessage} message - System message to broadcast
   * @param {number} [excludeClientId] - Optional client ID to exclude from broadcast
   */
  private broadcastSystemMessage(message: SystemMessage, excludeClientId?: number): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (!excludeClientId || client.id !== excludeClientId) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error(`Failed to send system message to ${client.name} (ID: ${client.id}):`, error);
        }
      }
    });
  }

  /**
   * Log a message if verbose logging is enabled
   * @private
   * @param {string} message - Message to log
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }

  /**
   * Start the WebSocket Bridge Server
   * @public
   */
  public start(): void {
    console.log('WebSocket Bridge Server running and ready to accept connections');
  }

  /**
   * Gracefully stop the WebSocket Bridge Server
   * @public
   */
  public stop(): Promise<void> {
    console.log('Stopping WebSocket Bridge Server...');
    
    // Send disconnect messages to all clients
    const disconnectMessage: SystemMessage = {
      type: 'system',
      message: 'Server shutting down',
      timestamp: new Date().toISOString()
    };
    
    this.clients.forEach(client => {
      try {
        client.ws.send(JSON.stringify(disconnectMessage));
        client.ws.close();
      } catch (error) {
        // Ignore errors during shutdown
      }
    });
    
    // Clear clients array
    this.clients = [];
    
    // Close server
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('WebSocket Bridge Server stopped');
        resolve();
      });
    });
  }

  /**
   * Get the number of currently connected clients
   * @public
   * @returns {number} Number of connected clients
   */
  public getClientCount(): number {
    return this.clients.length;
  }
}
