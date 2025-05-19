import { AttackResult, BoardState, GameState, Position, ShipData } from '../types/index.js';
import { Board } from './Board.js';
import { generateId } from '../utils/index.js';
import { getShipSurroundingCells } from '../utils/index.js';

interface PlayerInfo {
  playerIndex: string;
  ready: boolean;
}

export class Game {
  private static games: Map<string, Game> = new Map();

  id: string;
  players: Map<string, PlayerInfo>;
  boards: Map<string, Board>;
  currentTurn: string | null;
  isStarted: boolean;
  isFinished: boolean;
  winner: string | null;
  playerIds: Record<string, string>;

  constructor(id: string, playerId: string) {
    this.id = id;
    this.players = new Map();
    this.boards = new Map();
    this.currentTurn = null;
    this.isStarted = false;
    this.isFinished = false;
    this.winner = null;
    this.playerIds = {};

    const playerGameId = generateId();
    this.playerIds[playerId] = playerGameId;
    this.players.set(playerGameId, {
      playerIndex: playerId,
      ready: false
    });
  }

  static createGame(player1Id: string): string {
    const gameId = generateId();
    const game = new Game(gameId, player1Id);
    Game.games.set(gameId, game);
    return gameId;
  }

  static addPlayer(gameId: string, playerId: string): string | null {
    const game = Game.games.get(gameId);
    if (!game) return null;

    if (game.players.size >= 2) return null;

    const existingPlayerGameId = game.playerIds[playerId];
    if (existingPlayerGameId) return existingPlayerGameId;

    const playerGameId = generateId();
    game.playerIds[playerId] = playerGameId;
    game.players.set(playerGameId, {
      playerIndex: playerId,
      ready: false
    });

    return playerGameId;
  }

  static attack(gameId: string, playerId: string, position: Position): AttackResult | null {
    const game = Game.games.get(gameId);
    if (!game) return null;

    if (!game.isStarted || game.isFinished) return null;
    if (game.currentTurn !== playerId) return null;

    // Find opponent
    let opponent: string | null = null;
    for (const [playerGameId, _] of game.players) {
      if (playerGameId !== playerId) {
        opponent = playerGameId;
        break;
      }
    }

    if (!opponent) return null;

    const opponentBoard = game.boards.get(opponent);
    if (!opponentBoard) return null;

    const status = opponentBoard.processShot(position);

    // If ship is killed, get surrounding cells
    let surroundingCells: Position[] | undefined = undefined;
    if (status === 'killed') {
      // Find the ship that was just sunk
      for (const ship of opponentBoard.ships) {
        if (ship.isHit(position) && ship.isSunk()) {
          surroundingCells = getShipSurroundingCells(ship);
          break;
        }
      }
    }

    if (opponentBoard.areAllShipsSunk()) {
      game.isFinished = true;
      game.winner = playerId;
    }

    if (status === 'miss') {
      game.currentTurn = opponent;
    }

    return {
      status,
      surroundingCells: surroundingCells
    };
  }

  static randomAttack(gameId: string, playerId: string): AttackResult | null {
    const game = Game.games.get(gameId);
    if (!game) return null;

    if (!game.isStarted || game.isFinished) return null;
    if (game.currentTurn !== playerId) return null;

    let opponent: string | null = null;
    for (const [playerGameId, _] of game.players) {
      if (playerGameId !== playerId) {
        opponent = playerGameId;
        break;
      }
    }

    if (!opponent) return null;

    const opponentBoard = game.boards.get(opponent);
    if (!opponentBoard) return null;

    const position = opponentBoard.getRandomShotPosition();
    if (!position) return null;

    const result = this.attack(gameId, playerId, position);

    if (result) {
      return {
        ...result,
        position
      };
    }

    return null;
  }

  static getGame(gameId: string): Game | undefined {
    return Game.games.get(gameId);
  }

  getPlayerBoard(playerGameId: string): Board | null {
    return this.boards.get(playerGameId) || null;
  }

  setCurrentPlayer(playerGameId: string): boolean {
    if (!this.players.has(playerGameId)) {
      return false;
    }

    this.currentTurn = playerGameId;
    this.isStarted = true;

    return true;
  }

  setPlayerReady(playerGameId: string): boolean {
    const playerInfo = this.players.get(playerGameId);

    if (!playerInfo) {
      return false;
    }

    playerInfo.ready = true;
    this.players.set(playerGameId, playerInfo);

    return true;
  }

  determineFirstPlayer(): string {
    const playerGameIds = Array.from(this.players.keys());
    const randomIndex = Math.floor(Math.random() * playerGameIds.length);

    return playerGameIds[randomIndex];
  }

  areAllPlayersReady(): boolean {
    if (this.players.size < 2) {
      return false;
    }

    for (const [_, playerInfo] of this.players) {
      if (!playerInfo.ready) {
        return false;
      }
    }

    return true;
  }

  static getPlayerGameId(gameId: string, playerId: string): string | null {
    const game = Game.games.get(gameId);
    if (!game) return null;

    return game.playerIds[playerId] || null;
  }

  static deleteGame(gameId: string): boolean {
    return Game.games.delete(gameId);
  }

  static isPlayerInGame(gameId: string, playerId: string): boolean {
    const game = Game.games.get(gameId);
    if (!game) return false;

    return Object.keys(game.playerIds).includes(playerId);
  }

  static getAllGames(): Game[] {
    return [...Game.games.values()];
  }

  toGameState(): GameState {
    const playerArr = Object.keys(this.playerIds);

    const boardsObj: Record<string, BoardState> = {};
    for (const [playerGameId, board] of this.boards.entries()) {
      boardsObj[playerGameId] = board.toObject();
    }

    return {
      id: this.id,
      players: playerArr,
      playerIds: this.playerIds,
      boards: boardsObj,
      currentTurn: this.currentTurn,
      isStarted: this.isStarted,
      isFinished: this.isFinished,
      winner: this.winner,
      areAllPlayersReady: this.areAllPlayersReady(),
      getPlayerBoard: (playerGameId: string) => this.getPlayerBoard(playerGameId)
    };
  }
}