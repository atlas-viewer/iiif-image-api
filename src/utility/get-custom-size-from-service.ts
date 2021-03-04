import { ImageCandidate, Service } from '../types';
import { supportsCustomSizes } from './supports-custom-sizes';

/**
 * Get custom size from service
 *
 * Given an image service – usually a full one, de-referenced or embedded – this
 * will return a list of available image sizes (min and max width and height) that
 * can be used to construct a IIIF query to get an image at any size within those
 * bounds. This is only supported by some image services. If unsupported, this will
 * return an empty list.
 *
 * @param service
 */
export function getCustomSizeFromService(service: Service): ImageCandidate[] {
  if (!supportsCustomSizes(service)) {
    return [];
  }

  const imagesSizes: ImageCandidate[] = [];

  // Check for max width in profile.
  const profiles = Array.isArray(service.profile)
    ? service.profile
    : [service.profile];

  const pLen = profiles.length;
  for (let x = 0; x < pLen; x++) {
    const profile = profiles[x];
    if (typeof profile !== 'string') {
      if (profile.maxHeight || profile.maxWidth) {
        return [
          {
            id: getId(service),
            type: 'variable',
            minWidth: 0,
            minHeight: 0,
            maxHeight: (profile.maxHeight || profile.maxWidth) as number,
            maxWidth: (profile.maxWidth || profile.maxHeight) as number,
          },
        ];
      }
    }
  }

  if (service.tiles) {
    const len = service.tiles.length;
    for (let y = 0; y < len; y++) {
      const tile = service.tiles[y];
      if (tile.height || tile.width) {
        imagesSizes.push({
          id: getId(service),
          type: 'variable',
          minHeight: 0,
          minWidth: 0,
          maxHeight: tile.height || tile.width,
          maxWidth: tile.width,
        });
      }
    }
  }

  return imagesSizes;
}
