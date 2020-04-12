import { ImageTile } from '@hyperion-framework/types';

export function sampledTilesToTiles(
  width: number,
  height: number,
  sampledTiles: ImageTile[]
): ImageTile[] {
  const maxDim = width > height ? width : height;
  const len = sampledTiles.length;
  const newTiles: ImageTile[] = [];

  for (let i = 0; i < len; i++) {
    const tile = sampledTiles[i];
    let lastSize = tile.scaleFactors[0];
    let curWidth = maxDim / lastSize;
    const scaleFactors = [lastSize];
    while (curWidth >= tile.width) {
      lastSize = lastSize * 2;
      scaleFactors.push(lastSize);
      curWidth = curWidth / 2;
    }

    newTiles.push({
      ...tile,
      scaleFactors,
    });
  }

  return newTiles;
}
