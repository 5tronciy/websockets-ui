import WebSocket from 'ws';
import { Room } from '../models/Room.js';
import { Game } from '../models/Game.js';
import { WebSocketMessage, AddUserToRoomData } from '../types/index.js';
import { PlayerController } from './PlayerController.js';

export class RoomController {
  private playerController: PlayerController;

  constructor(playerController: PlayerController) {
    this.playerController = playerController;
  }

  handleCreateRoom(ws: WebSocket, message: WebSocketMessage, playerId: string): void {
    try {
      const roomId = Room.createRoom(playerId);

      console.log(`Room created: ${roomId} by player ${playerId}`);

      this.broadcastRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      this.sendResponse(ws, {
        type: 'error',
        data: JSON.stringify({ message: 'Failed to create room' }),
        id: 0
      });
    }
  }

  handleAddUserToRoom(ws: WebSocket, message: WebSocketMessage, playerId: string): void {
    try {
      const data = message.data as AddUserToRoomData;

      if (!data.indexRoom) {
        this.sendResponse(ws, {
          type: 'error',
          data: JSON.stringify({ message: 'Room index is required' }),
          id: 0
        });
        return;
      }

      const roomId = data.indexRoom.toString();

      const roomPlayers = Room.getRoom(roomId);
      if (!roomPlayers || roomPlayers.length === 0) {
        this.sendResponse(ws, {
          type: 'error',
          data: JSON.stringify({ message: 'Room not found' }),
          id: 0
        });
        return;
      }

      const firstPlayerId = roomPlayers[0];

      const result = Room.addPlayerToRoom(roomId, playerId);

      if (!result) {
        this.sendResponse(ws, {
          type: 'error',
          data: JSON.stringify({ message: 'Failed to join room' }),
          id: 0
        });
        return;
      }

      const gameId = result.gameId;

      const secondPlayerMessage: WebSocketMessage = {
        type: 'create_game',
        data: JSON.stringify({
          idGame: gameId,
          idPlayer: result.playerGameId
        }),
        id: 0
      };
      this.sendResponse(ws, secondPlayerMessage);

      const firstPlayerGameId = Game.getPlayerGameId(gameId, firstPlayerId);
      if (firstPlayerGameId) {
        const firstPlayerMessage: WebSocketMessage = {
          type: 'create_game',
          data: {
            idGame: gameId,
            idPlayer: firstPlayerGameId
          },
          id: 0
        };
        this.playerController.sendToPlayer(firstPlayerId, firstPlayerMessage);
      }

      this.broadcastRooms();

    } catch (error) {
      console.error('Error adding user to room:', error);
      this.sendResponse(ws, {
        type: 'error',
        data: JSON.stringify({ message: 'Internal server error' }),
        id: 0
      });
    }
  }

  broadcastRooms(): void {
    const rooms = Room.getAvailableRooms();
    console.log(JSON.stringify(rooms, null, 2));
    const message: WebSocketMessage = {
      type: 'update_room',
      data: JSON.stringify(rooms),
      id: 0
    };

    this.playerController.broadcastMessage(message);

    console.log('Broadcasted room update to all players');
  }

  private sendResponse(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      console.log('Response sent:', message);
    }
  }

  sendMessageToRoom(roomId: string, message: WebSocketMessage): void {
    try {
      const players = Room.getRoom(roomId);

      if (!players || players.length === 0) {
        console.error(`No players found in room ${roomId}`);
        return;
      }

      for (const playerId of players) {
        this.playerController.sendToPlayer(playerId, message);
      }

      console.log(`Message sent to all players in room ${roomId}:`, message.type);
    } catch (error) {
      console.error(`Error sending message to room ${roomId}:`, error);
    }
  }
  removeRoom(roomId: string): void {
    try {
      const result = Room.deleteRoom(roomId);

      if (result) {
        console.log(`Room ${roomId} successfully removed`);

        this.broadcastRooms();
      } else {
        console.error(`Failed to remove room ${roomId}`);
      }
    } catch (error) {
      console.error(`Error removing room ${roomId}:`, error);
    }
  }
}