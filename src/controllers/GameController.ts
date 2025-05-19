import { Game } from '../models/Game.js';
import { WebSocketMessage, Position } from '../types/index.js';
import { PlayerController } from './PlayerController.js';
import { RoomController } from './RoomController.js';

export class GameController {
  private playerController: PlayerController;
  private roomController: RoomController;

  constructor(playerController: PlayerController, roomController: RoomController) {
    this.playerController = playerController;
    this.roomController = roomController;
  }

  public createGame(playerId: string): string {
    return Game.createGame(playerId);
  }

  public getGameById(gameId: string) {
    return Game.getGame(gameId);
  }

  public addPlayerToGame(gameId: string, playerId: string): string | null {
    return Game.addPlayer(gameId, playerId);
  }

  public processAttack(
    gameId: string,
    x: number,
    y: number,
    attackerId: string
  ): void {
    const gameState = Game.getGame(gameId);

    if (!gameState) {
      console.error(`Game with id ${gameId} not found`);
      return;
    }

    const attackResult = Game.attack(gameId, attackerId, { x, y });

    if (!attackResult) {
      console.error('Attack failed');
      return;
    }

    const attackResponse: WebSocketMessage = {
      type: 'attack',
      data: {
        position: {
          x,
          y,
        },
        currentPlayer: attackerId,
        status: attackResult.status,
      },
      id: 0,
    };

    this.roomController.sendMessageToRoom(gameId, attackResponse);

    if (attackResult.status === 'killed' && attackResult.surroundingCells) {
      this.sendMissForCellsAroundShip(gameId, attackResult.surroundingCells, attackerId);
    }

    const updatedGame = Game.getGame(gameId);

    if (!updatedGame) {
      console.error(`Game with id ${gameId} not found after attack`);
      return;
    }

    if (updatedGame.isFinished && updatedGame.winner) {
      this.finishGame(gameId, updatedGame.winner);
      return;
    }

    const turnResponse: WebSocketMessage = {
      type: 'turn',
      data: {
        currentPlayer: updatedGame.currentTurn,
      },
      id: 0,
    };

    this.roomController.sendMessageToRoom(gameId, turnResponse);
  }

  private sendMissForCellsAroundShip(
    gameId: string,
    cells: Position[],
    attackerId: string
  ): void {
    for (const cell of cells) {
      const missResponse: WebSocketMessage = {
        type: 'attack',
        data: {
          position: {
            x: cell.x,
            y: cell.y,
          },
          currentPlayer: attackerId,
          status: 'miss',
        },
        id: 0,
      };

      this.roomController.sendMessageToRoom(gameId, missResponse);
    }
  }

  public processRandomAttack(gameId: string, attackerId: string): void {

    const attackResult = Game.randomAttack(gameId, attackerId);

    if (!attackResult) {
      console.error('Random attack failed');
      return;
    }

    if (attackResult.position) {
      const { x, y } = attackResult.position;

      const attackResponse: WebSocketMessage = {
        type: 'attack',
        data: {
          position: { x, y },
          currentPlayer: attackerId,
          status: attackResult.status,
        },
        id: 0,
      };

      this.roomController.sendMessageToRoom(gameId, attackResponse);

      if (attackResult.status === 'killed' && attackResult.surroundingCells) {
        this.sendMissForCellsAroundShip(gameId, attackResult.surroundingCells, attackerId);
      }
    }

    const updatedGame = Game.getGame(gameId);

    if (!updatedGame) {
      console.error(`Game with id ${gameId} not found after random attack`);
      return;
    }

    if (updatedGame.isFinished && updatedGame.winner) {
      this.finishGame(gameId, updatedGame.winner);
      return;
    }

    const turnResponse: WebSocketMessage = {
      type: 'turn',
      data: {
        currentPlayer: updatedGame.currentTurn,
      },
      id: 0,
    };

    this.roomController.sendMessageToRoom(gameId, turnResponse);
  }

  private finishGame(gameId: string, winnerId: string): void {
    const finishResponse: WebSocketMessage = {
      type: 'finish',
      data: {
        winPlayer: winnerId,
      },
      id: 0,
    };

    this.roomController.sendMessageToRoom(gameId, finishResponse);

    const gameState = Game.getGame(gameId);

    if (gameState) {
      this.playerController.updatePlayerWin(winnerId);
    }

    this.cleanupGame(gameId);
  }

  private cleanupGame(gameId: string): void {
    Game.deleteGame(gameId);

    this.roomController.removeRoom(gameId);
  }
}
