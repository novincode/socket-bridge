# 🔌 Socket Bridge

<p align="center">
  <em>Seamlessly connect WebSocket clients with powerful relay capabilities</em>
</p>

<p align="center">
  <a href="#-installation"><strong>Installation</strong></a> ·
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-usage"><strong>Usage</strong></a> ·
  <a href="#-configuration"><strong>Configuration</strong></a> ·
  <a href="#-api-reference"><strong>API</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/WebSockets-4.0-blueviolet?style=for-the-badge" alt="WebSockets"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License"/>
</p>

---

## 🚀 Overview

Socket Bridge is a lightweight yet powerful WebSocket relay server that enables real-time bidirectional communication between multiple clients. Perfect for creating chat applications, collaborative tools, or any project requiring real-time data exchange.

## ✨ Features

- **🔄 Seamless Message Relay** - Effortlessly transmit messages between connected clients
- **🔐 Robust Authentication** - Secure your WebSocket connections with API key authentication
- **⚙️ Highly Configurable** - Customize behavior through environment variables
- **📋 Detailed Logging** - Keep track of connections and message events
- **📢 Connection Announcements** - Broadcast client connection/disconnection events
- **🛑 Graceful Shutdown** - Handle process termination safely
- **🔍 TypeScript-First** - Built with type safety in mind
- **🚀 Production-Ready** - Designed for reliability in real-world applications

## 📋 Table of Contents

- [🔌 Socket Bridge](#-socket-bridge)
- [🚀 Overview](#-overview)
- [✨ Features](#-features)
- [🔧 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🚀 Usage](#-usage)
  - [Development](#development)
  - [Production](#production)
  - [Testing](#testing)
- [🔌 Connecting Clients](#-connecting-clients)
- [📖 API Reference](#-api-reference)
- [🏗️ Technical Architecture](#️-technical-architecture)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact](#-contact)

## 🔧 Installation

Get up and running with Socket Bridge in minutes:

```bash
# Clone the repository
git clone https://github.com/novincode/socket-bridge.git
cd socket-bridge

# Install dependencies
npm install
# or
pnpm install
```

## ⚙️ Configuration

Create your configuration by copying the example environment file:

```bash
cp .env.example .env
```

Then customize the settings in your `.env` file:

```properties
# Core settings
SOCKET_BRIDGE_PORT=8080                      # WebSocket server port
SOCKET_BRIDGE_API_KEY=your-secure-api-key    # Authentication key (required)
SOCKET_BRIDGE_MAX_CLIENTS=10                 # Maximum concurrent connections

# Feature toggles
SOCKET_BRIDGE_ANNOUNCE_CONNECTIONS=true      # Broadcast client connections
SOCKET_BRIDGE_VALIDATE_ORIGIN=false          # Enable origin validation
SOCKET_BRIDGE_VERBOSE=false                  # Enable detailed logging

# Advanced settings
SOCKET_BRIDGE_HEARTBEAT_INTERVAL=30000       # Heartbeat in milliseconds
```

See the `.env.example` file for all available configuration options.

## 🚀 Usage

### Development

Start Socket Bridge in development mode with auto-reloading:

```bash
npm run dev
# or
pnpm dev
```

### Production

For production environments, build and start the application:

```bash
# Build the TypeScript code
npm run build
# or
pnpm build

# Start the server
npm start
# or
pnpm start
```

### Testing

The project includes a comprehensive test suite:

```bash
# Make sure the server is running first in a separate terminal
npm run dev

# Then in another terminal
npm test
# or
pnpm test
```

The test suite creates multiple WebSocket clients and verifies that messages are properly relayed between them.

## 🔌 Connecting Clients

Connect your applications to Socket Bridge using standard WebSocket protocols:

### Browser

```javascript
// Connect with authentication and a custom name
const socket = new WebSocket('ws://localhost:8080?apiKey=your-secure-api-key-here&name=WebClient');

socket.onopen = () => {
  console.log('Connected to Socket Bridge');
  
  // Send a message to all other connected clients
  socket.send('Hello everyone!');
};

socket.onmessage = (event) => {
  const message = event.data;
  console.log('Received:', message);
  
  // Handle system messages if needed
  if (message.includes('"type":"system"')) {
    const systemMessage = JSON.parse(message);
    console.log('System:', systemMessage.message);
  }
};
```

### Node.js

```javascript
import WebSocket from 'ws';

const socket = new WebSocket('ws://localhost:8080?apiKey=your-secure-api-key-here&name=NodeClient');

socket.on('open', () => {
  console.log('Connected to Socket Bridge');
  socket.send('Hello from Node.js client!');
});

socket.on('message', (data) => {
  console.log('Received:', data.toString());
});
```

## 📖 API Reference

### Connection Parameters

When establishing a WebSocket connection, you can provide these query parameters:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `apiKey`  | Yes (if enabled) | Authentication key configured in server |
| `name`    | No       | Friendly name for the client |

Example connection URL:

```plaintext
ws://localhost:8080?apiKey=your-secure-api-key&name=ClientName
```

## 🏗️ Technical Architecture

Socket Bridge is designed with scalability and reliability in mind. It uses a modular architecture to handle WebSocket connections, authentication, and message relaying efficiently.

## 🤝 Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

Have questions or need assistance? Reach out to me!

- 📧 Email: [codeideal.com@gmail.com](mailto:codeideal.com@gmail.com)
- 💬 Telegram: [@codeideal_support](https://t.me/codeideal_support)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/novincode">Shayan</a>
</p>
