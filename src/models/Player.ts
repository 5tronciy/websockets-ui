
import { PlayerState } from '../types/index.js';
import { generateId } from '../utils/index.js';


export class Player {
  private static players: Map<string, PlayerState> = new Map();

  static registerOrLogin(name: string, password: string): { index: string, error: boolean, errorText: string } {
    const existingPlayer = [...Player.players.values()].find(p => p.name === name);

    if (existingPlayer) {
      if (existingPlayer.password !== password) {
        return {
          index: '',
          error: true,
          errorText: 'Invalid password'
        };
      }

      const playerId = [...Player.players.entries()].find(([, p]) => p.name === name)?.[0] || '';
      return {
        index: playerId,
        error: false,
        errorText: ''
      };
    } else {
      const playerId = generateId();
      Player.players.set(playerId, {
        name,
        password,
        wins: 0,
        activeGame: null
      });

      return {
        index: playerId,
        error: false,
        errorText: ''
      };
    }
  }

  static getPlayer(id: string): PlayerState | undefined {
    return Player.players.get(id);
  }

  static setActiveGame(playerId: string, gameId: string | number | null): boolean {
    const player = Player.players.get(playerId);
    if (!player) return false;

    player.activeGame = gameId;
    Player.players.set(playerId, player);
    return true;
  }

  static incrementWins(playerId: string): boolean {
    const player = Player.players.get(playerId);
    if (!player) return false;

    player.wins++;
    Player.players.set(playerId, player);
    return true;
  }

  static getWinners(): { name: string, wins: number }[] {
    return [...Player.players.values()]
      .map(p => ({ name: p.name, wins: p.wins }))
      .sort((a, b) => b.wins - a.wins);
  }
}