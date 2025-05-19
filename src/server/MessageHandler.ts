import { WebSocketMessage } from '../types/index.js';
import { WebSocketServer } from './WebSocketServer.js';
import { Player } from '../models/Player.js';
import { Room } from '../models/Room.js';
import { Game } from '../models/Game.js';

export class MessageHandler {
  [x: string]: any;
  private wsServer: WebSocketServer;
  private clientToPlayer: Map<string, string> = new Map();

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  handleMessage(clientId: string, message: WebSocketMessage): void {
    switch (message.type) {
      case 'reg':
        this.handleRegistration(clientId, message);
        break;
      case 'create_room':
        this.handleCreateRoom(clientId, message);
        break;
      case 'add_user_to_room':
        this.handleAddUserToRoom(clientId, message);
        break;
      case 'add_ships':
        this.handleAddShips(clientId, message);
        break;
      case 'attack':
        this.handleAttack(clientId, message);
        break;
      case 'randomAttack':
        this.handleRandomAttack(clientId, message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleRegistration(clientId: string, message: WebSocketMessage): void {
    const { name, password } = message.data;

    if (!name || !password) {
      this.wsServer.sendToClient(clientId, {
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

    const result = Player.registerOrLogin(name, password);

    if (!result.error) {
      this.clientToPlayer.set(clientId, result.index);

      this.broadcastRooms();

      this.broadcastWinners();
    }

    this.wsServer.sendToClient(clientId, {
      type: 'reg',
      data: {
        name,
        ...result
      },
      id: 0
    });
  }

  private handleCreateRoom(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) return;

    const roomId = Room.createRoom(playerId);

    this.broadcastRooms();
  }

  private handleAddUserToRoom(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) return;

    const { indexRoom } = message.data;
    if (!indexRoom) return;

    const result = Room.addPlayerToRoom(indexRoom, playerId);
    if (!result) return;

    const { gameId, playerGameId } = result;

    const game = Game.getGame(gameId);
    if (!game) return;

    const otherPlayerId = Array.from(game.players.keys()).find(id => id !== playerId);
    if (!otherPlayerId) return;

    const otherClientId = this.findClientByPlayerId(otherPlayerId);
    if (!otherClientId) return;

    this.wsServer.sendToClient(clientId, {
      type: 'create_game',
      data: {
        idGame: gameId,
        idPlayer: playerGameId
      },
      id: 0
    });

    this.wsServer.sendToClient(otherClientId, {
      type: 'create_game',
      data: {
        idGame: gameId,
        idPlayer: game.playerIds[otherPlayerId]
      },
      id: 0
    });

    this.broadcastRooms();
  }

  private handleAddShips(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) return;

    const { gameId, ships, indexPlayer } = message.data;
    if (!gameId || !ships || indexPlayer === undefined) return;

    const game = Game.getGame(gameId);
    if (!game) return;

    const playerGameId = game.playerIds[playerId];
    if (!playerGameId) return;

    this.shipController.addShips(gameId, ships, playerGameId);
  }

  private handleAttack(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) return;

    const { gameId, x, y, indexPlayer } = message.data;
    if (gameId === undefined || x === undefined || y === undefined || indexPlayer === undefined) return;

    const position = { x, y };
    const result = Game.attack(gameId, playerId, position);
    if (!result) return;

    this.broadcastAttackResult(gameId, result);

    const game = Game.getGame(gameId);
    if (game && game.isFinished && game.winner) {
      Player.incrementWins(game.winner);

      this.broadcastGameFinish(gameId);

      this.broadcastWinners();
    } else {
      this.broadcastTurn(gameId);
    }
  }

  private handleRandomAttack(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) return;

    const { gameId, indexPlayer } = message.data;
    if (!gameId || indexPlayer === undefined) return;

    const result = Game.randomAttack(gameId, playerId);
    if (!result) return;

    this.broadcastAttackResult(gameId, result);

    const game = Game.getGame(gameId);
    if (game && game.isFinished && game.winner) {
      Player.incrementWins(game.winner);

      this.broadcastGameFinish(gameId);

      this.broadcastWinners();
    } else {
      this.broadcastTurn(gameId);
    }
  }

  private broadcastRooms(): void {
    const rooms = Room.getAvailableRooms();

    this.wsServer.broadcast({
      type: 'update_room',
      data: rooms,
      id: 0
    });
  }

  private broadcastWinners(): void {
    const winners = Player.getWinners();

    this.wsServer.broadcast({
      type: 'update_winners',
      data: winners,
      id: 0
    });
  }

  private broadcastAttackResult(gameId: string, result: any): void {
    const game = Game.getGame(gameId);
    if (!game) return;

    for (const pid of game.players.keys()) {
      const cid = this.findClientByPlayerId(pid);
      if (!cid) continue;

      this.wsServer.sendToClient(cid, {
        type: 'attack',
        data: result,
        id: 0
      });
    }
  }

  private broadcastTurn(gameId: string): void {
    const game = Game.getGame(gameId);
    if (!game || !game.currentTurn) return;

    const currentPlayerId = game.currentTurn;
    const currentPlayerGameId = game.playerIds[currentPlayerId];

    for (const pid of game.players.keys()) {
      const cid = this.findClientByPlayerId(pid);
      if (!cid) continue;

      this.wsServer.sendToClient(cid, {
        type: 'turn',
        data: {
          currentPlayer: currentPlayerGameId
        },
        id: 0
      });
    }
  }

  private broadcastGameFinish(gameId: string): void {
    const game = Game.getGame(gameId);
    if (!game || !game.winner) return;

    const winnerPlayerGameId = game.playerIds[game.winner];

    for (const pid of game.players.keys()) {
      const cid = this.findClientByPlayerId(pid);
      if (!cid) continue;

      this.wsServer.sendToClient(cid, {
        type: 'finish',
        data: {
          winPlayer: winnerPlayerGameId
        },
        id: 0
      });
    }
  }

  private findClientByPlayerId(playerId: string): string | undefined {
    for (const [clientId, pid] of this.clientToPlayer.entries()) {
      if (pid === playerId) {
        return clientId;
      }
    }
    return undefined;
  }
}