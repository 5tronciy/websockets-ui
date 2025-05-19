import { Position, ShipData } from '../types/index.js';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function isSamePosition(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

export function getShipCells(ship: ShipData): Position[] {
  const cells: Position[] = [];
  const { position, direction, length } = ship;

  for (let i = 0; i < length; i++) {
    cells.push({
      x: direction ? position.x + i : position.x,
      y: direction ? position.y : position.y + i
    });
  }

  return cells;
}

export function getShipSurroundingCells(ship: ShipData): Position[] {
  const shipCells = getShipCells(ship);
  const surroundingCells: Position[] = [];

  shipCells.forEach(cell => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const newPos = { x: cell.x + dx, y: cell.y + dy };

        if (!surroundingCells.some(pos => isSamePosition(pos, newPos)) &&
          !shipCells.some(pos => isSamePosition(pos, newPos))) {
          surroundingCells.push(newPos);
        }
      }
    }
  });

  return surroundingCells;
}

export function isValidPosition(pos: Position): boolean {
  return pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10;
}

export function doShipsOverlap(ships: ShipData[]): boolean {
  const allCells: Position[] = [];

  for (const ship of ships) {
    const shipCells = getShipCells(ship);

    for (const cell of shipCells) {
      if (allCells.some(pos => isSamePosition(pos, cell))) {
        return true;
      }
      allCells.push(cell);
    }
  }

  return false;
}

export function areShipsValid(ships: ShipData[]): boolean {
  for (const ship of ships) {
    const shipCells = getShipCells(ship);
    for (const cell of shipCells) {
      if (!isValidPosition(cell)) {
        return false;
      }
    }
  }

  if (doShipsOverlap(ships)) {
    return false;
  }

  const shipCounts: Record<ShipData['type'], number> = {
    small: 0,
    medium: 0,
    large: 0,
    huge: 0
  };

  ships.forEach(ship => {
    shipCounts[ship.type]++;
  });

  return shipCounts.small === 4 &&
    shipCounts.medium === 3 &&
    shipCounts.large === 2 &&
    shipCounts.huge === 1;
}

export function generateRandomPosition(): Position {
  return {
    x: Math.floor(Math.random() * 10),
    y: Math.floor(Math.random() * 10)
  };
}

export function parseMessage(data: string): any {
  try {
    return JSON.stringify(JSON.parse(data));
  } catch (error) {
    console.error('Failed to parse message:', error);
    return null;
  }
}