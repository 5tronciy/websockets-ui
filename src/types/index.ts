import { Board } from "../models/Board.js";

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
  id: number;
}

// Player related types
export interface PlayerData {
  name: string;
  password: string;
}

export interface PlayerInfo {
  name: string;
  index: string | number;
  error?: boolean;
  errorText?: string;
}

export interface WinnerInfo {
  name: string;
  wins: number;
}

export interface AddUserToRoomData {
  indexRoom: string;
}

// Room related types
export interface RoomUser {
  name: string;
  index: string | number;
}

export interface Room {
  roomId: string | number;
  roomUsers: RoomUser[];
}

export interface GameInfo {
  idGame: string | number;
  idPlayer: string | number;
}

// Ship related types
export type ShipType = 'small' | 'medium' | 'large' | 'huge';

export interface Position {
  x: number;
  y: number;
}

export interface ShipData {
  position: Position;
  direction: boolean; // true for horizontal, false for vertical
  length: number;
  type: ShipType;
}

export interface AddShipsData {
  gameId: string | number;
  ships: ShipData[];
  indexPlayer: string | number;
}

export interface StartGameData {
  ships: ShipData[];
  currentPlayerIndex: string | number;
}

// Game related types
export interface AttackData {
  gameId: string | number;
  x: number;
  y: number;
  indexPlayer: string | number;
}

export interface RandomAttackData {
  gameId: string | number;
  indexPlayer: string | number;
}

export type AttackStatus = 'miss' | 'shot' | 'killed';

export interface AttackResult {
  status: AttackStatus;
  ship?: any;
  position?: any;
  surroundingCells?: any;
}

export interface TurnData {
  currentPlayer: string | number;
}

export interface FinishData {
  winPlayer: string | number;
}

export interface GameState {
  id: string;
  players: string[];
  playerIds: Record<string, string>;
  boards: Record<string, BoardState>;
  currentTurn: string | number | null;
  isStarted: boolean;
  isFinished: boolean;
  winner: string | null;
  areAllPlayersReady: boolean;
  getPlayerBoard: (playerGameId: string) => Board | null;
}

export interface BoardState {
  ships: ShipData[];
  shots: Position[];
  hits: Position[];
}

export interface PlayerState {
  name: string;
  password: string;
  wins: number;
  activeGame: string | number | null;
}

export interface CellState {
  x: number;
  y: number;
  isShot: boolean;
  hasShip: boolean;
  shipId?: string | number;
}