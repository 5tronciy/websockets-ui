import WebSocket from 'ws';
import { Player } from '../models/Player.js';
import { WebSocketMessage, PlayerData } from '../types/index.js';

export class PlayerController {
  private connections: Map<string, WebSocket> = new Map();

  handleRegistration(ws: WebSocket, message: WebSocketMessage): void {
    try {
      const data = message.data as PlayerData;

      if (!data.name || !data.password) {
        this.sendResponse(ws, {
          type: 'reg',
          data: {
            name: '',
            index: '',
            error: true,
            errorText: 'Name and password are required'
          },
          id: 0
        });
        return;
      }

      const result = Player.registerOrLogin(data.name, data.password);

      if (!result.error && result.index) {
        this.connections.set(result.index, ws);
      }

      this.sendResponse(ws, {
        type: 'reg',
        data: {
          name: data.name,
          index: result.index,
          error: result.error,
          errorText: result.errorText
        },
        id: 0
      });

      if (!result.error) {
        this.broadcastWinners();
      }
    } catch (error) {
      console.error('Error handling registration:', error);
      this.sendResponse(ws, {
        type: 'reg',
        data: {
          name: '',
          index: '',
          error: true,
          errorText: 'Internal server error'
        },
        id: 0
      });
    }
  }

  broadcastWinners(): void {
    const winners = Player.getWinners();
    const message: WebSocketMessage = {
      type: 'update_winners',
      data: winners,
      id: 0
    };

    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendResponse(ws, message);
      }
    });
  }

  getPlayerConnection(playerId: string): WebSocket | undefined {
    return this.connections.get(playerId);
  }

  removeConnection(playerId: string): void {
    this.connections.delete(playerId);
  }

  private sendResponse(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      console.log('Response sent:', message);
    }
  }

  sendToPlayer(playerId: string, message: WebSocketMessage): boolean {
    const ws = this.connections.get(playerId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      console.log(`Message sent to player ${playerId}:`, message);
      return true;
    }

    return false;
  }

  handleDisconnect(playerId: string): void {
    this.removeConnection(playerId);

    Player.setActiveGame(playerId, null);
  }

  updatePlayerWin(playerId: string): void {
    if (Player.incrementWins(playerId)) {
      this.broadcastWinners();
    }
  }

  broadcastMessage(message: WebSocketMessage): void {
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
    console.log('Broadcast message sent:', message);
  }
}