import { WebSocket } from 'ws';
import { PlayerController } from './PlayerController.js';
import { RoomController } from './RoomController.js';
import { GameController } from './GameController.js';
import { ShipData, WebSocketMessage, Position } from '../types/index.js';
import { Ship } from '../models/Ship.js';
import { Game } from '../models/Game.js';

export class ShipController {
  private playerController: PlayerController;
  private roomController: RoomController;
  private gameController: GameController;

  constructor(
    playerController: PlayerController,
    roomController: RoomController,
    gameController: GameController
  ) {
    this.playerController = playerController;
    this.roomController = roomController;
    this.gameController = gameController;
  }

  public addShips(
    gameId: string,
    ships: ShipData[],
    playerGameId: string
  ): void {
    if (!this.validateShips(ships)) {
      const errorMessage: WebSocketMessage = {
        type: 'error',
        data: JSON.stringify({
          message: 'Invalid ship configuration'
        }),
        id: 0
      };

      const game = this.getGameById(gameId);
      if (game) {
        const playerInfo = game.players.get(playerGameId);
        if (playerInfo) {
          this.playerController.sendToPlayer(playerInfo.playerIndex, errorMessage);
        }
      }
      return;
    }

    const game = this.getGameById(gameId);

    if (!game) {
      console.error(`Game with id ${gameId} not found`);
      return;
    }

    const playerBoard = game.getPlayerBoard(playerGameId);
    if (!playerBoard) {
      console.error(`Player ${playerGameId} not found in game ${gameId}`);
      return;
    }

    const shipObjects = ships.map(shipData => new Ship(shipData));

    playerBoard.ships = [...shipObjects];

    game.setPlayerReady(playerGameId);

    const confirmMessage: WebSocketMessage = {
      type: 'ships_placed',
      data: JSON.stringify({
        success: true,
        message: 'Ships placed successfully'
      }),
      id: 0
    };

    const playerInfo = game.players.get(playerGameId);
    if (playerInfo) {
      this.playerController.sendToPlayer(playerInfo.playerIndex, confirmMessage);
    }

    if (game.areAllPlayersReady()) {
      this.startGame(gameId);
    }
  }

  private startGame(gameId: string): void {
    const game = this.getGameById(gameId);

    if (!game) {
      console.error(`Game with id ${gameId} not found`);
      return;
    }

    const firstPlayerId = game.determineFirstPlayer();

    for (const [playerGameId, playerInfo] of game.players) {
      const playerBoard = game.getPlayerBoard(playerGameId);

      if (!playerBoard) continue;

      const ships = this.getShips(gameId, playerGameId);

      const startGameMessage: WebSocketMessage = {
        type: 'start_game',
        data: JSON.stringify({
          ships,
          currentPlayerIndex: playerGameId,
        }),
        id: 0,
      };

      const playerSocket = this.getPlayerSocket(playerInfo.playerIndex);
      if (playerSocket && playerSocket.readyState === WebSocket.OPEN) {
        playerSocket.send(JSON.stringify(startGameMessage));
      }
    }

    const turnMessage: WebSocketMessage = {
      type: 'turn',
      data: JSON.stringify({
        currentPlayer: firstPlayerId,
      }),
      id: 0,
    };

    this.roomController.sendMessageToRoom(gameId, turnMessage);

    game.setCurrentPlayer(firstPlayerId);
  }

  private validateShips(ships: ShipData[]): boolean {
    if (ships.length !== 10) {
      return false;
    }

    const shipCounts = {
      huge: 0,
      large: 0,
      medium: 0,
      small: 0,
    };

    for (const ship of ships) {
      shipCounts[ship.type]++;

      if ((ship.type === 'huge' && ship.length !== 4) ||
        (ship.type === 'large' && ship.length !== 3) ||
        (ship.type === 'medium' && ship.length !== 2) ||
        (ship.type === 'small' && ship.length !== 1)) {
        return false;
      }

      if (ship.position.x < 0 || ship.position.x > 9 ||
        ship.position.y < 0 || ship.position.y > 9) {
        return false;
      }

      const lastCell = this.calculateLastCell(ship);
      if (lastCell.x < 0 || lastCell.x > 9 || lastCell.y < 0 || lastCell.y > 9) {
        return false;
      }
    }

    if (shipCounts.huge !== 1 || shipCounts.large !== 2 ||
      shipCounts.medium !== 3 || shipCounts.small !== 4) {
      return false;
    }

    const occupiedCells: Position[] = [];

    for (const shipData of ships) {
      const ship = new Ship(shipData);
      const shipCells = ship.getCells();

      for (const cell of shipCells) {
        if (occupiedCells.some(pos => this.isSamePosition(pos, cell))) {
          return false;
        }
        occupiedCells.push(cell);
      }
    }

    return true;
  }

  private calculateLastCell(ship: ShipData): Position {
    const lastCell = { ...ship.position };

    if (ship.direction) {
      lastCell.x += ship.length - 1;
    } else {
      lastCell.y += ship.length - 1;
    }

    return lastCell;
  }

  private isSamePosition(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  private getGameById(gameId: string) {
    return Game.getGame(gameId);
  }

  private getPlayerSocket(playerId: string): WebSocket | undefined {
    return this.playerController.getPlayerConnection(playerId);
  }

  private getShips(gameId: string, playerGameId: string): ShipData[] {
    const game = this.getGameById(gameId);

    if (!game) {
      console.error(`Game with id ${gameId} not found`);
      return [];
    }

    const playerBoard = game.getPlayerBoard(playerGameId);

    if (!playerBoard) {
      console.error(`Board for player ${playerGameId} not found in game ${gameId}`);
      return [];
    }

    return playerBoard.ships.map(ship => ({
      position: {
        x: ship.position.x,
        y: ship.position.y,
      },
      direction: ship.direction,
      length: ship.length,
      type: ship.type,
    }));
  }
}