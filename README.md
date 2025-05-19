# Battleship WebSocket Game

A real-time multiplayer Battleship game implementation using WebSockets. This project includes both server-side game logic and a front-end client interface.

## Features

- 🎮 Real-time multiplayer gameplay
- 🔐 User registration and authentication
- 🏆 Player win tracking and leaderboard
- 🚢 Full battleship game mechanics including:
  - Ship placement
  - Turn-based attacks
  - Ship damage tracking
  - Game state management
- 🔄 WebSocket-based real-time communication
- 🏠 Room-based matchmaking system

## Architecture

The application follows an MVC pattern:

- **Models**: Game, Board, Ship, Player, Room
- **Controllers**: Game, Player, Room, Ship
- **Server**: WebSocket server and HTTP static file server

## Installation

1. Clone/download the repository
2. Install dependencies:
   ```
   npm install
   ```

## Usage

### Development Mode

Start the server with automatic restart on file changes:

```
npm run start:dev
```

### Production Mode

Start the server without automatic restart:

```
npm run start
```

### Server Information

- WebSocket server runs on port 3000 by default
- Static HTTP server runs on port 8181
- Front-end is accessible at `http://localhost:8181`

## Game Flow

1. Players register or login
2. Player creates a room or joins an existing room
3. Players place their ships
4. Game starts when both players are ready
5. Players take turns attacking each other's boards
6. Game ends when all ships of one player are sunk

## WebSocket Message Types

| Message Type | Description |
|--------------|-------------|
| `reg` | Player registration and login |
| `create_room` | Create a new game room |
| `add_user_to_room` | Join an existing room |
| `add_ships` | Place ships on the board |
| `attack` | Attack a position on opponent's board |
| `randomAttack` | Make a random attack |
| `turn` | Indicate whose turn it is |
| `ships_placed` | Confirm ships have been placed |
| `start_game` | Begin the game |
| `finish` | End the game and declare winner |
| `update_winners` | Update the leaderboard |
| `update_room` | Update available rooms list |

## Ship Configuration

The game follows standard Battleship rules with:
- 1 Huge ship (4 cells)
- 2 Large ships (3 cells each)
- 3 Medium ships (2 cells each)
- 4 Small ships (1 cell each)

## Technologies

- Node.js
- TypeScript
- WebSockets (ws library)
- Static HTTP server

## Project Structure

```
src/
├── controllers/      # Game logic controllers
├── models/           # Data models
├── server/           # WebSocket and HTTP servers
├── types/            # TypeScript interfaces and types
├── utils/            # Helper functions
└── index.ts          # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source.

---

**Note**: For WebSocket client development, the client should connect to port 3000.