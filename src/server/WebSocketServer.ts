import { WebSocketServer as WSServer } from 'ws';
import type WebSocket from 'ws';
import { WebSocketMessage } from '../types/index.js';
import { MessageHandler } from './MessageHandler.js';

export class WebSocketServer {
  private server: WSServer;
  private clients: Map<string, WebSocket> = new Map();
  private messageHandler: MessageHandler;

  constructor(port: number) {
    this.server = new WSServer({ port });
    this.messageHandler = new MessageHandler(this);

    this.initializeServerEvents();
  }

  private initializeServerEvents(): void {
    this.server.on('connection', (ws: WebSocket) => {
      const clientId = Math.random().toString(36).substring(2, 15);
      this.clients.set(clientId, ws);

      console.log(`Client connected: ${clientId}`);

      ws.addEventListener('message', (event) => {
        const message = this.parseMessage(event.data.toString());
        if (message) {
          console.log(`Received message from ${clientId}:`, message);
          this.messageHandler.handleMessage(clientId, message);
        }
      });

      ws.addEventListener('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.messageHandler.handleDisconnect(clientId);
        this.clients.delete(clientId);
      });

      ws.addEventListener('error', (error) => {
        console.error(`Client error for ${clientId}:`, error);
      });
    });

    this.server.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private parseMessage(data: string): WebSocketMessage | null {
    try {
      const message = JSON.parse(data);
      if (typeof message !== 'object' || message === null) {
        return null;
      }

      if (!message.type || message.id === undefined) {
        return null;
      }

      return message;
    } catch (error) {
      console.error('Failed to parse message:', error);
      return null;
    }
  }

  sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === 1) {
      console.log(`Sending message to ${clientId}:`, message);
      client.send(JSON.stringify(message));
    }
  }

  sendToClients(clientIds: string[], message: WebSocketMessage): void {
    for (const clientId of clientIds) {
      this.sendToClient(clientId, message);
    }
  }

  broadcast(message: WebSocketMessage): void {
    console.log('Broadcasting message:', message);
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, message);
    }
  }

  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  getClientSocket(clientId: string): WebSocket | undefined {
    return this.clients.get(clientId);
  }

  close(): void {
    this.server.close((err) => {
      if (err) {
        console.error('Error closing WebSocket server:', err);
      } else {
        console.log('WebSocket server closed successfully');
      }
    });
  }
}