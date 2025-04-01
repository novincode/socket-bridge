import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for connected WebSocket clients
 * @interface ConnectedClient
 * @property {WebSocket} ws - The WebSocket connection
 * @property {number} id - Unique identifier for the client
 * @property {string} [name] - Optional name for the client
 * @property {Date} connectedAt - When the client connected
 * @property {Date} [lastPing] - When the last ping was sent to this client
 * @property {Date} [lastPong] - When the last pong was received from this client
 * @property {boolean} [awaitingPong] - Whether the client is expected to respond to a ping
 */
interface ConnectedClient {
  ws: WebSocket;
  id: number;
  name?: string;
  connectedAt: Date;
  lastPing?: Date;
  lastPong?: Date;
  awaitingPong?: boolean;
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
  private readonly maxMessageSize: number;
  private readonly validateOrigin: boolean;
  private readonly allowedOrigins: string[];
  private readonly verbose: boolean;
  private readonly logFilePath: string | null;
  private logFileStream: fs.WriteStream | null = null;
  private readonly heartbeatInterval: number;
  private readonly pingTimeout: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new Socket Bridge Server instance
   * @param {Object} options - Configuration options
   * @param {number} [options.port] - Port to listen on (defaults to environment variable or 8080)
   * @param {string} [options.apiKey] - API key for authentication (defaults to environment variable)
   * @param {number} [options.maxClients] - Maximum number of clients allowed (defaults to environment variable or 10)
   * @param {number} [options.maxMessageSize] - Maximum message size in bytes (defaults to environment variable or 1MB)
   * @param {boolean} [options.validateOrigin] - Whether to validate connection origins (defaults to environment variable or false)
   * @param {string[]} [options.allowedOrigins] - List of allowed origins (defaults to environment variable or [])
   * @param {boolean} [options.verbose] - Whether to log detailed information (defaults to environment variable or false)
   * @param {string} [options.logFilePath] - Path to log file (null disables file logging)
   * @param {number} [options.heartbeatInterval] - Interval for sending pings (0 to disable)
   * @param {number} [options.pingTimeout] - Time to wait for pong response before disconnecting
   */
  constructor(options: {
    port?: number;
    apiKey?: string;
    maxClients?: number;
    maxMessageSize?: number;
    validateOrigin?: boolean;
    allowedOrigins?: string[];
    verbose?: boolean;
    logFilePath?: string;
    heartbeatInterval?: number;
    pingTimeout?: number;
  } = {}) {
    // Load configuration from environment variables or use defaults
    this.port = options.port || Number(process.env.SOCKET_BRIDGE_PORT) || 8080;
    this.apiKey = options.apiKey || process.env.SOCKET_BRIDGE_API_KEY || '';
    this.maxClients = options.maxClients || Number(process.env.SOCKET_BRIDGE_MAX_CLIENTS) || 10;
    this.maxMessageSize = options.maxMessageSize || Number(process.env.SOCKET_BRIDGE_MAX_MESSAGE_SIZE) || 1048576; // Default to 1MB
    this.validateOrigin = options.validateOrigin !== undefined 
      ? options.validateOrigin 
      : process.env.SOCKET_BRIDGE_VALIDATE_ORIGIN === 'true';
    
    // Parse allowed origins from environment variable or use provided array
    if (options.allowedOrigins) {
      this.allowedOrigins = options.allowedOrigins;
    } else if (process.env.SOCKET_BRIDGE_ALLOWED_ORIGINS) {
      this.allowedOrigins = process.env.SOCKET_BRIDGE_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    } else {
      this.allowedOrigins = [];
    }
    
    this.verbose = options.verbose || process.env.SOCKET_BRIDGE_VERBOSE === 'true' || false;
    
    // Set up file logging if configured
    this.logFilePath = options.logFilePath || process.env.SOCKET_BRIDGE_LOG_FILE || null;
    
    // Configure heartbeat settings
    this.heartbeatInterval = options.heartbeatInterval !== undefined
      ? options.heartbeatInterval
      : Number(process.env.SOCKET_BRIDGE_HEARTBEAT_INTERVAL) || 30000;
    
    this.pingTimeout = options.pingTimeout !== undefined
      ? options.pingTimeout
      : Number(process.env.SOCKET_BRIDGE_PING_TIMEOUT) || 10000;
    
    if (!this.apiKey) {
      this.logToConsole('Warning: No API key set. Authentication is disabled.');
    }
    
    if (this.validateOrigin && this.allowedOrigins.length === 0) {
      this.logToConsole('Warning: Origin validation is enabled but no origins are allowed. All connections will be rejected.');
    }
    
    // Initialize file logging
    this.initializeFileLogging();
    
    this.server = new WebSocketServer({ port: this.port });
    this.initializeServer();
  }

