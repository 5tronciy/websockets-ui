import { WebSocketServer } from './server/WebSocketServer.js';
import { httpServer } from "./server/http_server/index.js";

const HTTP_PORT = 8181;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

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