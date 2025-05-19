import { Player } from './Player.js';
import { Game } from './Game.js';
import { generateId } from '../utils/index.js';

export class Room {
  private static rooms: Map<string, string[]> = new Map(); // roomId -> playerIds

  static createRoom(playerId: string): string {
    const roomId = generateId();
    Room.rooms.set(roomId, [playerId]);

    const gameId = Game.createGame(playerId);

    Player.setActiveGame(playerId, gameId);

    return roomId;
  }

  static addPlayerToRoom(roomId: string, playerId: string): { gameId: string, playerGameId: string } | null {
    const room = Room.rooms.get(roomId);
    if (!room) return null;

    if (room.length >= 2) return null;
    if (room.includes(playerId)) return null;

    room.push(playerId);
    Room.rooms.set(roomId, room);

    const games = Game.getAllGames();
    const gameMatch = games.find(game =>
      game.players.size === 1
    );

    if (!gameMatch) return null;

    const playerGameId = Game.addPlayer(gameMatch.id as string, playerId);
    if (!playerGameId) return null;

    Player.setActiveGame(playerId, gameMatch.id);

    Room.rooms.delete(roomId);

    return {
      gameId: gameMatch.id as string,
      playerGameId
    };
  }

  static getAvailableRooms(): { roomId: string | number, roomUsers: { name: string, index: string | number }[] }[] {
    const rooms: { roomId: string | number, roomUsers: { name: string, index: string | number }[] }[] = [];

    for (const [roomId, playerIds] of Room.rooms.entries()) {
      if (playerIds.length === 1) {
        const roomUsers: { name: string, index: string | number }[] = [];

        for (const playerId of playerIds) {
          const player = Player.getPlayer(playerId);
          if (player) {
            roomUsers.push({
              name: player.name,
              index: playerId
            });
          }
        }

        rooms.push({
          roomId,
          roomUsers
        });
      }
    }

    return rooms;
  }

  static deleteRoom(roomId: string): boolean {
    return Room.rooms.delete(roomId);
  }

  static getRoom(roomId: string): string[] | undefined {
    return Room.rooms.get(roomId);
  }
}