  /**
   * Initialize the log file for writing
   * @private
   */
  private initializeFileLogging(): void {
    if (!this.logFilePath) {
      return;
    }

    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(this.logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Open log file for appending
      this.logFileStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
      
      this.logToConsole(`File logging enabled. Writing to: ${this.logFilePath}`);
      
      // Set up error handler for log file stream
      this.logFileStream.on('error', (error) => {
        this.logToConsole(`Error writing to log file: ${error.message}`);
        this.logFileStream = null; // Disable file logging on error
      });
    } catch (error) {
      this.logToConsole(`Failed to initialize log file: ${error}`);
      this.logFileStream = null;
    }
  }

  /**
   * Log a message to the console
   * @private
   * @param {string} message - Message to log
   */
  private logToConsole(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  /**
   * Log a message to the file if enabled
   * @private
   * @param {string} message - Message to log
   */
  private logToFile(message: string): void {
    if (!this.logFileStream) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
      this.logFileStream.write(logEntry);
    } catch (error) {
      this.logToConsole(`Error writing to log file: ${error}`);
    }
  }

  /**
   * Log a message to both console and file
   * @private
   * @param {string} message - Message to log
   * @param {boolean} [forceLog=false] - Whether to log even if verbose is disabled
   */
  private log(message: string, forceLog: boolean = false): void {
    if (!this.verbose && !forceLog) return;
    
    this.logToConsole(message);
    this.logToFile(message);
  }

  /**
   * Initialize the WebSocket server and set up event handlers
   * @private
   */
  private initializeServer(): void {
    this.log(`WebSocket Bridge Server starting on ws://localhost:${this.port}`, true);
    this.log(`Maximum clients: ${this.maxClients}`, true);
    this.log(`Message size limit: ${this.maxMessageSize} bytes`, true);
    this.log(`Authentication: ${this.apiKey ? 'Enabled' : 'Disabled'}`, true);
    this.log(`Origin validation: ${this.validateOrigin ? 'Enabled' : 'Disabled'}`, true);
    
    if (this.validateOrigin && this.allowedOrigins.length > 0) {
      this.log(`Allowed origins: ${this.allowedOrigins.join(', ')}`, true);
    }
    
    this.log(`Heartbeat interval: ${this.heartbeatInterval > 0 ? `${this.heartbeatInterval}ms` : 'Disabled'}`, true);
    if (this.heartbeatInterval > 0) {
      this.log(`Ping timeout: ${this.pingTimeout}ms`, true);
    }
    
    this.log(`Verbose logging: ${this.verbose ? 'Enabled' : 'Disabled'}`, true);

    this.server.on('connection', this.handleConnection.bind(this));
    
    this.server.on('error', (error) => {
      this.log(`Server error: ${error}`, true);
    });

    // Start heartbeat if enabled
    if (this.heartbeatInterval > 0) {
      this.startHeartbeat();
    }
  }

