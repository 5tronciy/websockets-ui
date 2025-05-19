import { Position, ShipData } from '../types/index.js';
import { getShipCells, isSamePosition } from '../utils/index.js';

export class Ship {
  position: Position;
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
  hits: Position[];

  constructor(data: ShipData) {
    this.position = data.position;
    this.direction = data.direction;
    this.length = data.length;
    this.type = data.type;
    this.hits = [];
  }

  isHit(shot: Position): boolean {
    const shipCells = getShipCells(this);
    return shipCells.some(cell => isSamePosition(cell, shot));
  }

  hit(position: Position): boolean {
    if (!this.isHit(position)) return false;

    if (!this.hits.some(pos => isSamePosition(pos, position))) {
      this.hits.push({ ...position });
    }

    return true;
  }

  isSunk(): boolean {
    const shipCells = getShipCells(this);
    return shipCells.every(cell =>
      this.hits.some(hit => isSamePosition(hit, cell))
    );
  }

  getCells(): Position[] {
    return getShipCells(this);
  }

  toObject(): ShipData {
    return {
      position: { ...this.position },
      direction: this.direction,
      length: this.length,
      type: this.type
    };
  }
}