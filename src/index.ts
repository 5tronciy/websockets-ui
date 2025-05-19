import { WebSocketServer } from './server/WebSocketServer.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const server = new WebSocketServer(PORT);

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close();
  process.exit(0);
});

console.log(`Battleship WebSocket server is running on port ${PORT}`);