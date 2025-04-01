# 🔌 Socket Bridge

<p align="center">
  <em>Seamlessly connect WebSocket clients with powerful relay capabilities</em>
</p>

<p align="center">
  <a href="#-quick-start"><strong>Quick Start</strong></a> ·
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

Socket Bridge empowers developers to build real-time WebSocket applications effortlessly—whether it's chat apps, multiplayer games, or live dashboards. It acts as a relay server, ensuring secure and efficient message delivery between clients with minimal latency and maximum reliability.

<p align="center">
  <code>Client A ⟷ Socket Bridge Server ⟷ Client B, Client C, Client D...</code>
</p>

## 🚀 Quick Start

Get up and running in seconds:

```bash
# Clone, install, and start in one go
git clone https://github.com/novincode/socket-bridge.git && cd socket-bridge
pnpm install && cp .env.example .env && pnpm dev
```

🚨 **Security Tip:** Never expose your API key in client-side code. Use a secure backend to manage authentication.

## ✨ Features

- **🔄 Instant Message Relay** - Real-time bidirectional communication with millisecond latency
- **🔐 Enterprise-grade Security** - API key authentication, origin validation, and connection limits
- **⚙️ Flexible Configuration** - Tailor server behavior through environment variables or code
- **📋 Comprehensive Logging** - Console and file-based logging with detailed connection events
- **❤️ Health Monitoring** - Automatic heartbeat and connection monitoring with configurable intervals
- **📢 Event Broadcasting** - Built-in client join/leave notifications for all connected clients
- **🛑 Graceful Error Handling** - Automatic recovery from network issues and message size limits
- **🚀 Scalable & Reliable** - Handles thousands of connections effortlessly with minimal resource usage

## 📋 Table of Contents

- [🔌 Socket Bridge](#-socket-bridge)
- [🚀 Overview](#-overview)
- [🚀 Quick Start](#-quick-start)
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
SOCKET_BRIDGE_LOG_FILE=logs                  # Path for log files
SOCKET_BRIDGE_MAX_MESSAGE_SIZE=1048576       # Max message size (1MB)
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

Socket Bridge uses a high-performance WebSocket server with these key components:

- **Connection Manager:** Handles client authentication and connection tracking
- **Message Relay:** Efficiently broadcasts messages to all appropriate clients
- **Heartbeat System:** Maintains connection health with configurable ping intervals
- **Security Layer:** Validates origins and API keys for enhanced protection
- **Logging System:** Provides detailed insights into server operations

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