  /**
   * Start sending periodic heartbeats to all clients
   * @private
   */
  private startHeartbeat(): void {
    this.log(`Starting heartbeat with interval of ${this.heartbeatInterval}ms`);
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeats();
    }, this.heartbeatInterval);
  }

  /**
   * Send ping messages to all clients and check for timeouts
   * @private
   */
  private sendHeartbeats(): void {
    const now = new Date();
    let pinged = 0;
    let timedOut = 0;

    this.clients.forEach(client => {
      // Check if client has timed out
      if (client.awaitingPong && client.lastPing) {
        const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
        
        if (timeSinceLastPing > this.pingTimeout) {
          this.log(`Client ${client.name} (ID: ${client.id}) timed out after ${timeSinceLastPing}ms`, true);
          
          try {
            // Close connection with timeout code
            client.ws.close(1001, 'Ping timeout');
            timedOut++;
          } catch (error) {
            this.log(`Error closing timed out connection: ${error}`);
          }
          
          return; // Skip sending another ping to this client
        }
      }

      // Send ping to client
      try {
        client.lastPing = now;
        client.awaitingPong = true;
        client.ws.ping();
        pinged++;
      } catch (error) {
        this.log(`Error sending ping to client ${client.name} (ID: ${client.id}): ${error}`);
      }
    });

    if (pinged > 0 || timedOut > 0) {
      this.log(`Heartbeat: Sent ${pinged} pings, ${timedOut} clients timed out`);
    }
  }

  /**
   * Check if an origin is allowed
   * @private
   * @param {string} origin - Origin to check
   * @returns {boolean} Whether the origin is allowed
   */
  private isOriginAllowed(origin: string): boolean {
    // If no origins are allowed, reject all
    if (this.allowedOrigins.length === 0) {
      return false;
    }
    
    // Check if origin is in the allowed list
    for (const allowedOrigin of this.allowedOrigins) {
      // Exact match
      if (allowedOrigin === origin) {
        return true;
      }
      
      // Wildcard subdomain match (e.g., *.example.com)
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        if (origin.endsWith(domain) && origin.lastIndexOf('.') !== origin.indexOf('.')) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Handle new WebSocket connections
   * @private
   * @param {WebSocket} ws - WebSocket connection
   * @param {IncomingMessage} request - HTTP request that initiated the connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    // Validate origin if enabled
    if (this.validateOrigin) {
      const origin = request.headers.origin;
      
      if (!origin) {
        this.log('Connection rejected: Missing origin header');
        ws.close(1003, 'Origin header is required');
        return;
      }
      
      if (!this.isOriginAllowed(origin)) {
        this.log(`Connection rejected: Origin not allowed - ${origin}`);
        ws.close(1003, 'Origin not allowed');
        return;
      }
      
      this.log(`Origin validated: ${origin}`);
    }
    
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
      connectedAt: new Date(),
      lastPong: new Date() // Initialize with current time
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

    // Set up pong handler for heartbeat responses
    ws.on('pong', () => {
      if (client) {
        client.lastPong = new Date();
        client.awaitingPong = false;
        this.log(`Received pong from client ${client.name} (ID: ${client.id})`);
      }
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
      this.log(`Error with client ${client.name} (ID: ${clientId}): ${error}`);
    });
  }

  /**
   * Handle a message from a client and relay it to other clients
   * @private
   * @param {ConnectedClient} sender - Client that sent the message
   * @param {Buffer} data - Message data
   */
  private handleMessage(sender: ConnectedClient, data: Buffer): void {
    // Check message size against configured limit
    if (data.length > this.maxMessageSize) {
      this.log(`Rejected oversized message from ${sender.name} (ID: ${sender.id}): ${data.length} bytes exceeds limit of ${this.maxMessageSize} bytes`);
      
      // Send error message to the sender
      const errorMessage: SystemMessage = {
        type: 'system',
        message: `Message rejected: Exceeds size limit of ${this.maxMessageSize} bytes`,
        timestamp: new Date().toISOString()
      };
      
      try {
        sender.ws.send(JSON.stringify(errorMessage));
      } catch (error) {
        this.log(`Failed to send error message to client ${sender.name} (ID: ${sender.id}): ${error}`);
      }
      
      return; // Don't process the message further
    }

    const message = data.toString();
    this.log(`Message from ${sender.name} (ID: ${sender.id}): ${message}`);

    // Forward message to all other connected clients
    this.clients.forEach(client => {
      if (client.id !== sender.id) {
        try {
          client.ws.send(message);
        } catch (error) {
          this.log(`Failed to send message to client ${client.name} (ID: ${client.id}): ${error}`);
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
          this.log(`Failed to send system message to ${client.name} (ID: ${client.id}): ${error}`);
        }
      }
    });
  }

  /**
   * Start the WebSocket Bridge Server
   * @public
   */
  public start(): void {
    this.log('WebSocket Bridge Server running and ready to accept connections', true);
  }

  /**
   * Gracefully stop the WebSocket Bridge Server
   * @public
   */
  public stop(): Promise<void> {
    this.log('Stopping WebSocket Bridge Server...', true);
    
    // Stop heartbeat timer if running
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.log('Heartbeat stopped', true);
    }
    
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
    
    // Close log file if open
    if (this.logFileStream) {
      this.logFileStream.end();
      this.logFileStream = null;
    }
    
    // Close server
    return new Promise((resolve) => {
      this.server.close(() => {
        this.log('WebSocket Bridge Server stopped', true);
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
