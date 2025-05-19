import { BoardState, Position, ShipData } from '../types/index.js';

import { getShipSurroundingCells, isSamePosition } from '../utils/index.js';
import { Ship } from './Ship.js';

export class Board {
  ships: Ship[];
  shots: Position[];

  constructor(ships: ShipData[] = []) {
    this.ships = ships.map(shipData => new Ship(shipData));
    this.shots = [];
  }

  addShips(ships: Ship[]): void {
    this.ships = [...ships];
  }

  processShot(shot: Position): 'miss' | 'killed' | 'shot' {
    if (this.shots.some(pos => isSamePosition(pos, shot))) {
      return 'miss';
    }

    this.shots.push({ ...shot });

    for (const ship of this.ships) {
      if (ship.isHit(shot)) {
        ship.hit(shot);

        if (ship.isSunk()) {
          const surroundingCells = getShipSurroundingCells(ship);
          for (const cell of surroundingCells) {
            if (!this.shots.some(pos => isSamePosition(pos, cell))) {
              this.shots.push({ ...cell });
            }
          }
          return 'killed';
        }

        return 'shot';
      }
    }

    return 'miss';
  }

  areAllShipsSunk(): boolean {
    return this.ships.every(ship => ship.isSunk());
  }

  getValidShotPositions(): Position[] {
    const validPositions: Position[] = [];

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const pos = { x, y };
        if (!this.shots.some(shot => isSamePosition(shot, pos))) {
          validPositions.push(pos);
        }
      }
    }

    return validPositions;
  }

  getRandomShotPosition(): Position | null {
    const validPositions = this.getValidShotPositions();
    if (validPositions.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * validPositions.length);
    return validPositions[randomIndex];
  }

  toObject(): BoardState {
    return {
      ships: this.ships.map(ship => ship.toObject()),
      shots: [...this.shots],
      hits: this.shots.filter(shot =>
        this.ships.some(ship => ship.isHit(shot))
      )
    };
  }
}