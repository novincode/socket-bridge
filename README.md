# Socket Bridge

A lightweight, configurable WebSocket bridge/relay server that enables communication between multiple clients.

## Features

- Simple WebSocket relay functionality
- API key authentication
- Configurable via environment variables
- Connection and message event logging
- Client connection announcements
- Graceful shutdown handling

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/socket-bridge.git
cd socket-bridge

# Install dependencies
npm install
# or
pnpm install
```

## Configuration

Copy the `.env.example` file to `.env` and customize the settings:

```bash
cp .env.example .env
```

Edit the `.env` file to configure your Socket Bridge instance. See the file for detailed explanations of each setting.

## Usage

### Development

```bash
npm run dev
# or
pnpm dev
```

### Production

```bash
# Build the application
npm run build
# or
pnpm build

# Start the server
npm start
# or
pnpm start
```

## Connecting to the Socket Bridge

Clients can connect to the Socket Bridge using the WebSocket protocol. If authentication is enabled, clients must provide the API key as a query parameter:

```javascript
// Browser example
const socket = new WebSocket('ws://localhost:8080?apiKey=your-secure-api-key-here&name=MyClient');

socket.onopen = () => {
  console.log('Connected to Socket Bridge');
  socket.send('Hello from client!');
};

socket.onmessage = (event) => {
  console.log('Received message:', event.data);
};
```

## API Reference

### Query Parameters

When connecting to the Socket Bridge, the following query parameters can be used:

- `apiKey`: Authentication key (required if authentication is enabled)
- `name`: Client name (optional)

### Message Format

System messages from the server follow this format:

```json
{
  "type": "system",
  "message": "System message content",
  "timestamp": "2023-06-15T12:34:56.789Z"
}
```

## License

MIT
