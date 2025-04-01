/**
 * Socket Bridge - Test Suite
 * 
 * This file contains automated tests for the Socket Bridge WebSocket relay.
 * It creates multiple clients, connects them to the server, and tests
 * message relay functionality.
 */

import WebSocket from 'ws';
import dotenv from 'dotenv';
import { setTimeout as sleep } from 'timers/promises';

// Load environment variables
dotenv.config();

// Test configuration
const PORT = process.env.SOCKET_BRIDGE_PORT || 8080;
const API_KEY = process.env.SOCKET_BRIDGE_API_KEY || 'your-secure-api-key-here';
const SERVER_URL = `ws://localhost:${PORT}`;

/**
 * Client wrapper for testing
 */
class TestClient {
  public ws: WebSocket;
  public name: string;
  public receivedMessages: string[] = [];
  
  constructor(name: string) {
    this.name = name;
    this.ws = new WebSocket(`${SERVER_URL}?apiKey=${API_KEY}&name=${name}`);
    
    this.ws.on('message', (data: Buffer) => {
      const message = data.toString();
      this.receivedMessages.push(message);
      console.log(`[${this.name}] Received: ${message}`);
    });
    
    this.ws.on('open', () => {
      console.log(`[${this.name}] Connected to Socket Bridge`);
    });
    
    this.ws.on('error', (error) => {
      console.error(`[${this.name}] Error:`, error);
    });
    
    this.ws.on('close', (code, reason) => {
      console.log(`[${this.name}] Disconnected: ${code} - ${reason}`);
    });
  }
  
  /**
   * Send a message through the WebSocket
   */
  public send(message: string): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      console.log(`[${this.name}] Sent: ${message}`);
    } else {
      console.error(`[${this.name}] Cannot send message, connection not open`);
    }
  }
  
  /**
   * Close the WebSocket connection
   */
  public close(): Promise<void> {
    return new Promise((resolve) => {
      this.ws.on('close', () => {
        resolve();
      });
      this.ws.close();
    });
  }
}

/**
 * Test if a client received a specific message
 */
function assertMessageReceived(client: TestClient, expectedMessage: string): boolean {
  const received = client.receivedMessages.some(msg => 
    // For system messages, check if they contain the expected substring
    (msg.includes('"type":"system"') && expectedMessage.startsWith('system:')) 
      ? msg.includes(expectedMessage.substring(7)) 
      : msg === expectedMessage
  );
  
  if (!received) {
    console.error(`[TEST FAILED] ${client.name} did not receive expected message: ${expectedMessage}`);
    return false;
  }
  
  console.log(`[TEST PASSED] ${client.name} received expected message: ${expectedMessage}`);
  return true;
}

/**
 * Run the Socket Bridge tests
 */
async function runTests() {
  console.log('Starting Socket Bridge tests...');
  console.log(`Connecting to ${SERVER_URL} with API key: ${API_KEY}`);
  
  try {
    // Create test clients
    console.log('Creating test clients...');
    const client1 = new TestClient('TestClient1');
    const client2 = new TestClient('TestClient2');
    const client3 = new TestClient('TestClient3');
    
    // Wait for connections to establish
    console.log('Waiting for connections to establish...');
    await sleep(1000);
    
    // Test 1: Send a message from client1 to others
    console.log('\n--- Test 1: Message relay from client1 ---');
    const testMessage1 = 'Hello from TestClient1!';
    client1.send(testMessage1);
    
    // Wait for message propagation
    await sleep(500);
    
    // Check if other clients received the message
    let success = true;
    success = assertMessageReceived(client2, testMessage1) && success;
    success = assertMessageReceived(client3, testMessage1) && success;
    
    // Test 2: Send a message from client2 to others
    console.log('\n--- Test 2: Message relay from client2 ---');
    const testMessage2 = 'Hello from TestClient2!';
    client2.send(testMessage2);
    
    // Wait for message propagation
    await sleep(500);
    
    // Check if other clients received the message
    success = assertMessageReceived(client1, testMessage2) && success;
    success = assertMessageReceived(client3, testMessage2) && success;
    
    // Test 3: System messages
    console.log('\n--- Test 3: System messages ---');
    success = assertMessageReceived(client1, 'system:Connected as TestClient1') && success;
    
    // Clean up - close all connections
    console.log('\nCleaning up - closing all connections');
    await Promise.all([
      client1.close(),
      client2.close(),
      client3.close()
    ]);
    
    // Report test results
    console.log('\n=============================');
    if (success) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

// Don't run tests if the Socket Bridge server isn't running
console.log('Checking if Socket Bridge server is running...');
const checkServer = new WebSocket(`${SERVER_URL}?apiKey=${API_KEY}`);

checkServer.on('open', () => {
  checkServer.close();
  console.log('Socket Bridge server is running. Starting tests...');
  runTests();
});

checkServer.on('error', () => {
  console.error('ERROR: Socket Bridge server is not running. Please start the server before running tests.');
  process.exit(1);
});
