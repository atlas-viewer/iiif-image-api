import { Service } from '@hyperion-framework/types';
import { FixedSizeImageService } from '../types';

/**
 * Returns a fixed size image using the tile using the largest available size,
 * or the smallest scale factor.
 *
 * @param service
 */
export function getSmallestScaleFactorAsSingleImage(
  service: Service
): FixedSizeImageService | null {
  if (!service.width || !service.height) {
    return null;
  }

  if (service.tiles) {
    const tiles = service.tiles.sort((a, b) => {
      return Math.max(...b.scaleFactors) - Math.max(...a.scaleFactors);
    });
    const len = tiles.length;
    for (let i = 0; i < len; i++) {
      const tile = tiles[i];
      // @todo possible refinement.
      // const targetSize = tile.width > (tile.height || 0) ? tile.width : tile.height;
      const targetSize = tile.width;
      if (!targetSize) {
        continue;
      }
      const sizeLen = tile.scaleFactors.length;
      const sortedScales = tile.scaleFactors.sort();
      for (let j = 0; j < sizeLen; j++) {
        const size = sortedScales[j];
        if (
          service.width / size <= targetSize &&
          service.height / size <= targetSize
        ) {
          return {
            id: service.id,
            type: 'fixed-service',
            width: (service.width / size) | 0,
            height: (service.height / size) | 0,
          };
        }
      }
    }
  }
  return null;
}
