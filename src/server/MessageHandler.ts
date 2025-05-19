import { WebSocketMessage, ShipData, WinnerInfo } from '../types/index.js';
import { WebSocketServer } from './WebSocketServer.js';
import { PlayerController } from '../controllers/PlayerController.js';
import { RoomController } from '../controllers/RoomController.js';
import { GameController } from '../controllers/GameController.js';
import { ShipController } from '../controllers/ShipController.js';

export class MessageHandler {
  private wsServer: WebSocketServer;
  private playerController: PlayerController;
  private roomController: RoomController;
  private gameController: GameController;
  private shipController: ShipController;
  private clientToPlayer: Map<string, string> = new Map();

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
    this.playerController = new PlayerController();
    this.roomController = new RoomController(this.playerController);
    this.gameController = new GameController(this.playerController, this.roomController);
    this.shipController = new ShipController(this.playerController, this.roomController, this.gameController);
  }

  handleMessage(clientId: string, message: WebSocketMessage): void {
    console.log(`Processing message of type ${message.type}`);
    if (typeof message.data === 'string') {
      try {
        if (message.data.length > 0) {
          message.data = JSON.parse(message.data);
        }
      } catch (err) {
        console.error('Invalid JSON in message.body:', err);
        return;
      }
    }
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
      case 'update_winners':
        this.handleUpdateWinners(clientId, message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleRegistration(clientId: string, message: WebSocketMessage): void {
    const ws = this.wsServer.getClientSocket(clientId);
    if (!ws) return;

    this.playerController.handleRegistration(ws, message);

    if (message.data && typeof message.data === 'object' && !message.data.error) {
      const data = message.data as { name: string, password: string };
      const result = { name: data.name, password: data.password };
      const player = result.name;
      this.clientToPlayer.set(clientId, player);
    }
  }

  private handleCreateRoom(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) {
      console.error('Player not found for client', clientId);
      return;
    }

    const ws = this.wsServer.getClientSocket(clientId);
    if (!ws) return;

    this.roomController.handleCreateRoom(ws, message, playerId);
  }

  private handleAddUserToRoom(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) {
      console.error('Player not found for client', clientId);
      return;
    }

    const ws = this.wsServer.getClientSocket(clientId);
    if (!ws) return;

    this.roomController.handleAddUserToRoom(ws, message, playerId);
  }

  private handleAddShips(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) {
      console.error('Player not found for client', clientId);
      return;
    }

    if (!message.data || typeof message.data !== 'object') {
      console.error('Invalid message data', message);
      return;
    }

    const { gameId, ships, indexPlayer } = message.data as { 
      gameId: string, 
      ships: ShipData[], 
      indexPlayer: string 
    };

    if (!gameId || !ships || !indexPlayer) {
      console.error('Missing required data for add_ships', message.data);
      return;
    }

    this.shipController.addShips(gameId, ships, indexPlayer);
  }

  private handleAttack(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) {
      console.error('Player not found for client', clientId);
      return;
    }

    if (!message.data || typeof message.data !== 'object') {
      console.error('Invalid message data', message);
      return;
    }

    const { gameId, x, y, indexPlayer } = message.data as {
      gameId: string,
      x: number,
      y: number,
      indexPlayer: string
    };

    if (!gameId || x === undefined || y === undefined || !indexPlayer) {
      console.error('Missing required data for attack', message.data);
      return;
    }

    this.gameController.processAttack(gameId, x, y, indexPlayer);
  }

  private handleRandomAttack(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) {
      console.error('Player not found for client', clientId);
      return;
    }

    if (!message.data || typeof message.data !== 'object') {
      console.error('Invalid message data', message);
      return;
    }

    const { gameId, indexPlayer } = message.data as {
      gameId: string,
      indexPlayer: string
    };

    if (!gameId || !indexPlayer) {
      console.error('Missing required data for randomAttack', message.data);
      return;
    }

    this.gameController.processRandomAttack(gameId, indexPlayer);
  }

  handleUpdateWinners(clientId: string, message: WebSocketMessage): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) {
      console.error('Player not found for client', clientId);
      return;
    }

    if (!message.data || typeof message.data !== 'object') {
      console.error('Invalid message data', message);
      return;
    }

    const { winners } = message.data;
    this.playerController.broadcastWinners()
  }

  handleDisconnect(clientId: string): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (playerId) {
      this.playerController.handleDisconnect(playerId);
      this.clientToPlayer.delete(clientId);
    }
  }
}